// ============================================================
// MEUJURÍDICO.AI — Document Orchestrator
// Edge Function: orchestrate_document
// Pipeline: PLAN → GENERATE_SECTION → VALIDATE_SECTION → CONSOLIDATE → FINALIZE
//
// REGRAS ABSOLUTAS:
// - Todo output de IA persiste em document_sections
// - Todo job registrado em ai_jobs (antes e depois)
// - Todo evento registrado em audit_logs
// - Falha em seção não cancela o pipeline — continua e marca failed
// - Max 2 retries por seção (spec v2.0)
// - NENHUMA chamada direta à Claude — toda execução via skills
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type {
  DocumentType, ExecutionStage, OrchestratorResult,
  OrchestrationPlan, SectionPlan, SectionMemory,
  ProcessContext, SkillInput, SkillOutput, AgentId
} from '../types/index.ts';
import { getSkill } from '../skill_registry/index.ts';
import { getAgent } from '../agents/definitions.ts';
import { executeSkill } from '../skills/skill_executor.ts';
import { getOrgProvider, type LLMProvider, ProviderNotConfiguredError } from '../skills/llm_provider.ts';

const MAX_RETRIES = 2; // spec v2.0

// ─────────────────────────────────────────────
// Entry point — chamado pela Edge Function
// ─────────────────────────────────────────────

export async function orchestrateDocument(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  userId: string,
  options: { forceRegenerate?: boolean; sectionIds?: string[] } = {}
): Promise<OrchestratorResult> {

  const result: OrchestratorResult = {
    success: false,
    document_id: documentId,
    stage: 'PLAN',
    sections_completed: 0,
    sections_failed: 0,
    total_cost_usd: 0,
    errors: [],
  };

  try {
    // 1. Carregar documento e processo
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('*, processes(*)')
      .eq('id', documentId)
      .single();

    if (docErr || !doc) throw new Error(`Documento não encontrado: ${docErr?.message}`);

    const processCtx: ProcessContext = {
      process_id: doc.process_id,
      org_id: doc.org_id,
      objeto: doc.processes.objeto,
      tipo_objeto: doc.processes.tipo_objeto,
      valor_estimado: doc.processes.valor_estimado,
      modalidade_prevista: doc.processes.modalidade_prevista,
      dotacao_orcamentaria: doc.processes.dotacao_orcamentaria,
      dados_base: doc.processes.dados_base || {},
    };

    // Resolver provider LLM da organização (SEM FALLBACK)
    let orgProvider: LLMProvider;
    try {
      orgProvider = await getOrgProvider(supabase, doc.org_id as string);
    } catch (err) {
      await logAudit(supabase, {
        org_id: doc.org_id, user_id: userId, action: 'orchestrator.provider_error',
        entity_type: 'document', entity_id: documentId,
        new_value: { error: String(err) },
      });
      result.errors.push(`Provider LLM não configurado: ${String(err)}`);
      return result;
    }

    await logAudit(supabase, {
      org_id: doc.org_id, user_id: userId, action: 'orchestrator.started',
      entity_type: 'document', entity_id: documentId,
      new_value: { stage: 'PLAN', doc_type: doc.doc_type, llm_provider: orgProvider },
    });

    // ──────────────────────────────────────────
    // STAGE 1: PLAN
    // ──────────────────────────────────────────
    result.stage = 'PLAN';
    const plan = await stagePlan(supabase, doc, processCtx, userId);

    await supabase.from('documents')
      .update({ total_steps: plan.total_sections, updated_at: new Date().toISOString() })
      .eq('id', documentId);

    // Filtrar seções se reprocessamento parcial
    const sectionsToProcess = options.sectionIds
      ? plan.sections.filter(s => options.sectionIds!.includes(s.section_id))
      : plan.sections;

    // ──────────────────────────────────────────
    // STAGE 2: GENERATE_SECTION (por seção, em ordem)
    // ──────────────────────────────────────────
    result.stage = 'GENERATE_SECTION';
    const sectionMemories: SectionMemory[] = [];

    // Carregar memórias de seções já existentes (reprocessamento parcial)
    if (options.sectionIds) {
      const { data: existingSections } = await supabase
        .from('document_sections')
        .select('*')
        .eq('document_id', documentId)
        .eq('status', 'ai_generated');

      for (const s of existingSections || []) {
        sectionMemories.push(extractSectionMemory(s));
      }
    }

    for (const sectionPlan of sectionsToProcess) {
      // Verificar dependências
      const depsOk = await checkDependencies(supabase, documentId, sectionPlan.depends_on);
      if (!depsOk) {
        result.errors.push(`Seção ${sectionPlan.section_id}: dependências não atendidas`);
        result.sections_failed++;
        continue;
      }

      const genResult = await stageGenerateSection(
        supabase, doc, sectionPlan, processCtx, sectionMemories, userId, orgProvider
      );

      result.total_cost_usd += genResult.cost_usd;

      if (genResult.success) {
        result.sections_completed++;
        sectionMemories.push(genResult.memory!);

        // STAGE 3: VALIDATE_SECTION (inline, por seção)
        const valResult = await stageValidateSection(
          supabase, doc, sectionPlan, genResult.memory!, processCtx, userId, orgProvider
        );
        result.total_cost_usd += valResult.cost_usd;

        if (!valResult.success) {
          result.errors.push(`Validação falhou na seção ${sectionPlan.section_id}: ${valResult.error}`);
        }
      } else {
        result.sections_failed++;
        result.errors.push(`Geração falhou na seção ${sectionPlan.section_id}: ${genResult.error}`);
      }
    }

    // ──────────────────────────────────────────
    // STAGE 4: CONSOLIDATE
    // ──────────────────────────────────────────
    result.stage = 'CONSOLIDATE';
    const consolidateResult = await stageConsolidate(supabase, doc, sectionMemories, userId, orgProvider);
    result.total_cost_usd += consolidateResult.cost_usd;

    // ──────────────────────────────────────────
    // STAGE 5: FINALIZE
    // ──────────────────────────────────────────
    result.stage = 'FINALIZE';
    const finalizeResult = await stageFinalize(supabase, doc, userId);
    result.total_cost_usd += finalizeResult.cost_usd;

    // Atualizar status do documento
    const finalStatus = result.sections_failed > 0 ? 'em_elaboracao' : 'em_revisao';
    await supabase.from('documents')
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
      .eq('id', documentId);

    // Atualizar usage_records
    await updateUsage(supabase, doc.org_id, userId, {
      ai_jobs_run: sectionsToProcess.length + 2, // +consolidate +finalize
      ai_cost_usd: result.total_cost_usd,
    });

    await logAudit(supabase, {
      org_id: doc.org_id, user_id: userId, action: 'orchestrator.completed',
      entity_type: 'document', entity_id: documentId,
      new_value: { sections_completed: result.sections_completed, total_cost_usd: result.total_cost_usd },
    });

    result.success = result.sections_failed === 0;
    return result;

  } catch (err) {
    result.errors.push(String(err));
    return result;
  }
}

