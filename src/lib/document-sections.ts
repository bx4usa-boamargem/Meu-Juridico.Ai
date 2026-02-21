export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "select";
  readOnly?: boolean;
  source?: "processo";
  options?: string[];
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

const DFD_SECTIONS: SectionDef[] = [
  {
    id: "informacoes_gerais",
    label: "Informações gerais",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "numero_processo", label: "Número do Processo", type: "text", readOnly: true, source: "processo" },
      { key: "orgao", label: "Órgão", type: "text", readOnly: true, source: "processo" },
      { key: "setor_demandante", label: "Setor Demandante", type: "text" },
      { key: "responsavel", label: "Responsável pela Demanda", type: "text" },
      { key: "categoria", label: "Categoria", type: "select", options: ["Bens", "Serviços", "Obras", "Serviços de Engenharia"] },
    ],
  },
  {
    id: "justificativa",
    label: "Justificativa de necessidade",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "justificativa_contratacao", label: "Justificativa da Contratação", type: "textarea" },
      { key: "necessidade", label: "Descrição da Necessidade", type: "textarea" },
      { key: "alinhamento_estrategico", label: "Alinhamento Estratégico", type: "textarea" },
    ],
  },
  {
    id: "materiais_servicos",
    label: "Materiais / Serviços",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "descricao_itens", label: "Descrição dos Itens/Serviços", type: "textarea" },
      { key: "quantidade", label: "Quantidade Estimada", type: "text" },
      { key: "unidade_medida", label: "Unidade de Medida", type: "text" },
      { key: "valor_estimado", label: "Valor Estimado (R$)", type: "text" },
      { key: "fonte_pesquisa", label: "Fonte de Pesquisa de Preço", type: "text" },
    ],
  },
  {
    id: "responsaveis",
    label: "Responsáveis",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "responsavel_tecnico", label: "Responsável Técnico", type: "text" },
      { key: "fiscal_contrato", label: "Fiscal do Contrato", type: "text" },
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

const TR_SECTIONS: SectionDef[] = [
  {
    id: "objeto",
    label: "Definição do Objeto",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "definicao_objeto", label: "Definição do Objeto", type: "textarea" },
      { key: "justificativa_contratacao", label: "Justificativa da Contratação", type: "textarea" },
    ],
  },
  {
    id: "especificacoes",
    label: "Especificações Técnicas",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "especificacoes_tecnicas", label: "Especificações Técnicas", type: "textarea" },
      { key: "requisitos_habilitacao", label: "Requisitos de Habilitação", type: "textarea" },
    ],
  },
  {
    id: "execucao",
    label: "Condições de Execução",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "local_execucao", label: "Local de Execução", type: "text" },
      { key: "prazo_execucao", label: "Prazo de Execução", type: "text" },
      { key: "condicoes_pagamento", label: "Condições de Pagamento", type: "textarea" },
    ],
  },
  {
    id: "obrigacoes",
    label: "Obrigações das Partes",
    required: true,
    unlocksNext: true,
    fields: [
      { key: "obrigacoes_contratante", label: "Obrigações do Contratante", type: "textarea" },
      { key: "obrigacoes_contratado", label: "Obrigações do Contratado", type: "textarea" },
    ],
  },
  {
    id: "penalidades",
    label: "Penalidades",
    required: false,
    unlocksNext: false,
    fields: [
      { key: "penalidades", label: "Penalidades Aplicáveis", type: "textarea" },
    ],
  },
];

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

const SECTION_MAP: Record<string, SectionDef[]> = {
  DFD: DFD_SECTIONS,
  ETP: ETP_SECTIONS,
  TR: TR_SECTIONS,
  Edital: GENERIC_SECTIONS,
  Contrato: GENERIC_SECTIONS,
};

export function getSectionsForType(tipo: string | null | undefined): SectionDef[] {
  if (!tipo) return GENERIC_SECTIONS;
  return SECTION_MAP[tipo] ?? GENERIC_SECTIONS;
}

export function calculateSectionCompletion(
  section: SectionDef,
  data: Record<string, any>
): { filled: number; total: number; complete: boolean } {
  const requiredFields = section.fields.filter((f) => !f.readOnly);
  const total = requiredFields.length;
  const filled = requiredFields.filter((f) => {
    const val = data[f.key];
    return val !== undefined && val !== null && val !== "";
  }).length;
  return { filled, total, complete: filled === total };
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
    // Skip disabled steps
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
