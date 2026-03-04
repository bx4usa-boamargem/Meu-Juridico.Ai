-- ============================================================
-- SPRINT 1 — MIGRATION 2/3: INSERIR TEMPLATES + ATUALIZAR ETP
-- ENUM já expandido pela migration 20260303190000
-- MeuJurídico.ai — Março 2026
-- ============================================================

-- ============================================================
-- ETAPA 2: Inserir templates novos (formato JSONB sections_plan)
-- Usar WHERE NOT EXISTS para idempotência
-- ============================================================

-- TR — 12 seções
INSERT INTO document_templates (doc_type, name, is_default, sections_plan, normative_base)
SELECT 'tr', 'Termo de Referência — Lei 14.133/2021', true, '[
  {"section_id":"tr_01","section_number":"1","title":"Definição do Objeto","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":1,"required":true,"instructions":"Descrição precisa. Art. 6º, XXIII, a. Sem ambiguidade."},
  {"section_id":"tr_02","section_number":"2","title":"Fundamentação da Contratação","agent":"AGENT_JURIDICO","skill":"legal_validation_skill","order_index":2,"required":true,"instructions":"Base legal. Vincular ETP e DFD. Art. 6º, XXIII, b."},
  {"section_id":"tr_03","section_number":"3","title":"Descrição da Solução","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":3,"required":true,"instructions":"Como será executado, entregue e recebido."},
  {"section_id":"tr_04","section_number":"4","title":"Requisitos da Contratação","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":4,"required":true,"instructions":"Requisitos técnicos, legais e de habilitação. Art. 6º, XXIII, d."},
  {"section_id":"tr_05","section_number":"5","title":"Modelo de Execução","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":5,"required":true,"instructions":"Condições, cronograma, local, responsabilidades. Art. 6º, XXIII, e."},
  {"section_id":"tr_06","section_number":"6","title":"Modelo de Gestão do Contrato","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":6,"required":true,"instructions":"Fiscalização, gestor, rotinas. Art. 117, Lei 14.133/2021."},
  {"section_id":"tr_07","section_number":"7","title":"Critérios de Medição e Pagamento","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":7,"required":true,"instructions":"Medição e prazos de pagamento. Art. 141, Lei 14.133/2021."},
  {"section_id":"tr_08","section_number":"8","title":"Forma de Seleção do Fornecedor","agent":"AGENT_LICIT","skill":"procurement_strategy_skill","order_index":8,"required":true,"instructions":"Modalidade licitatória. Até R$57k=dispensa, até R$572k=pregão, acima=concorrência. Decreto 11.871/2023."},
  {"section_id":"tr_09","section_number":"9","title":"Estimativa do Valor","agent":"AGENT_RESEARCH","skill":"price_research_skill","order_index":9,"required":true,"instructions":"Memória de cálculo. Importar etp_06 se ETP vinculado. IN SEGES 65/2021."},
  {"section_id":"tr_10","section_number":"10","title":"Adequação Orçamentária","agent":"AGENT_ADMIN","skill":"generate_section_skill","order_index":10,"required":true,"instructions":"Dotação, programa de trabalho, elemento de despesa. Art. 6º, XXIII, j."},
  {"section_id":"tr_11","section_number":"11","title":"Matriz de Riscos","agent":"AGENT_JURIDICO","skill":"risk_analysis_skill","order_index":11,"required":true,"instructions":"Tabela: Risco|Probabilidade|Impacto|Responsável|Mitigação. Art. 22, Lei 14.133/2021."},
  {"section_id":"tr_12","section_number":"12","title":"Critérios de Sustentabilidade","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":12,"required":false,"instructions":"Requisitos ambientais. Decreto 7.746/2012."}
]'::jsonb, '["Lei nº 14.133/2021 art. 6º, XXIII", "IN SEGES 65/2021", "Decreto 11.871/2023"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE doc_type = 'tr');