// ─────────────────────────────────────────────
// PLAN: Monta plano de seções a partir do template
// ─────────────────────────────────────────────

async function stagePlan(
  supabase: ReturnType<typeof createClient>,
  doc: Record<string, unknown>,
  processCtx: ProcessContext,
  userId: string
): Promise<OrchestrationPlan> {

  // Carregar template do documento
  const { data: template } = await supabase
    .from('document_templates')
    .select('sections_plan')
    .eq('doc_type', doc.doc_type as string)
    .eq('is_default', true)
    .single();

  if (!template) throw new Error(`Template não encontrado para ${doc.doc_type}`);

  const sectionsRaw: Record<string, unknown>[] = template.sections_plan as Record<string, unknown>[];

  // Criar/atualizar linhas em document_sections
  const sections: SectionPlan[] = [];
  for (let i = 0; i < sectionsRaw.length; i++) {
    const s = sectionsRaw[i];
    const sectionId = s.section_id as string;

    // Upsert da seção no banco
    await supabase.from('document_sections').upsert({
      document_id: doc.id as string,
      org_id: doc.org_id as string,
      section_id: sectionId,
      section_number: s.section_number as string,
      title: s.title as string,
      agent: s.agent as string,
      order_index: i,
      depends_on: s.depends_on as string[] || [],
      is_required: s.required as boolean ?? true,
      status: 'empty',
      structured_data: {},
      created_by: userId,
    }, { onConflict: 'document_id,section_id', ignoreDuplicates: true });

    sections.push({
      section_id: sectionId,
      section_number: s.section_number as string,
      title: s.title as string,
      agent: s.agent as string as AgentId,
      skills: getSectionSkills(sectionId, doc.doc_type as string),
      depends_on: s.depends_on as string[] || [],
      order_index: i,
      estimated_tokens: estimateTokens(sectionId),
    });
  }

  return {
    document_id: doc.id as string,
    doc_type: doc.doc_type as DocumentType,
    sections,
    total_sections: sections.length,
    estimated_cost_usd: sections.reduce((acc, s) => acc + (s.estimated_tokens * 0.000003), 0),
  };
}

