// ============================================================
// MEUJURÍDICO.AI — Skill Executor
// Camada de execução de LLM exclusiva das skills
// Toda execução de IA passa pelo llm_provider (multi-provider)
// ============================================================

import type { AgentId, SkillInput, SkillOutput, SectionMemory } from '../types/index.ts';
import { getSkill, type SkillDefinition } from '../skill_registry/index.ts';
import { getAgent } from '../agents/definitions.ts';
import { generateCompletion, type LLMProvider } from './llm_provider.ts';

// ─────────────────────────────────────────────
// Core: Executa uma skill registrada via LLM Provider
// ─────────────────────────────────────────────

export async function executeSkill(
    skillName: string,
    input: SkillInput,
    provider: LLMProvider            // OBRIGATÓRIO — sempre fornecido pelo orchestrator
): Promise<SkillOutput> {

    const skill = getSkill(skillName);
    if (!skill) {
        return {
            success: false,
            skill_name: skillName,
            job_id: input.job_id,
            warnings: [],
            error: `Skill "${skillName}" não encontrada no registro.`,
            tokens_used: { prompt: 0, completion: 0 },
            cost_usd: 0,
        };
    }

    const agent = getAgent(skill.agent);

    try {
        const userPrompt = buildSkillPrompt(skill, input);

        // Chamada universal via llm_provider (Claude, OpenAI ou Gemini)
        const response = await generateCompletion({
            provider: provider,
            systemPrompt: agent.system_prompt,
            messages: [{ role: 'user', content: userPrompt }],
            temperature: skill.config.temperature,
            maxTokens: skill.config.max_tokens,
            model: skill.config.model,
        });

        const parsed = response.parsed;

        return {
            success: true,
            skill_name: skillName,
            job_id: input.job_id,
            section_id: input.section_id,
            rendered_content: parsed.rendered_content as string | undefined,
            rendered_html: parsed.rendered_html as string | undefined,
            structured_data: parsed.structured_data as Record<string, unknown> | undefined,
            normative_refs: parsed.normative_refs as SkillOutput['normative_refs'],
            key_facts: parsed.key_facts as SkillOutput['key_facts'],
            values_declared: parsed.values_declared as Record<string, number> | undefined,
            defined_terms: parsed.defined_terms as Record<string, string> | undefined,
            validation_report: parsed.validation_report as SkillOutput['validation_report'],
            warnings: (parsed.warnings as string[]) || [],
            tokens_used: response.tokens_used,
            cost_usd: response.cost_usd,
        };

    } catch (err) {
        return {
            success: false,
            skill_name: skillName,
            job_id: input.job_id,
            section_id: input.section_id,
            warnings: [],
            error: String(err),
            tokens_used: { prompt: 0, completion: 0 },
            cost_usd: 0,
        };
    }
}

// ─────────────────────────────────────────────
// Prompt Builders por Skill
// ─────────────────────────────────────────────

function buildSkillPrompt(skill: SkillDefinition, input: SkillInput): string {
    const payload = input.payload as Record<string, unknown>;

    switch (skill.name) {
        case 'generate_section_skill':
            return buildGenerateSectionPrompt(input, payload);

        case 'legal_validation_skill':
            return buildValidationPrompt(input, payload);

        case 'procurement_strategy_skill':
            return buildProcurementPrompt(input, payload);

        case 'price_research_skill':
            return buildPriceResearchPrompt(input, payload);

        case 'risk_analysis_skill':
            return buildRiskAnalysisPrompt(input, payload);

        case 'audit_compliance_skill':
            return buildAuditCompliancePrompt(input, payload);

        case 'document_consolidation_skill':
            return buildConsolidationPrompt(input, payload);

        case 'interpret_requirement_skill':
            return buildInterpretPrompt(input, payload);

        case 'normative_rag_skill':
            return buildRagPrompt(input, payload);

        case 'export_official_document_skill':
            return buildExportPrompt(input, payload);

        default:
            return buildGenericPrompt(input, payload);
    }
}