-- Projeto Básico — 7 seções
INSERT INTO document_templates (doc_type, name, is_default, sections_plan, normative_base)
SELECT 'projeto_basico', 'Projeto Básico — Obras e Engenharia', true, '[
  {"section_id":"pb_01","section_number":"1","title":"Desenvolvimento da Solução","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":1,"required":true,"instructions":"Solução de engenharia. Metodologia e especificações técnicas."},
  {"section_id":"pb_02","section_number":"2","title":"Especificações Técnicas","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":2,"required":true,"instructions":"Memorial descritivo. ABNT e normas aplicáveis."},
  {"section_id":"pb_03","section_number":"3","title":"Critérios de Medição","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":3,"required":true,"instructions":"Planilha por etapas. Retenção de garantia."},
  {"section_id":"pb_04","section_number":"4","title":"Prazo de Execução","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":4,"required":true,"instructions":"Prazo total e por etapa. Cronograma. Penalidades."},
  {"section_id":"pb_05","section_number":"5","title":"Orçamento Detalhado","agent":"AGENT_RESEARCH","skill":"price_research_skill","order_index":5,"required":true,"instructions":"Planilha com BDI. SINAPI ou SICRO como referência."},
  {"section_id":"pb_06","section_number":"6","title":"Cronograma Físico-Financeiro","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":6,"required":true,"instructions":"Distribuição mensal. Curva S."},
  {"section_id":"pb_07","section_number":"7","title":"Responsabilidade Técnica","agent":"AGENT_ADMIN","skill":"generate_section_skill","order_index":7,"required":true,"instructions":"ART/RRT do responsável. CREA/CAU competente."}
]'::jsonb, '["Lei nº 14.133/2021", "ABNT NBR 6492", "SINAPI/SICRO"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE doc_type = 'projeto_basico');

-- Mapa de Risco — 4 seções
INSERT INTO document_templates (doc_type, name, is_default, sections_plan, normative_base)
SELECT 'mapa_risco', 'Mapa de Risco — Lei 14.133/2021', true, '[
  {"section_id":"mr_01","section_number":"1","title":"Identificação dos Riscos","agent":"AGENT_JURIDICO","skill":"risk_analysis_skill","order_index":1,"required":true,"instructions":"Riscos técnicos, operacionais, financeiros, jurídicos e de força maior."},
  {"section_id":"mr_02","section_number":"2","title":"Avaliação de Probabilidade e Impacto","agent":"AGENT_JURIDICO","skill":"risk_analysis_skill","order_index":2,"required":true,"instructions":"Matriz 3x3: Probabilidade (Alta/Média/Baixa) x Impacto (Alto/Médio/Baixo)."},
  {"section_id":"mr_03","section_number":"3","title":"Alocação de Responsabilidade","agent":"AGENT_JURIDICO","skill":"risk_analysis_skill","order_index":3,"required":true,"instructions":"Contratante, Contratada ou compartilhado. Art. 22, Lei 14.133/2021."},
  {"section_id":"mr_04","section_number":"4","title":"Medidas de Tratamento","agent":"AGENT_JURIDICO","skill":"risk_analysis_skill","order_index":4,"required":true,"instructions":"Ações preventivas e corretivas. Cláusulas contratuais recomendadas."}
]'::jsonb, '["Lei nº 14.133/2021 art. 22"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE doc_type = 'mapa_risco');

-- Edital — 9 seções
INSERT INTO document_templates (doc_type, name, is_default, sections_plan, normative_base)
SELECT 'edital', 'Edital — Pregão Eletrônico', true, '[
  {"section_id":"ed_01","section_number":"1","title":"Preâmbulo e Identificação","agent":"AGENT_ADMIN","skill":"generate_section_skill","order_index":1,"required":true,"instructions":"Órgão, número do processo, modalidade, objeto resumido, data/hora da sessão."},
  {"section_id":"ed_02","section_number":"2","title":"Objeto","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":2,"required":true,"instructions":"Importar tr_01 se TR vinculado. Art. 40, I, Lei 14.133/2021."},
  {"section_id":"ed_03","section_number":"3","title":"Condições de Participação","agent":"AGENT_JURIDICO","skill":"legal_validation_skill","order_index":3,"required":true,"instructions":"Quem pode participar. Art. 14, Lei 14.133/2021. LC 123/2006 para ME/EPP."},
  {"section_id":"ed_04","section_number":"4","title":"Proposta Comercial","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":4,"required":true,"instructions":"Forma, validade mínima 60 dias, planilha de composição."},
  {"section_id":"ed_05","section_number":"5","title":"Critério de Julgamento","agent":"AGENT_LICIT","skill":"procurement_strategy_skill","order_index":5,"required":true,"instructions":"Importar tr_08 se TR vinculado. Art. 33, Lei 14.133/2021."},
  {"section_id":"ed_06","section_number":"6","title":"Habilitação","agent":"AGENT_JURIDICO","skill":"legal_validation_skill","order_index":6,"required":true,"instructions":"Documentação jurídica, fiscal, trabalhista, econômica, técnica. Arts. 62-70."},
  {"section_id":"ed_07","section_number":"7","title":"Impugnações e Esclarecimentos","agent":"AGENT_JURIDICO","skill":"legal_validation_skill","order_index":7,"required":true,"instructions":"3 dias úteis para impugnação. 3 dias para esclarecimentos. Art. 164."},
  {"section_id":"ed_08","section_number":"8","title":"Sanções Administrativas","agent":"AGENT_JURIDICO","skill":"legal_validation_skill","order_index":8,"required":true,"instructions":"Arts. 155-163, Lei 14.133/2021."},
  {"section_id":"ed_09","section_number":"9","title":"Disposições Finais","agent":"AGENT_JURIDICO","skill":"generate_section_skill","order_index":9,"required":true,"instructions":"Legislação aplicável, foro, anexos."}
]'::jsonb, '["Lei nº 14.133/2021 arts. 14, 33, 40, 62-70, 155-164", "LC 123/2006"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE doc_type = 'edital');