// ─────────────────────────────────────────────
// GENERATE_SECTION: Gera texto de uma seção VIA SKILL
// ─────────────────────────────────────────────

async function stageGenerateSection(
  supabase: ReturnType<typeof createClient>,
  doc: Record<string, unknown>,
  sectionPlan: SectionPlan,
  processCtx: ProcessContext,
  sectionMemories: SectionMemory[],
  userId: string,
  provider: LLMProvider
): Promise<{ success: boolean; cost_usd: number; error?: string; memory?: SectionMemory }> {

  // Carregar structured_data da seção (preenchido pelo usuário no formulário)
  const { data: section } = await supabase
    .from('document_sections')
    .select('*')
    .eq('document_id', doc.id as string)
    .eq('section_id', sectionPlan.section_id)
    .single();

  // Criar job
  const jobId = await createAiJob(supabase, {
    org_id: doc.org_id as string,
    document_id: doc.id as string,
    section_id: section?.id,
    job_type: 'generate_section',
    execution_stage: 'GENERATE_SECTION',
    agent: sectionPlan.agent,
    user_id: userId,
    input: { section_id: sectionPlan.section_id, structured_data: section?.structured_data || {} },
  });

  // Marcar seção como em geração
  await supabase.from('document_sections')
    .update({ status: 'draft', last_edited_by: userId })
    .eq('document_id', doc.id as string)
    .eq('section_id', sectionPlan.section_id);

  // Buscar normas relevantes via RAG
  const ragContext = await fetchNormativeContext(
    supabase, sectionPlan.section_id, doc.doc_type as string, processCtx.tipo_objeto
  );

  // Construir input da skill
  const skillInput: SkillInput = {
    skill_name: 'generate_section_skill',
    job_id: jobId,
    document_id: doc.id as string,
    section_id: section?.id,
    org_id: doc.org_id as string,
    user_id: userId,
    process_context: processCtx,
    section_memories: sectionMemories,
    payload: {
      section_id: sectionPlan.section_id,
      section_title: sectionPlan.title,
      structured_data: section?.structured_data || {},
      normative_context: ragContext,
      target_length: getTargetLength(sectionPlan.section_id),
    },
  };

  // Executar com retry — via executeSkill (NUNCA chamada direta à Claude)
  let lastError = '';
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const output = await executeSkill('generate_section_skill', skillInput, provider);

      if (!output.success) {
        throw new Error(output.error || 'Skill retornou falha sem mensagem');
      }

      // Persistir resultado
      await supabase.from('document_sections').update({
        rendered_content: output.rendered_content,
        structured_data: { ...section?.structured_data, ...output.structured_data },
        key_facts: output.key_facts || [],
        values_declared: output.values_declared || {},
        commitments: (output as Record<string, unknown>).commitments || [],
        defined_terms: output.defined_terms || {},
        status: 'ai_generated',
        has_warnings: (output.warnings || []).length > 0,
        last_edited_by: userId,
        updated_at: new Date().toISOString(),
      })
        .eq('document_id', doc.id as string)
        .eq('section_id', sectionPlan.section_id);

      // Finalizar job
      await updateAiJob(supabase, jobId, {
        status: 'completed',
        output: output as unknown as Record<string, unknown>,
        tokens: output.tokens_used,
        cost_usd: output.cost_usd,
      });

      await logAudit(supabase, {
        org_id: doc.org_id as string, user_id: userId,
        action: 'section.generated',
        entity_type: 'section', entity_id: section?.id,
        document_id: doc.id as string, section_id: section?.id,
        new_value: { section_id: sectionPlan.section_id, tokens: output.tokens_used },
      });

      return {
        success: true,
        cost_usd: output.cost_usd,
        memory: {
          section_id: sectionPlan.section_id,
          key_facts: output.key_facts || [],
          values_declared: output.values_declared || {},
          commitments: (output as Record<string, unknown>).commitments as string[] || [],
          defined_terms: output.defined_terms || {},
          normative_refs: output.normative_refs || [],
        },
      };

    } catch (err) {
      lastError = String(err);
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); // backoff
      }
    }
  }

  // Todas as tentativas falharam
  await supabase.from('document_sections')
    .update({ status: 'empty', has_warnings: true })
    .eq('document_id', doc.id as string)
    .eq('section_id', sectionPlan.section_id);

  await updateAiJob(supabase, jobId, { status: 'failed', error: lastError });

  return { success: false, cost_usd: 0, error: lastError };
}

