export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "select";
  readOnly?: boolean;
  source?: "processo";
  options?: string[];
  required?: boolean;
  maxLength?: number;
  colspan?: number; // 1 (half) or 2 (full width) — default inferred from type
  group?: string; // group fields into sub-section cards
}

export interface SectionDef {
  id: string;
  label: string;
  fields: FieldDef[];
  required: boolean;
  unlocksNext: boolean;
}

export type StepStatus = "locked" | "editing" | "complete";

export interface WorkflowState {
  current_step: string;
  steps: Record<string, { status: StepStatus; enabled: boolean }>;
}

// ─── DFD Sections (new order with Buscar Objeto + Contexto) ──────────

const DFD_SECTIONS: SectionDef[] = [
  {
    id: "buscar_objeto",
    label: "Buscar Objeto",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "objeto_contratacao", label: "Objeto da Contratação", type: "textarea", required: true },
    ],
  },
  {
    id: "contexto_contratacao",
    label: "Contexto da Contratação",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "problema_publico", label: "Problema Público Identificado", type: "textarea", required: true },
      { key: "area_demandante", label: "Área Demandante", type: "text", required: true },
      { key: "impacto_esperado", label: "Impacto Esperado", type: "textarea", required: true },
      { key: "continuidade_ou_nova", label: "Continuidade ou Nova Contratação", type: "select", options: ["Continuidade", "Nova contratação"], required: false },
      { key: "publico_beneficiado", label: "Público Beneficiado", type: "textarea", required: false },
      { key: "alinhamento_estrategico", label: "Alinhamento Estratégico", type: "textarea", required: false },
      { key: "fundamento_legal", label: "Fundamento Legal", type: "textarea", required: false },
      { key: "plano_anual_contratacoes", label: "Plano Anual de Contratações", type: "text", required: false },
      { key: "politica_publica_relacionada", label: "Política Pública Relacionada", type: "textarea", required: false },
      { key: "instrumento_planejamento", label: "Instrumento de Planejamento", type: "text", required: false },
    ],
  },
  {
    id: "informacoes_gerais",
    label: "Informações gerais",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "numero_processo", label: "Número do Processo", type: "text", readOnly: true, source: "processo", group: "basicas" },
      { key: "orgao", label: "Órgão", type: "text", readOnly: true, source: "processo", group: "basicas" },
      { key: "categoria", label: "Categoria", type: "select", options: ["Bens", "Serviços", "Obras", "Serviços de Engenharia"], required: true, group: "basicas" },
      { key: "setor_demandante", label: "Setor Demandante", type: "text", required: true },
      { key: "responsavel", label: "Responsável pela Demanda", type: "text", required: true },
      { key: "data_conclusao_contratacao", label: "Data da conclusão da contratação", type: "date" },
      { key: "area_requisitante_etp", label: "Área requisitante", type: "select", options: ["Selecione o ETP"], required: false },
      { key: "descricao_sucinta_objeto", label: "Descrição sucinta do objeto", type: "textarea", maxLength: 200 },
      { key: "prioridade_info", label: "Prioridade", type: "select", options: ["Alto", "Médio", "Baixo"] },
      { key: "justificativa_prioridade", label: "Justificativa da prioridade", type: "textarea", maxLength: 500 },
    ],
  },
  {
    id: "justificativa",
    label: "Justificativa de necessidade",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "justificativa_contratacao", label: "Justificativa da Contratação", type: "textarea", required: true },
      { key: "necessidade", label: "Descrição da Necessidade", type: "textarea", required: true },
      { key: "alinhamento_estrategico_just", label: "Alinhamento Estratégico", type: "textarea", required: false },
    ],
  },
  {
    id: "materiais_servicos",
    label: "Materiais / Serviços",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "descricao_itens", label: "Descrição dos Itens/Serviços", type: "textarea", required: true },
      { key: "quantidade", label: "Quantidade Estimada", type: "text", required: true },
      { key: "unidade_medida", label: "Unidade de Medida", type: "text" },
      { key: "valor_estimado", label: "Valor Estimado (R$)", type: "text", required: true },
      { key: "fonte_pesquisa", label: "Fonte de Pesquisa de Preço", type: "text" },
    ],
  },
  {
    id: "responsaveis",
    label: "Responsáveis",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "responsavel_tecnico", label: "Responsável Técnico", type: "text", required: true },
      { key: "fiscal_contrato", label: "Fiscal do Contrato", type: "text", required: true },
      { key: "ordenador_despesa", label: "Ordenador de Despesa", type: "text" },
    ],
  },
  {
    id: "acompanhamento",
    label: "Acompanhamento",
    required: false,
    unlocksNext: true,
    fields: [
      { key: "prioridade", label: "Prioridade", type: "select", options: ["Alta", "Média", "Baixa"] },
      { key: "prazo_entrega", label: "Prazo de Entrega", type: "text" },
      { key: "observacoes", label: "Observações Gerais", type: "textarea" },
    ],
  },
  {
    id: "visualizacao",
    label: "Visualização",
    required: false,
    unlocksNext: false,
    fields: [],
  },
];

