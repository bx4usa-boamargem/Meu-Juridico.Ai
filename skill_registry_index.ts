// ============================================================
// MEUJURÍDICO.AI — Skill Registry
// Registro central de todas as skills disponíveis
// Cada skill é um módulo independente com contrato definido
// ============================================================

import type { AgentId, SkillConfig } from '../types/index.ts';

export interface SkillDefinition {
  name: string;
  description: string;
  agent: AgentId;
  config: SkillConfig;
  input_schema: Record<string, unknown>;  // JSON Schema
  output_schema: Record<string, unknown>; // JSON Schema
  applicable_doc_types: string[];
  applicable_sections?: string[];         // IDs de seção específicos, ou undefined = todas
}

export const SKILL_REGISTRY: Record<string, SkillDefinition> = {

  // ──────────────────────────────────────────
  // 1. interpret_requirement_skill
  // Interpreta requisitos brutos do formulário
  // ──────────────────────────────────────────
  interpret_requirement_skill: {
    name: 'interpret_requirement_skill',
    description: 'Interpreta dados brutos do formulário e estrutura o contexto inicial da contratação',
    agent: 'AGENT_ADMIN',
    config: {
      name: 'interpret_requirement_skill',
      agent: 'AGENT_ADMIN',
      max_retries: 2,
      timeout_ms: 30000,
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.2,
    },
    input_schema: {
      type: 'object',
      required: ['raw_form_data', 'doc_type', 'tipo_objeto'],
      properties: {
        raw_form_data: { type: 'object', description: 'Dados brutos do formulário preenchido' },
        doc_type: { type: 'string', enum: ['dfd', 'etp', 'tr', 'edital'] },
        tipo_objeto: { type: 'string', enum: ['servico', 'material', 'software', 'obra', 'servico_tic'] },
      }
    },
    output_schema: {
      type: 'object',
      required: ['objeto_resumido', 'contexto_estruturado', 'classificacao'],
      properties: {
        objeto_resumido: { type: 'string', maxLength: 300 },
        contexto_estruturado: { type: 'object' },
        classificacao: { type: 'object', properties: { categoria: { type: 'string' }, complexidade: { type: 'string' } } },
        flags: { type: 'array', items: { type: 'string' } },
      }
    },
    applicable_doc_types: ['dfd', 'etp', 'tr', 'edital'],
  },

  // ──────────────────────────────────────────
  // 2. generate_section_skill
  // Geração de texto formal de seção completa
  // ──────────────────────────────────────────
  generate_section_skill: {
    name: 'generate_section_skill',
    description: 'Gera o texto técnico-formal completo de uma seção documental',
    agent: 'AGENT_LICIT',
    config: {
      name: 'generate_section_skill',
      agent: 'AGENT_LICIT',
      max_retries: 2,
      timeout_ms: 90000,
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.3,
    },
    input_schema: {
      type: 'object',
      required: ['section_id', 'section_title', 'structured_data', 'section_memories', 'normative_context'],
      properties: {
        section_id: { type: 'string' },
        section_title: { type: 'string' },
        structured_data: { type: 'object', description: 'Dados do formulário desta seção' },
        section_memories: { type: 'array', description: 'section_memory das seções anteriores' },
        normative_context: { type: 'array', description: 'Normas relevantes do RAG' },
        target_length: { type: 'string', enum: ['concise', 'standard', 'extended'], default: 'standard' },
        tab_key: { type: 'string', description: 'Tab específica se geração parcial' },
      }
    },
    output_schema: {
      type: 'object',
      required: ['rendered_content', 'key_facts', 'values_declared'],
      properties: {
        rendered_content: { type: 'string', description: 'Markdown formatado' },
        key_facts: { type: 'array' },
        values_declared: { type: 'object' },
        commitments: { type: 'array', items: { type: 'string' } },
        defined_terms: { type: 'object' },
        warnings: { type: 'array', items: { type: 'string' } },
      }
    },
    applicable_doc_types: ['dfd', 'etp', 'tr', 'edital', 'contrato'],
  },

  // ──────────────────────────────────────────
  // 3. legal_validation_skill
  // Validação jurídica de seção conforme Lei 14.133
  // ──────────────────────────────────────────
  legal_validation_skill: {
    name: 'legal_validation_skill',
    description: 'Valida conformidade jurídica da seção com Lei 14.133/2021 e normas correlatas',
    agent: 'AGENT_JURIDICO',
    config: {
      name: 'legal_validation_skill',
      agent: 'AGENT_JURIDICO',
      max_retries: 2,
      timeout_ms: 60000,
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.1,
    },
    input_schema: {
      type: 'object',
      required: ['section_id', 'rendered_content', 'normative_refs', 'doc_type'],
      properties: {
        section_id: { type: 'string' },
        rendered_content: { type: 'string' },
        normative_refs: { type: 'array' },
        doc_type: { type: 'string' },
        checklist_template: { type: 'array', description: 'Checklist do template para esta seção' },
        rag_context: { type: 'array', description: 'Normas recuperadas do pgvector' },
      }
    },
    output_schema: {
      type: 'object',
      required: ['validation_report'],
      properties: {
        validation_report: {
          type: 'object',
          required: ['status', 'issues', 'missing_fields', 'tcu_compliance_score'],
          properties: {
            status: { type: 'string', enum: ['approved', 'approved_with_warnings', 'rejected'] },
            issues: { type: 'array' },
            missing_fields: { type: 'array', items: { type: 'string' } },
            tcu_compliance_score: { type: 'number', minimum: 0, maximum: 1 },
          }
        },
        suggested_corrections: { type: 'array', items: { type: 'string' } },
      }
    },
    applicable_doc_types: ['dfd', 'etp', 'tr', 'edital', 'contrato', 'parecer_juridico'],
  },

  // ──────────────────────────────────────────
  // 4. procurement_strategy_skill
  // Define estratégia de contratação e modalidade
  // ──────────────────────────────────────────
  procurement_strategy_skill: {
    name: 'procurement_strategy_skill',
    description: 'Define estratégia de contratação: modalidade, parcelamento, regime de execução, critério de julgamento',
    agent: 'AGENT_LICIT',
    config: {
      name: 'procurement_strategy_skill',
      agent: 'AGENT_LICIT',
      max_retries: 2,
      timeout_ms: 45000,
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.2,
    },
    input_schema: {
      type: 'object',
      required: ['tipo_objeto', 'valor_estimado', 'process_context'],
      properties: {
        tipo_objeto: { type: 'string' },
        valor_estimado: { type: 'number' },
        process_context: { type: 'object' },
        restricoes: { type: 'array', items: { type: 'string' } },
        rag_context: { type: 'array' },
      }
    },
    output_schema: {
      type: 'object',
      required: ['modalidade', 'justificativa_modalidade', 'criterio_julgamento'],
      properties: {
        modalidade: { type: 'string' },
        justificativa_modalidade: { type: 'string' },
        criterio_julgamento: { type: 'string' },
        regime_execucao: { type: 'string' },
        parcelamento: { type: 'object', properties: { recomendado: { type: 'boolean' }, justificativa: { type: 'string' } } },
        normative_basis: { type: 'array' },
      }
    },
    applicable_doc_types: ['etp', 'tr'],
    applicable_sections: ['etp_06', 'etp_07', 'tr_02'],
  },

  // ──────────────────────────────────────────
  // 5. price_research_skill
  // Coleta e valida pesquisa de preços
  // ──────────────────────────────────────────
  price_research_skill: {
    name: 'price_research_skill',
    description: 'Analisa dados de pesquisa de preço coletados, exclui outliers e produz memória de cálculo',
    agent: 'AGENT_RESEARCH',
    config: {
      name: 'price_research_skill',
      agent: 'AGENT_RESEARCH',
      max_retries: 2,
      timeout_ms: 45000,
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.1,
    },
    input_schema: {
      type: 'object',
      required: ['item_description', 'quantity', 'price_records'],
      properties: {
        item_description: { type: 'string' },
        quantity: { type: 'number' },
        price_records: {
          type: 'array',
          items: {
            type: 'object',
            required: ['source_type', 'unit_price', 'source_ref'],
            properties: {
              source_type: { type: 'string', enum: ['pncp', 'comprasgov', 'manual', 'cotacao', 'ata_rp'] },
              unit_price: { type: 'number' },
              source_ref: { type: 'string' },
              source_date: { type: 'string' },
              supplier_name: { type: 'string' },
            }
          },
          minItems: 1,
        },
        exclusion_method: { type: 'string', enum: ['cv', 'quartile', 'manual'], default: 'cv' },
      }
    },
    output_schema: {
      type: 'object',
      required: ['valor_unitario_referencia', 'valor_total_estimado', 'calculo_memoria'],
      properties: {
        valor_unitario_referencia: { type: 'number' },
        valor_total_estimado: { type: 'number' },
        records_valid: { type: 'number' },
        records_excluded: { type: 'number' },
        calculo_memoria: { type: 'string', description: 'Texto formal da memória de cálculo' },
        warnings: { type: 'array', items: { type: 'string' } },
        insufficient_sources: { type: 'boolean' },
      }
    },
    applicable_doc_types: ['etp', 'tr'],
    applicable_sections: ['etp_05', 'tr_04'],
  },

  // ──────────────────────────────────────────
  // 6. risk_analysis_skill
  // Matriz de riscos conforme Lei 14.133 art.22
  // ──────────────────────────────────────────
  risk_analysis_skill: {
    name: 'risk_analysis_skill',
    description: 'Gera matriz de riscos da contratação conforme Lei 14.133 art. 22 e Anexo IX da IN SEGES 65/2021',
    agent: 'AGENT_JURIDICO',
    config: {
      name: 'risk_analysis_skill',
      agent: 'AGENT_JURIDICO',
      max_retries: 2,
      timeout_ms: 60000,
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
      temperature: 0.2,
    },
    input_schema: {
      type: 'object',
      required: ['tipo_objeto', 'objeto', 'valor_estimado', 'modalidade'],
      properties: {
        tipo_objeto: { type: 'string' },
        objeto: { type: 'string' },
        valor_estimado: { type: 'number' },
        modalidade: { type: 'string' },
        complexidade: { type: 'string', enum: ['baixa', 'media', 'alta'] },
        rag_context: { type: 'array' },
      }
    },
    output_schema: {
      type: 'object',
      required: ['risks', 'rendered_matrix'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['risk_id', 'description', 'probability', 'impact', 'mitigation', 'responsible'],
            properties: {
              risk_id: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              probability: { type: 'string', enum: ['baixa', 'media', 'alta'] },
              impact: { type: 'string', enum: ['baixo', 'medio', 'alto'] },
              risk_level: { type: 'string', enum: ['aceitavel', 'moderado', 'critico'] },
              mitigation: { type: 'string' },
              responsible: { type: 'string', enum: ['contratante', 'contratada', 'compartilhado'] },
              normative_basis: { type: 'string' },
            }
          }
        },
        rendered_matrix: { type: 'string', description: 'Markdown com tabela formatada da matriz' },
      }
    },
    applicable_doc_types: ['etp', 'tr', 'edital'],
    applicable_sections: ['etp_07', 'tr_07'],
  },

  // ──────────────────────────────────────────
  // 7. audit_compliance_skill
  // Verificação de conformidade para TCU/CGU
  // ──────────────────────────────────────────
  audit_compliance_skill: {
    name: 'audit_compliance_skill',
    description: 'Verifica conformidade do documento para audit trail TCU/CGU. Opera sobre documento completo.',
    agent: 'AGENT_CONTROLE_INTERNO',
    config: {
      name: 'audit_compliance_skill',
      agent: 'AGENT_CONTROLE_INTERNO',
      max_retries: 1,
      timeout_ms: 90000,
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      temperature: 0.1,
    },
    input_schema: {
      type: 'object',
      required: ['document_id', 'doc_type', 'all_sections', 'audit_logs_summary'],
      properties: {
        document_id: { type: 'string' },
        doc_type: { type: 'string' },
        all_sections: { type: 'array', description: 'Todas as seções com rendered_content' },
        audit_logs_summary: { type: 'array', description: 'Resumo do audit_log do documento' },
        workflow_history: { type: 'array', description: 'workflow_transitions do documento' },
      }
    },
    output_schema: {
      type: 'object',
      required: ['compliance_report', 'overall_score', 'blocking_issues'],
      properties: {
        compliance_report: { type: 'object' },
        overall_score: { type: 'number', minimum: 0, maximum: 1 },
        blocking_issues: { type: 'array', description: 'Issues que impedem finalização' },
        recommendations: { type: 'array', items: { type: 'string' } },
        tcu_ready: { type: 'boolean' },
      }
    },
    applicable_doc_types: ['dfd', 'etp', 'tr', 'edital', 'contrato'],
  },

  // ──────────────────────────────────────────
  // 8. document_consolidation_skill
  // Coerência cross-section (anti-hallucination V7)
  // ──────────────────────────────────────────
  document_consolidation_skill: {
    name: 'document_consolidation_skill',
    description: 'Verifica coerência entre todas as seções. Detecta inconsistências de valores, termos e datas. Core do anti-hallucination V7.',
    agent: 'AGENT_CONSOLIDATOR',
    config: {
      name: 'document_consolidation_skill',
      agent: 'AGENT_CONSOLIDATOR',
      max_retries: 1,
      timeout_ms: 120000,
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.1,
    },
    input_schema: {
      type: 'object',
      required: ['document_id', 'all_section_memories'],
      properties: {
        document_id: { type: 'string' },
        all_section_memories: { type: 'array', description: 'section_memory de todas as seções' },
        defined_terms_global: { type: 'object', description: 'Acúmulo de defined_terms' },
      }
    },
    output_schema: {
      type: 'object',
      required: ['inconsistencies', 'standardized_terms', 'corrections_needed'],
      properties: {
        inconsistencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section_a: { type: 'string' },
              section_b: { type: 'string' },
              field: { type: 'string' },
              value_a: {},
              value_b: {},
              description: { type: 'string' },
              severity: { type: 'string', enum: ['error', 'warning'] },
            }
          }
        },
        standardized_terms: { type: 'object', description: 'Glossário final unificado' },
        corrections_needed: { type: 'boolean' },
        sections_with_warnings: { type: 'array', items: { type: 'string' } },
      }
    },
    applicable_doc_types: ['dfd', 'etp', 'tr', 'edital', 'contrato'],
  },

  // ──────────────────────────────────────────
  // 9. normative_rag_skill
  // Recuperação de normas via pgvector
  // ──────────────────────────────────────────
  normative_rag_skill: {
    name: 'normative_rag_skill',
    description: 'Recupera normas relevantes do rag_documents via similarity search (pgvector). Injeta contexto legal por seção.',
    agent: 'AGENT_JURIDICO',
    config: {
      name: 'normative_rag_skill',
      agent: 'AGENT_JURIDICO',
      max_retries: 1,
      timeout_ms: 15000,
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0.0,
    },
    input_schema: {
      type: 'object',
      required: ['query', 'section_id', 'doc_type'],
      properties: {
        query: { type: 'string', description: 'Texto para busca semântica' },
        section_id: { type: 'string' },
        doc_type: { type: 'string' },
        source_types: { type: 'array', items: { type: 'string' }, description: 'Filtro por tipo: lei, decreto, in, acordao_tcu' },
        top_k: { type: 'number', default: 5, maximum: 10 },
        min_similarity: { type: 'number', default: 0.75, minimum: 0, maximum: 1 },
      }
    },
    output_schema: {
      type: 'object',
      required: ['normative_chunks'],
      properties: {
        normative_chunks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rag_doc_id: { type: 'string' },
              source_ref: { type: 'string' },
              title: { type: 'string' },
              content: { type: 'string' },
              similarity: { type: 'number' },
              article: { type: 'string' },
            }
          }
        },
        total_found: { type: 'number' },
      }
    },
    applicable_doc_types: ['dfd', 'etp', 'tr', 'edital', 'contrato', 'parecer_juridico'],
  },

  // ──────────────────────────────────────────
  // 10. export_official_document_skill
  // Geração do documento final DOCX/PDF
  // ──────────────────────────────────────────
  export_official_document_skill: {
    name: 'export_official_document_skill',
    description: 'Gera documento oficial DOCX/PDF a partir das seções finalizadas. Calcula SHA-256, adiciona disclaimer e persiste URLs.',
    agent: 'AGENT_RENDER',
    config: {
      name: 'export_official_document_skill',
      agent: 'AGENT_RENDER',
      max_retries: 1,
      timeout_ms: 180000,
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0.0,
    },
    input_schema: {
      type: 'object',
      required: ['document_id', 'doc_type', 'sections', 'org_data', 'format'],
      properties: {
        document_id: { type: 'string' },
        doc_type: { type: 'string' },
        sections: { type: 'array', description: 'Seções ordenadas com rendered_content' },
        org_data: { type: 'object', description: 'Nome do órgão, brasão, assinante' },
        format: { type: 'string', enum: ['docx', 'pdf', 'both'] },
        include_audit_trail: { type: 'boolean', default: false },
        watermark: { type: 'string', description: '"RASCUNHO" para versões não finalizadas' },
      }
    },
    output_schema: {
      type: 'object',
      required: ['document_hash'],
      properties: {
        docx_url: { type: 'string' },
        pdf_url: { type: 'string' },
        document_hash: { type: 'string', description: 'SHA-256 do conteúdo final' },
        page_count: { type: 'number' },
        file_size_bytes: { type: 'number' },
      }
    },
    applicable_doc_types: ['dfd', 'etp', 'tr', 'edital', 'contrato'],
  },

};

// Helper: obter skills de um agente
export function getSkillsByAgent(agentId: AgentId): SkillDefinition[] {
  return Object.values(SKILL_REGISTRY).filter(s => s.agent === agentId);
}

// Helper: obter skills aplicáveis a um tipo de documento
export function getSkillsByDocType(docType: string): SkillDefinition[] {
  return Object.values(SKILL_REGISTRY).filter(s => s.applicable_doc_types.includes(docType));
}

// Helper: obter skill por nome (com type safety)
export function getSkill(name: string): SkillDefinition | undefined {
  return SKILL_REGISTRY[name];
}