// ─────────────────────────────────────────────
// VALIDATE_SECTION: Validação jurídica VIA SKILL
// ─────────────────────────────────────────────

async function stageValidateSection(
  supabase: ReturnType<typeof createClient>,
  doc: Record<string, unknown>,
  sectionPlan: SectionPlan,
  sectionMemory: SectionMemory,
  processCtx: ProcessContext,
  userId: string,
  provider: LLMProvider
): Promise<{ success: boolean; cost_usd: number; error?: string }> {

  const { data: section } = await supabase
    .from('document_sections')
    .select('*')
    .eq('document_id', doc.id as string)
    .eq('section_id', sectionPlan.section_id)
    .single();

  if (!section?.rendered_content) return { success: true, cost_usd: 0 };

  const jobId = await createAiJob(supabase, {
    org_id: doc.org_id as string,
    document_id: doc.id as string,
    section_id: section.id,
    job_type: 'validate_section',
    execution_stage: 'VALIDATE_SECTION',
    agent: 'AGENT_JURIDICO',
    user_id: userId,
    input: { section_id: sectionPlan.section_id },
  });

  const ragContext = await fetchNormativeContext(
    supabase, sectionPlan.section_id, doc.doc_type as string, processCtx.tipo_objeto
  );

  const skillInput: SkillInput = {
    skill_name: 'legal_validation_skill',
    job_id: jobId,
    document_id: doc.id as string,
    section_id: section.id,
    org_id: doc.org_id as string,
    user_id: userId,
    process_context: processCtx,
    section_memories: [sectionMemory],
    payload: {
      section_id: sectionPlan.section_id,
      rendered_content: section.rendered_content,
      normative_refs: sectionMemory.normative_refs,
      doc_type: doc.doc_type as string,
      rag_context: ragContext,
    },
  };

  try {
    const output = await executeSkill('legal_validation_skill', skillInput, provider);

    if (!output.success) {
      throw new Error(output.error || 'Validação retornou falha');
    }

    await supabase.from('document_sections').update({
      validation_report: output.validation_report,
      validation_status: output.validation_report?.status,
      last_validated_at: new Date().toISOString(),
      has_warnings: output.validation_report?.issues?.some((i: Record<string, unknown>) => i.severity !== 'info') || false,
      status: output.validation_report?.status === 'rejected' ? 'ai_generated' : 'validated',
    })
      .eq('document_id', doc.id as string)
      .eq('section_id', sectionPlan.section_id);

    await updateAiJob(supabase, jobId, {
      status: 'completed', output: output as unknown as Record<string, unknown>,
      tokens: output.tokens_used, cost_usd: output.cost_usd,
    });

    return { success: true, cost_usd: output.cost_usd };

  } catch (err) {
    await updateAiJob(supabase, jobId, { status: 'failed', error: String(err) });
    return { success: false, cost_usd: 0, error: String(err) };
  }
}

// ─────────────────────────────────────────────
// CONSOLIDATE: Coerência cross-section VIA SKILL
// ─────────────────────────────────────────────

