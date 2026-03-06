// ============================================================
// MEUJURÍDICO.AI — Shared Types
// Alinhados com o Data Model (data_model.sql)
// ============================================================

export type DocumentType = 'pca' | 'dfd' | 'etp' | 'tr' | 'edital' | 'contrato' | 'parecer_juridico' | 'portaria_designacao';
export type DocumentStatus = 'rascunho' | 'em_elaboracao' | 'em_revisao' | 'em_ajuste' | 'aprovado' | 'finalizado' | 'arquivado';
export type SectionStatus = 'empty' | 'draft' | 'ai_generated' | 'user_edited' | 'validated' | 'approved';
export type AgentId = 'AGENT_ADMIN' | 'AGENT_LICIT' | 'AGENT_JURIDICO' | 'AGENT_PROCURADOR_SUPREMO' | 'AGENT_CONTROLE_INTERNO' | 'AGENT_INTELIGENCIA_CRUZADA' | 'AGENT_RESEARCH' | 'AGENT_CONSOLIDATOR' | 'AGENT_RENDER';
export type ExecutionStage = 'PLAN' | 'GENERATE_SECTION' | 'VALIDATE_SECTION' | 'CONSOLIDATE' | 'FINALIZE';
export type AiJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// ─────────────────────────────────────────────
// Entidades do banco (subset dos campos relevantes)
// ─────────────────────────────────────────────

export interface ProcessContext {
  process_id: string;
  org_id: string;
  objeto: string;
  tipo_objeto: 'servico' | 'material' | 'software' | 'obra' | 'servico_tic';
  valor_estimado?: number;
  modalidade_prevista?: string;
  dotacao_orcamentaria?: string;
  dados_base: Record<string, unknown>;
}

export interface SectionMemory {
  section_id: string;
  key_facts: KeyFact[];
  values_declared: Record<string, number>;   // ex: { valor_estimado: 150000 }
  commitments: string[];                      // Obrigações declaradas
  defined_terms: Record<string, string>;      // Glossário da seção
  normative_refs: NormativeRef[];
}

export interface KeyFact {
  fact: string;
  source_section: string;
  confidence: number; // 0.0 - 1.0
}

export interface NormativeRef {
  law: string;
  article: string;
  text: string;
}

export interface ValidationReport {
  status: 'approved' | 'approved_with_warnings' | 'rejected';
  issues: ValidationIssue[];
  missing_fields: string[];
  tcu_compliance_score: number; // 0.0 - 1.0
  checked_at: string;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

// ─────────────────────────────────────────────
// Contratos de Skill (Input/Output)
// ─────────────────────────────────────────────

export interface SkillInput {
  skill_name: string;
  job_id: string;
  document_id: string;
  section_id?: string;
  org_id: string;
  user_id: string;
  process_context: ProcessContext;
  section_memories: SectionMemory[]; // Memória das seções anteriores
  payload: Record<string, unknown>;  // Dados específicos da skill
}

export interface SkillOutput {
  success: boolean;
  skill_name: string;
  job_id: string;
  section_id?: string;
  rendered_content?: string;   // Markdown gerado
  rendered_html?: string;
  structured_data?: Record<string, unknown>;
  normative_refs?: NormativeRef[];
  key_facts?: KeyFact[];
  values_declared?: Record<string, number>;
  defined_terms?: Record<string, string>;
  validation_report?: ValidationReport;
  warnings: string[];
  error?: string;
  tokens_used: { prompt: number; completion: number };
  cost_usd: number;
}

export interface SkillConfig {
  name: string;
  agent: AgentId;
  max_retries: number;
  timeout_ms: number;
  model: string;
  max_tokens: number;
  temperature: number;
}

// ─────────────────────────────────────────────
// Orchestrator
// ─────────────────────────────────────────────

export interface OrchestrationPlan {
  document_id: string;
  doc_type: DocumentType;
  sections: SectionPlan[];
  total_sections: number;
  estimated_cost_usd: number;
}

export interface SectionPlan {
  section_id: string;
  section_number: string;
  title: string;
  agent: AgentId;
  skills: string[];
  depends_on: string[];
  order_index: number;
  estimated_tokens: number;
  condition?: Record<string, any>;
}

export interface OrchestratorResult {
  success: boolean;
  document_id: string;
  stage: ExecutionStage;
  sections_completed: number;
  sections_failed: number;
  total_cost_usd: number;
  errors: string[];
}