// ─── ETP Sections ────────────────────────────────────────────────────

const ETP_SECTIONS: SectionDef[] = [
  {
    id: "descricao_necessidade",
    label: "Descrição da Necessidade",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "necessidade_contratacao", label: "Necessidade da Contratação", type: "textarea" },
      { key: "alinhamento_pca", label: "Alinhamento com o PCA", type: "textarea" },
    ],
  },
  {
    id: "area_requisitante",
    label: "Área Requisitante",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "area_requisitante", label: "Área Requisitante", type: "text" },
      { key: "responsavel_demanda", label: "Responsável pela Demanda", type: "text" },
    ],
  },
  {
    id: "estimativas",
    label: "Estimativas e Preços",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "estimativa_quantidade", label: "Estimativa de Quantidade", type: "textarea" },
      { key: "estimativa_preco", label: "Estimativa de Preço", type: "text" },
      { key: "metodologia_preco", label: "Metodologia de Pesquisa de Preço", type: "textarea" },
    ],
  },
  {
    id: "solucoes",
    label: "Levantamento de Soluções",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "solucoes_mercado", label: "Soluções de Mercado", type: "textarea" },
      { key: "solucao_escolhida", label: "Solução Escolhida", type: "textarea" },
      { key: "justificativa_escolha", label: "Justificativa da Escolha", type: "textarea" },
    ],
  },
  {
    id: "riscos",
    label: "Análise de Riscos",
    required: false,
    unlocksNext: false,
    fields: [
      { key: "riscos_principais", label: "Riscos Principais", type: "textarea" },
      { key: "mitigacao", label: "Ações de Mitigação", type: "textarea" },
    ],
  },
];

// ─── TR Sections ─────────────────────────────────────────────────────

const TR_SECTIONS: SectionDef[] = [
  {
    id: "objeto",
    label: "Definição do Objeto",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "objeto_contratacao", label: "Objeto da Contratação", type: "textarea", required: true, group: "basicas" },
      { key: "natureza_objeto", label: "Natureza do Objeto", type: "select", options: ["Bens", "Serviços", "Obras", "Serviços de Engenharia"], required: true, group: "basicas" },
      { key: "justificativa_contratacao", label: "Justificativa da Contratação", type: "textarea", required: true, group: "basicas" },
    ],
  },
  {
    id: "especificacoes",
    label: "Especificações Técnicas",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "especificacoes_tecnicas", label: "Descrição Detalhada", type: "textarea", required: true },
      { key: "requisitos_tecnicos", label: "Requisitos Técnicos Obrigatórios", type: "textarea" },
      { key: "padroes_qualidade", label: "Padrões de Qualidade", type: "textarea" },
    ],
  },
  {
    id: "execucao",
    label: "Condições de Execução",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "prazo_execucao", label: "Prazo de Execução", type: "text", required: true },
      { key: "local_execucao", label: "Local de Execução / Entrega", type: "text", required: true },
      { key: "condicoes_recebimento", label: "Condições de Recebimento", type: "textarea" },
      { key: "criterios_aceitacao", label: "Critérios de Aceitação", type: "textarea" },
    ],
  },
  {
    id: "obrigacoes",
    label: "Obrigações das Partes",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "obrigacoes_contratante", label: "Obrigações da Contratante", type: "textarea", required: true },
      { key: "obrigacoes_contratada", label: "Obrigações da Contratada", type: "textarea", required: true },
    ],
  },
  {
    id: "penalidades",
    label: "Penalidades e Sanções",
    required: false,
    unlocksNext: true,
    fields: [
      { key: "penalidades", label: "Penalidades Aplicáveis", type: "textarea" },
      { key: "sancoes", label: "Sanções Administrativas", type: "textarea" },
      { key: "anexos", label: "Anexos", type: "textarea" },
    ],
  },
  {
    id: "responsaveis_tr",
    label: "Responsáveis",
    required: true,
    unlocksNext: false,
    fields: [
      { key: "responsavel_tecnico", label: "Responsável Técnico", type: "text", required: true, group: "basicas" },
      { key: "fiscal_contrato", label: "Fiscal do Contrato", type: "text", group: "basicas" },
    ],
  },
];