async function stageConsolidate(
  supabase: ReturnType<typeof createClient>,
  doc: Record<string, unknown>,
  sectionMemories: SectionMemory[],
  userId: string,
  provider: LLMProvider
): Promise<{ success: boolean; cost_usd: number }> {

  const jobId = await createAiJob(supabase, {
    org_id: doc.org_id as string,
    document_id: doc.id as string,
    job_type: 'consolidate',
    execution_stage: 'CONSOLIDATE',
    agent: 'AGENT_CONSOLIDATOR',
    user_id: userId,
    input: { section_count: sectionMemories.length },
  });

  const skillInput: SkillInput = {
    skill_name: 'document_consolidation_skill',
    job_id: jobId,
    document_id: doc.id as string,
    org_id: doc.org_id as string,
    user_id: userId,
    process_context: {
      process_id: '', org_id: doc.org_id as string,
      objeto: '', tipo_objeto: 'servico', dados_base: {},
    },
    section_memories: sectionMemories,
    payload: {
      document_id: doc.id as string,
      all_section_memories: sectionMemories,
    },
  };

  try {
    const output = await executeSkill('document_consolidation_skill', skillInput, provider);

    if (!output.success) {
      throw new Error(output.error || 'Consolidação retornou falha');
    }

    // Marcar seções com warnings de inconsistência
    const rawOutput = output as unknown as Record<string, unknown>;
    const sectionsWithWarnings = rawOutput.sections_with_warnings as string[] | undefined;
    if (sectionsWithWarnings?.length) {
      for (const sectionId of sectionsWithWarnings) {
        await supabase.from('document_sections')
          .update({ has_warnings: true })
          .eq('document_id', doc.id as string)
          .eq('section_id', sectionId);
      }
    }

    await updateAiJob(supabase, jobId, {
      status: 'completed', output: rawOutput,
      tokens: output.tokens_used, cost_usd: output.cost_usd,
    });

    await logAudit(supabase, {
      org_id: doc.org_id as string, user_id: userId,
      action: 'document.consolidated',
      entity_type: 'document', entity_id: doc.id as string,
      document_id: doc.id as string,
      new_value: { inconsistencies_found: (rawOutput.inconsistencies as unknown[])?.length || 0 },
    });

    return { success: true, cost_usd: output.cost_usd || 0 };

  } catch (err) {
    await updateAiJob(supabase, jobId, { status: 'failed', error: String(err) });
    return { success: false, cost_usd: 0 };
  }
}

// ─────────────────────────────────────────────
// FINALIZE: Padronização final (AGENT_RENDER)
// ─────────────────────────────────────────────

async function stageFinalize(
  supabase: ReturnType<typeof createClient>,
  doc: Record<string, unknown>,
  userId: string
): Promise<{ success: boolean; cost_usd: number }> {

  const jobId = await createAiJob(supabase, {
    org_id: doc.org_id as string,
    document_id: doc.id as string,
    job_type: 'finalize',
    execution_stage: 'FINALIZE',
    agent: 'AGENT_RENDER',
    user_id: userId,
    input: {},
  });

  // No FINALIZE, o AGENT_RENDER verifica padronização e prepara para export
  // O export real (DOCX/PDF) ocorre sob demanda via export_official_document_skill

  await updateAiJob(supabase, jobId, { status: 'completed', output: {}, tokens: { prompt: 0, completion: 0 }, cost_usd: 0 });

  await logAudit(supabase, {
    org_id: doc.org_id as string, user_id: userId,
    action: 'document.finalize_ready',
    entity_type: 'document', entity_id: doc.id as string,
    document_id: doc.id as string,
    new_value: { ready_for_export: true },
  });

  return { success: true, cost_usd: 0 };
}

// ─────────────────────────────────────────────
// Helpers — NENHUM contém chamada direta à Claude
// ─────────────────────────────────────────────

async function createAiJob(
  supabase: ReturnType<typeof createClient>,
  params: {
    org_id: string; document_id: string; section_id?: string;
    job_type: string; execution_stage: ExecutionStage;
    agent: string; user_id: string; input: Record<string, unknown>;
  }
): Promise<string> {
  const { data, error } = await supabase.from('ai_jobs').insert({
    org_id: params.org_id,
    document_id: params.document_id,
    section_id: params.section_id,
    job_type: params.job_type,
    execution_stage: params.execution_stage,
    agent: params.agent,
    status: 'running',
    input_payload: params.input,
    requested_by: params.user_id,
    started_at: new Date().toISOString(),
    llm_model: 'provider_from_org_settings',
  }).select('id').single();

  if (error) throw new Error(`Falha ao criar ai_job: ${error.message}`);
  return data.id;
}