// ── generate_section_skill ──
const TIPO_CONTEXTO: Record<string, string> = {
    dfd: `Você está gerando um Documento de Formalização de Demanda (DFD).
Base legal: Art. 12 da Lei 14.133/2021.
Objetivo: justificar a necessidade, estimar quantidade e valor, alinhar com planejamento anual.
Tom: técnico, objetivo, linguagem da administração pública brasileira.`,

    etp: `Você está gerando um Estudo Técnico Preliminar (ETP).
Base legal: Art. 18 da Lei 14.133/2021.
Objetivo: analisar viabilidade, soluções de mercado, estimar preços com 3+ fontes, justificar solução escolhida.
Tom: técnico, fundamentado, com referências normativas quando possível.`,

    tr: `Você está gerando um Termo de Referência (TR).
Base legal: Art. 6º, inciso XXIII da Lei 14.133/2021.
Objetivo: definir objeto com precisão, especificações técnicas, prazo, obrigações, critérios de julgamento e habilitação.
Tom: preciso, sem ambiguidade, linguagem jurídico-administrativa.`,

    edital: `Você está gerando um Edital de Licitação.
Base legal: Art. 25 da Lei 14.133/2021.
Objetivo: conter objeto, condições de participação, critérios de julgamento e habilitação, minutas de contratos.
Tom: formal, jurídico, sem margem para interpretações divergentes.`,

    projeto_basico: `Você está gerando um Projeto Básico.
Base legal: Art. 6º, inciso XXV da Lei 14.133/2021.
Aplicação: obras e serviços de engenharia.
Objetivo: especificações, orçamento detalhado, cronograma físico-financeiro.
Tom: técnico-engenharia com linguagem administrativa.`,

    mapa_risco: `Você está gerando um Mapa de Riscos da contratação.
Base legal: Art. 22, §3º da Lei 14.133/2021.
Objetivo: identificar, avaliar probabilidade/impacto e alocar riscos entre contratante e contratada.
Tom: analítico, objetivo, com justificativas para cada alocação de risco.`,

    custom: `Você está gerando um documento personalizado de contratação pública.
Referência: Lei 14.133/2021 e boas práticas de gestão pública.
Tom: técnico-administrativo, linguagem da administração pública brasileira.`
};

function buildGenerateSectionPrompt(input: SkillInput, payload: Record<string, unknown>): string {
    const docType = (payload.doc_type as string) || 'custom';
    const contextoTipo = TIPO_CONTEXTO[docType] || TIPO_CONTEXTO.custom;

    return `Gere o conteúdo técnico-formal da seção "${payload.section_title}" (ID: ${payload.section_id}).

CONTEXTO ESPECÍFICO DO TIPO DE DOCUMENTO:
${contextoTipo}

PROCESS CONTEXT:
${JSON.stringify(input.process_context, null, 2)}

DADOS ESTRUTURADOS DO FORMULÁRIO:
${JSON.stringify(payload.structured_data, null, 2)}

SECTION MEMORY DAS SEÇÕES ANTERIORES:
${JSON.stringify(input.section_memories.map(m => ({
        section: m.section_id,
        key_facts: m.key_facts,
        values_declared: m.values_declared,
        defined_terms: m.defined_terms,
    })), null, 2)}

NORMAS RELEVANTES (RAG):
${JSON.stringify(payload.normative_context, null, 2)}

TARGET LENGTH: ${payload.target_length}

Responda APENAS com JSON no formato:
\`\`\`json
{
  "rendered_content": "Texto completo em Markdown",
  "key_facts": [{"fact": "...", "source_section": "${payload.section_id}", "confidence": 0.9}],
  "values_declared": {"valor_estimado": 0},
  "commitments": [],
  "defined_terms": {},
  "normative_refs": [{"law": "Lei 14.133/2021", "article": "art. 18", "text": "..."}],
  "warnings": []
}
\`\`\``;
}

// ── legal_validation_skill ──
function buildValidationPrompt(input: SkillInput, payload: Record<string, unknown>): string {
    return `Valide juridicamente a seção abaixo conforme Lei 14.133/2021.

TIPO DE DOCUMENTO: ${payload.doc_type}

CONTEÚDO DA SEÇÃO:
${payload.rendered_content}

REFERÊNCIAS NORMATIVAS DECLARADAS:
${JSON.stringify(payload.normative_refs, null, 2)}

CONTEXTO RAG (normas relevantes):
${JSON.stringify(payload.rag_context, null, 2)}

Responda APENAS com JSON:
\`\`\`json
{
  "validation_report": {
    "status": "approved|approved_with_warnings|rejected",
    "issues": [{"severity": "error|warning|info", "code": "...", "message": "...", "suggestion": "..."}],
    "missing_fields": [],
    "tcu_compliance_score": 0.0
  },
  "suggested_corrections": []
}
\`\`\``;
}

// ── procurement_strategy_skill ──
function buildProcurementPrompt(input: SkillInput, payload: Record<string, unknown>): string {
    return `Defina a estratégia de contratação para o objeto abaixo.

TIPO DE OBJETO: ${payload.tipo_objeto}
VALOR ESTIMADO: ${payload.valor_estimado}
CONTEXTO DO PROCESSO:
${JSON.stringify(payload.process_context, null, 2)}
RESTRIÇÕES: ${JSON.stringify(payload.restricoes || [])}

Responda APENAS com JSON:
\`\`\`json
{
  "modalidade": "...",
  "justificativa_modalidade": "...",
  "criterio_julgamento": "...",
  "regime_execucao": "...",
  "parcelamento": {"recomendado": false, "justificativa": "..."},
  "normative_basis": []
}
\`\`\``;
}