// ─── Generic Sections ────────────────────────────────────────────────

const GENERIC_SECTIONS: SectionDef[] = [
  {
    id: "conteudo",
    label: "Conteúdo",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "conteudo_principal", label: "Conteúdo Principal", type: "textarea" },
    ],
  },
  {
    id: "observacoes",
    label: "Observações",
    required: false,
    unlocksNext: false,
    fields: [
      { key: "observacoes", label: "Observações", type: "textarea" },
    ],
  },
];

// ─── Section Map ─────────────────────────────────────────────────────

const SECTION_MAP: Record<string, SectionDef[]> = {
  DFD: DFD_SECTIONS,
  ETP: ETP_SECTIONS,
  TR: TR_SECTIONS,
  Edital: GENERIC_SECTIONS,
  Contrato: GENERIC_SECTIONS,
  projeto_basico: GENERIC_SECTIONS,
  mapa_risco: GENERIC_SECTIONS,
  edital: GENERIC_SECTIONS,
  custom: GENERIC_SECTIONS,
};

export function getSectionsForType(tipo: string | null | undefined): SectionDef[] {
  if (!tipo) return GENERIC_SECTIONS;
  return SECTION_MAP[tipo] ?? GENERIC_SECTIONS;
}

// ─── Completion helpers ──────────────────────────────────────────────

export function calculateSectionCompletion(
  section: SectionDef,
  data: Record<string, any>
): { filled: number; total: number; complete: boolean } {
  // Only count fields with required === true (or legacy: not readOnly)
  const requiredFields = section.fields.filter((f) => {
    if (f.readOnly) return false;
    if (f.required === true) return true;
    // Legacy: if no explicit required, count all non-readOnly fields for sections that are required
    if (f.required === undefined && section.required) return true;
    return false;
  });
  const total = requiredFields.length;
  const filled = requiredFields.filter((f) => {
    const val = data[f.key];
    return val !== undefined && val !== null && val !== "";
  }).length;
  return { filled, total, complete: total === 0 || filled === total };
}

export function calculateDocumentProgress(
  sections: SectionDef[],
  data: Record<string, any>,
  workflow?: WorkflowState
): number {
  const enabledSections = workflow
    ? sections.filter((s) => workflow.steps[s.id]?.enabled !== false)
    : sections;
  const allFields = enabledSections.flatMap((s) => s.fields.filter((f) => !f.readOnly));
  if (allFields.length === 0) return 0;
  const filled = allFields.filter((f) => {
    const val = data[f.key];
    return val !== undefined && val !== null && val !== "";
  }).length;
  return Math.round((filled / allFields.length) * 100);
}

export function isSectionUnlocked(
  sectionIndex: number,
  sections: SectionDef[],
  data: Record<string, any>,
  workflow?: WorkflowState
): boolean {
  if (sectionIndex === 0) return true;
  for (let i = 0; i < sectionIndex; i++) {
    const prev = sections[i];
    if (workflow?.steps[prev.id]?.enabled === false) continue;
    if (prev.required && prev.unlocksNext) {
      const { complete } = calculateSectionCompletion(prev, data);
      if (!complete) return false;
    }
  }
  return true;
}

export function initializeWorkflow(sections: SectionDef[], existingWorkflow?: WorkflowState): WorkflowState {
  const steps: Record<string, { status: StepStatus; enabled: boolean }> = {};
  sections.forEach((s, i) => {
    const existing = existingWorkflow?.steps[s.id];
    steps[s.id] = {
      status: existing?.status ?? (i === 0 ? "editing" : "locked"),
      enabled: existing?.enabled ?? true,
    };
  });
  return {
    current_step: existingWorkflow?.current_step ?? sections[0]?.id ?? "",
    steps,
  };
}