async function updateAiJob(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  update: { status: string; output?: Record<string, unknown>; tokens?: { prompt: number; completion: number }; cost_usd?: number; error?: string }
) {
  await supabase.from('ai_jobs').update({
    status: update.status,
    output_payload: update.output || {},
    prompt_tokens: update.tokens?.prompt,
    completion_tokens: update.tokens?.completion,
    cost_usd: update.cost_usd,
    error_message: update.error,
    completed_at: new Date().toISOString(),
  }).eq('id', jobId);
}

async function logAudit(
  supabase: ReturnType<typeof createClient>,
  params: {
    org_id: string; user_id: string; action: string;
    entity_type: string; entity_id: string;
    document_id?: string; section_id?: string;
    old_value?: Record<string, unknown>; new_value?: Record<string, unknown>;
  }
) {
  await supabase.from('audit_logs').insert({
    org_id: params.org_id,
    user_id: params.user_id,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    document_id: params.document_id,
    section_id: params.section_id,
    old_value: params.old_value,
    new_value: params.new_value,
  });
}

async function fetchNormativeContext(
  supabase: ReturnType<typeof createClient>,
  sectionId: string,
  docType: string,
  tipoObjeto: string
): Promise<Record<string, unknown>[]> {
  // Busca semântica via pgvector
  const query = `${docType} ${sectionId} ${tipoObjeto} lei 14133 licitação`;
  const { data } = await supabase.rpc('search_rag_documents', {
    query_text: query,
    top_k: 5,
    min_similarity: 0.75,
  });
  return data || [];
}

async function checkDependencies(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  dependsOn: string[]
): Promise<boolean> {
  if (!dependsOn.length) return true;
  const { data } = await supabase
    .from('document_sections')
    .select('section_id, status')
    .eq('document_id', documentId)
    .in('section_id', dependsOn);

  return (data || []).every(s => ['ai_generated', 'validated', 'approved'].includes(s.status));
}

async function updateUsage(
  supabase: ReturnType<typeof createClient>,
  orgId: string, _userId: string,
  update: { ai_jobs_run: number; ai_cost_usd: number }
) {
  const month = new Date().toISOString().slice(0, 7) + '-01';
  await supabase.rpc('increment_usage', {
    p_org_id: orgId,
    p_month: month,
    p_ai_jobs: update.ai_jobs_run,
    p_cost_usd: update.ai_cost_usd,
  });
}

function extractSectionMemory(section: Record<string, unknown>): SectionMemory {
  return {
    section_id: section.section_id as string,
    key_facts: (section.key_facts as SectionMemory['key_facts']) || [],
    values_declared: (section.values_declared as Record<string, number>) || {},
    commitments: (section.commitments as string[]) || [],
    defined_terms: (section.defined_terms as Record<string, string>) || {},
    normative_refs: (section.normative_refs as SectionMemory['normative_refs']) || [],
  };
}

function getSectionSkills(sectionId: string, _docType: string): string[] {
  const specialSkills: Record<string, string[]> = {
    'etp_05': ['price_research_skill', 'generate_section_skill'],
    'etp_06': ['procurement_strategy_skill', 'generate_section_skill'],
    'etp_07': ['risk_analysis_skill', 'generate_section_skill'],
    'tr_04': ['price_research_skill', 'generate_section_skill'],
    'tr_07': ['risk_analysis_skill', 'generate_section_skill'],
  };
  return specialSkills[sectionId] || ['generate_section_skill'];
}

function getTargetLength(sectionId: string): string {
  const extended = ['etp_03', 'etp_07', 'tr_03', 'tr_07'];
  const concise = ['dfd_01', 'dfd_02', 'etp_01', 'etp_02'];
  if (extended.includes(sectionId)) return 'extended';
  if (concise.includes(sectionId)) return 'concise';
  return 'standard';
}

function estimateTokens(sectionId: string): number {
  const lengths: Record<string, number> = { extended: 6000, standard: 3000, concise: 1500 };
  return lengths[getTargetLength(sectionId)] || 3000;
}