// ── price_research_skill ──
function buildPriceResearchPrompt(input: SkillInput, payload: Record<string, unknown>): string {
    return `Analise os dados de pesquisa de preço e produza memória de cálculo.

ITEM: ${payload.item_description}
QUANTIDADE: ${payload.quantity}
REGISTROS DE PREÇO:
${JSON.stringify(payload.price_records, null, 2)}
MÉTODO DE EXCLUSÃO: ${payload.exclusion_method || 'cv'}

Responda APENAS com JSON:
\`\`\`json
{
  "valor_unitario_referencia": 0,
  "valor_total_estimado": 0,
  "records_valid": 0,
  "records_excluded": 0,
  "calculo_memoria": "Texto formal...",
  "warnings": [],
  "insufficient_sources": false
}
\`\`\``;
}

// ── risk_analysis_skill ──
function buildRiskAnalysisPrompt(input: SkillInput, payload: Record<string, unknown>): string {
    return `Gere a matriz de riscos da contratação conforme Lei 14.133 art. 22.

TIPO DE OBJETO: ${payload.tipo_objeto}
OBJETO: ${payload.objeto}
VALOR ESTIMADO: ${payload.valor_estimado}
MODALIDADE: ${payload.modalidade}
COMPLEXIDADE: ${payload.complexidade || 'media'}

Responda APENAS com JSON:
\`\`\`json
{
  "risks": [{"risk_id": "R01", "description": "...", "category": "...", "probability": "baixa|media|alta", "impact": "baixo|medio|alto", "risk_level": "aceitavel|moderado|critico", "mitigation": "...", "responsible": "contratante|contratada|compartilhado", "normative_basis": "..."}],
  "rendered_matrix": "Markdown com tabela formatada"
}
\`\`\``;
}

// ── audit_compliance_skill ──
function buildAuditCompliancePrompt(input: SkillInput, payload: Record<string, unknown>): string {
    return `Verifique a conformidade do documento completo para auditoria TCU/CGU.

DOCUMENT ID: ${payload.document_id}
DOC TYPE: ${payload.doc_type}
SEÇÕES:
${JSON.stringify(payload.all_sections, null, 2)}
AUDIT LOG SUMMARY:
${JSON.stringify(payload.audit_logs_summary, null, 2)}

Responda APENAS com JSON:
\`\`\`json
{
  "compliance_report": {},
  "overall_score": 0.0,
  "blocking_issues": [],
  "recommendations": [],
  "tcu_ready": false
}
\`\`\``;
}

// ── document_consolidation_skill ──
function buildConsolidationPrompt(input: SkillInput, payload: Record<string, unknown>): string {
    return `Verifique coerência entre todas as seções. Detecte inconsistências de valores, termos e datas.

DOCUMENT ID: ${payload.document_id}
SECTION MEMORIES:
${JSON.stringify(payload.all_section_memories, null, 2)}

TERMOS DEFINIDOS GLOBAIS:
${JSON.stringify(payload.defined_terms_global || {}, null, 2)}

Responda APENAS com JSON:
\`\`\`json
{
  "inconsistencies": [],
  "standardized_terms": {},
  "corrections_needed": false,
  "sections_with_warnings": []
}
\`\`\``;
}

// ── interpret_requirement_skill ──
function buildInterpretPrompt(input: SkillInput, payload: Record<string, unknown>): string {
    return `Interprete os dados brutos do formulário e estruture o contexto da contratação.

DADOS DO FORMULÁRIO:
${JSON.stringify(payload.raw_form_data, null, 2)}
TIPO DE DOCUMENTO: ${payload.doc_type}
TIPO DE OBJETO: ${payload.tipo_objeto}

Responda APENAS com JSON:
\`\`\`json
{
  "objeto_resumido": "...",
  "contexto_estruturado": {},
  "classificacao": {"categoria": "...", "complexidade": "..."},
  "flags": []
}
\`\`\``;
}

// ── normative_rag_skill ──
function buildRagPrompt(input: SkillInput, payload: Record<string, unknown>): string {
    return `Recupere normas relevantes para a seção.

QUERY: ${payload.query}
SECTION ID: ${payload.section_id}
DOC TYPE: ${payload.doc_type}

Responda APENAS com JSON:
\`\`\`json
{
  "normative_chunks": [],
  "total_found": 0
}
\`\`\``;
}

// ── export_official_document_skill ──
function buildExportPrompt(input: SkillInput, payload: Record<string, unknown>): string {
    return `Prepare o documento para exportação oficial.

DOCUMENT ID: ${payload.document_id}
DOC TYPE: ${payload.doc_type}
FORMAT: ${payload.format}
SEÇÕES: ${JSON.stringify(payload.sections, null, 2)}

Responda APENAS com JSON:
\`\`\`json
{
  "document_hash": "...",
  "page_count": 0,
  "file_size_bytes": 0
}
\`\`\``;
}

// ── fallback genérico ──
function buildGenericPrompt(input: SkillInput, payload: Record<string, unknown>): string {
    return `Execute a skill "${input.skill_name}" com os seguintes dados:

PAYLOAD:
${JSON.stringify(payload, null, 2)}

PROCESS CONTEXT:
${JSON.stringify(input.process_context, null, 2)}

Responda APENAS com JSON válido.`;
}