-- Custom — 1 seção placeholder
INSERT INTO document_templates (doc_type, name, is_default, sections_plan, normative_base)
SELECT 'custom', 'Documento Personalizado', true, '[
  {"section_id":"custom_01","section_number":"1","title":"Seção Personalizada","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":1,"required":false,"instructions":"Seção criada pelo usuário. Gerar conteúdo formal conforme título e instruções fornecidas."}
]'::jsonb, '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE doc_type = 'custom');

-- ============================================================
-- ETAPA 3: Atualizar ETP de 8 para 10 seções
-- ============================================================
UPDATE document_templates
SET sections_plan = '[
  {"section_id":"etp_01","section_number":"1","title":"Descrição da Necessidade","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":1,"required":true,"instructions":"Descreva a necessidade que originou a contratação. Referenciar DFD aprovado se existir. Base: art. 18, I, Lei 14.133/2021."},
  {"section_id":"etp_02","section_number":"2","title":"Área Requisitante","agent":"AGENT_ADMIN","skill":"interpret_requirement_skill","order_index":2,"required":true,"instructions":"Identificar setor solicitante, responsável e justificativa da demanda interna."},
  {"section_id":"etp_03","section_number":"3","title":"Requisitos da Contratação","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":3,"required":true,"instructions":"Requisitos técnicos, legais e de negócio. Critérios de sustentabilidade: art. 11, IV, Lei 14.133/2021."},
  {"section_id":"etp_04","section_number":"4","title":"Levantamento de Mercado","agent":"AGENT_RESEARCH","skill":"price_research_skill","order_index":4,"required":true,"instructions":"Pesquisa com mínimo 3 fontes ou PNCP. Metodologia IN SEGES 65/2021."},
  {"section_id":"etp_05","section_number":"5","title":"Descrição da Solução Escolhida","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":5,"required":true,"instructions":"Solução selecionada após análise comparativa. Art. 18, IV, Lei 14.133/2021."},
  {"section_id":"etp_06","section_number":"6","title":"Estimativa do Valor","agent":"AGENT_RESEARCH","skill":"price_research_skill","order_index":6,"required":true,"instructions":"Estimativa fundamentada com memória de cálculo. Referenciar fontes."},
  {"section_id":"etp_07","section_number":"7","title":"Justificativa da Solução","agent":"AGENT_JURIDICO","skill":"legal_validation_skill","order_index":7,"required":true,"instructions":"Fundamentação jurídica. Art. 5º, Lei 14.133/2021."},
  {"section_id":"etp_08","section_number":"8","title":"Contratações Correlatas","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":8,"required":false,"instructions":"Contratos relacionados. Art. 18, VIII, Lei 14.133/2021."},
  {"section_id":"etp_09","section_number":"9","title":"Impactos Ambientais","agent":"AGENT_LICIT","skill":"generate_section_skill","order_index":9,"required":false,"instructions":"Impactos e medidas mitigatórias. Decreto 7.746/2012."},
  {"section_id":"etp_10","section_number":"10","title":"Posicionamento Conclusivo","agent":"AGENT_JURIDICO","skill":"legal_validation_skill","order_index":10,"required":true,"instructions":"Conclusão da equipe com recomendação de prosseguimento."}
]'::jsonb,
    name = 'ETP Padrão — Lei 14.133/2021 (10 seções)',
    normative_base = '["Lei nº 14.133/2021 art. 18, §1º", "IN SEGES 65/2021", "Decreto 7.746/2012"]'::jsonb
WHERE doc_type = 'etp';

-- ============================================================
-- VERIFICAÇÃO: Confirmar resultado final
-- ============================================================
-- SELECT doc_type, name, jsonb_array_length(sections_plan) as secoes
-- FROM document_templates ORDER BY doc_type;
--
-- Resultado esperado:
-- custom         | Documento Personalizado              | 1
-- dfd            | DFD Padrão — Lei 14.133/2021         | 6
-- edital         | Edital — Pregão Eletrônico            | 9
-- etp            | ETP Padrão — Lei 14.133/2021 (10)    | 10
-- mapa_risco     | Mapa de Risco — Lei 14.133/2021      | 4
-- projeto_basico | Projeto Básico — Obras e Engenharia  | 7
-- tr             | Termo de Referência — Lei 14.133/2021 | 12
