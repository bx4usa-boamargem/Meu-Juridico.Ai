-- =========================================================================
-- MEUJURIDICO.AI - SPRINT 1
-- INSERÇÃO DE TEMPLATES (ETP, TR, Projeto Básico, Mapa de Risco, Edital, Custom)
-- =========================================================================

-- ETAPA 1: VERIFICAR ANTES (Opcional)
-- SELECT doc_type, COUNT(*) as secoes FROM document_templates GROUP BY doc_type ORDER BY doc_type;

-- ETAPA 2: INSERIR TEMPLATES NO BANCO

-- 1. ETP (10 seções)
INSERT INTO document_templates (doc_type, section_id, title, agent, skill, order_index, required, instructions) VALUES
('etp','etp_01','Descrição da Necessidade','AGENT_LICIT','generate_section_skill',1,true,'Descreva a necessidade que originou a contratação. Referenciar DFD aprovado se existir. Base: art. 18, I, Lei 14.133/2021.'),
('etp','etp_02','Área Requisitante','AGENT_ADMIN','interpret_requirement_skill',2,true,'Identificar setor solicitante, responsável e justificativa da demanda interna.'),
('etp','etp_03','Requisitos da Contratação','AGENT_LICIT','generate_section_skill',3,true,'Requisitos técnicos, legais e de negócio. Art. 11, IV, Lei 14.133/2021.'),
('etp','etp_04','Levantamento de Mercado','AGENT_RESEARCH','price_research_skill',4,true,'Pesquisa com mínimo 3 fontes ou PNCP. Metodologia IN SEGES 65/2021.'),
('etp','etp_05','Descrição da Solução Escolhida','AGENT_LICIT','generate_section_skill',5,true,'Solução selecionada após análise comparativa. Art. 18, IV, Lei 14.133/2021.'),
('etp','etp_06','Estimativa do Valor','AGENT_RESEARCH','price_research_skill',6,true,'Estimativa fundamentada com memória de cálculo. Referenciar fontes.'),
('etp','etp_07','Justificativa da Solução','AGENT_JURIDICO','legal_validation_skill',7,true,'Fundamentação jurídica. Art. 5º, Lei 14.133/2021.'),
('etp','etp_08','Contratações Correlatas','AGENT_LICIT','generate_section_skill',8,false,'Contratos relacionados. Art. 18, VIII, Lei 14.133/2021.'),
('etp','etp_09','Impactos Ambientais','AGENT_LICIT','generate_section_skill',9,false,'Impactos e medidas mitigatórias. Decreto 7.746/2012.'),
('etp','etp_10','Posicionamento Conclusivo','AGENT_JURIDICO','legal_validation_skill',10,true,'Conclusão da equipe com recomendação de prosseguimento.');

-- 2. TR (12 seções)
INSERT INTO document_templates (doc_type, section_id, title, agent, skill, order_index, required, instructions) VALUES
('tr','tr_01','Definição do Objeto','AGENT_LICIT','generate_section_skill',1,true,'Descrição precisa. Art. 6º, XXIII, a. Sem ambiguidade.'),
('tr','tr_02','Fundamentação da Contratação','AGENT_JURIDICO','legal_validation_skill',2,true,'Base legal. Vincular ETP e DFD. Art. 6º, XXIII, b.'),
('tr','tr_03','Descrição da Solução','AGENT_LICIT','generate_section_skill',3,true,'Como será executado, entregue e recebido.'),
('tr','tr_04','Requisitos da Contratação','AGENT_LICIT','generate_section_skill',4,true,'Requisitos técnicos e de habilitação. Art. 6º, XXIII, d.'),
('tr','tr_05','Modelo de Execução','AGENT_LICIT','generate_section_skill',5,true,'Condições, cronograma, local, responsabilidades. Art. 6º, XXIII, e.'),
('tr','tr_06','Modelo de Gestão do Contrato','AGENT_LICIT','generate_section_skill',6,true,'Fiscalização, gestor, rotinas. Art. 117, Lei 14.133/2021.'),
('tr','tr_07','Critérios de Medição e Pagamento','AGENT_LICIT','generate_section_skill',7,true,'Medição e prazos de pagamento. Art. 141, Lei 14.133/2021.'),
('tr','tr_08','Forma de Seleção do Fornecedor','AGENT_LICIT','procurement_strategy_skill',8,true,'Modalidade licitatória. Até R$57k=dispensa, até R$572k=pregão, acima=concorrência. Decreto 11.871/2023.'),
('tr','tr_09','Estimativa do Valor','AGENT_RESEARCH','price_research_skill',9,true,'Memória de cálculo. Importar etp_06 se ETP vinculado. IN SEGES 65/2021.'),
('tr','tr_10','Adequação Orçamentária','AGENT_ADMIN','generate_section_skill',10,true,'Dotação, programa de trabalho, elemento de despesa. Art. 6º, XXIII, j.'),
('tr','tr_11','Matriz de Riscos','AGENT_JURIDICO','risk_analysis_skill',11,true,'Tabela: Risco|Probabilidade|Impacto|Responsável|Mitigação. Art. 22, Lei 14.133/2021.'),
('tr','tr_12','Critérios de Sustentabilidade','AGENT_LICIT','generate_section_skill',12,false,'Requisitos ambientais. Decreto 7.746/2012.');

-- 3. Projeto Básico (7 seções)
INSERT INTO document_templates (doc_type, section_id, title, agent, skill, order_index, required, instructions) VALUES
('projeto_basico','pb_01','Desenvolvimento da Solução','AGENT_LICIT','generate_section_skill',1,true,'Solução de engenharia. Metodologia e especificações técnicas.'),
('projeto_basico','pb_02','Especificações Técnicas','AGENT_LICIT','generate_section_skill',2,true,'Memorial descritivo. ABNT e normas aplicáveis.'),
('projeto_basico','pb_03','Critérios de Medição','AGENT_LICIT','generate_section_skill',3,true,'Planilha por etapas. Retenção de garantia.'),
('projeto_basico','pb_04','Prazo de Execução','AGENT_LICIT','generate_section_skill',4,true,'Prazo total e por etapa. Cronograma. Penalidades.'),
('projeto_basico','pb_05','Orçamento Detalhado','AGENT_RESEARCH','price_research_skill',5,true,'Planilha com BDI. SINAPI ou SICRO como referência.'),
('projeto_basico','pb_06','Cronograma Físico-Financeiro','AGENT_LICIT','generate_section_skill',6,true,'Distribuição mensal. Curva S.'),
('projeto_basico','pb_07','Responsabilidade Técnica','AGENT_ADMIN','generate_section_skill',7,true,'ART/RRT do responsável. CREA/CAU competente.');

-- 4. Mapa de Risco (4 seções)
INSERT INTO document_templates (doc_type, section_id, title, agent, skill, order_index, required, instructions) VALUES
('mapa_risco','mr_01','Identificação dos Riscos','AGENT_JURIDICO','risk_analysis_skill',1,true,'Riscos técnicos, operacionais, financeiros, jurídicos e de força maior.'),
('mapa_risco','mr_02','Avaliação de Probabilidade e Impacto','AGENT_JURIDICO','risk_analysis_skill',2,true,'Matriz 3x3: Probabilidade x Impacto.'),
('mapa_risco','mr_03','Alocação de Responsabilidade','AGENT_JURIDICO','risk_analysis_skill',3,true,'Contratante, Contratada ou compartilhado. Art. 22, Lei 14.133/2021.'),
('mapa_risco','mr_04','Medidas de Tratamento','AGENT_JURIDICO','risk_analysis_skill',4,true,'Ações preventivas e corretivas. Cláusulas contratuais recomendadas.');

-- 5. Edital (9 seções)
INSERT INTO document_templates (doc_type, section_id, title, agent, skill, order_index, required, instructions) VALUES
('edital','ed_01','Preâmbulo e Identificação','AGENT_ADMIN','generate_section_skill',1,true,'Órgão, número do processo, modalidade, objeto resumido, data/hora da sessão.'),
('edital','ed_02','Objeto','AGENT_LICIT','generate_section_skill',2,true,'Importar tr_01 se TR vinculado. Art. 40, I, Lei 14.133/2021.'),
('edital','ed_03','Condições de Participação','AGENT_JURIDICO','legal_validation_skill',3,true,'Art. 14, Lei 14.133/2021. LC 123/2006 para ME/EPP.'),
('edital','ed_04','Proposta Comercial','AGENT_LICIT','generate_section_skill',4,true,'Forma, validade mínima 60 dias, planilha de composição.'),
('edital','ed_05','Critério de Julgamento','AGENT_LICIT','procurement_strategy_skill',5,true,'Importar tr_08 se TR vinculado. Art. 33, Lei 14.133/2021.'),
('edital','ed_06','Habilitação','AGENT_JURIDICO','legal_validation_skill',6,true,'Documentação jurídica, fiscal, trabalhista, econômica, técnica. Arts. 62-70.'),
('edital','ed_07','Impugnações e Esclarecimentos','AGENT_JURIDICO','legal_validation_skill',7,true,'3 dias úteis para impugnação. Art. 164.'),
('edital','ed_08','Sanções Administrativas','AGENT_JURIDICO','legal_validation_skill',8,true,'Arts. 155-163, Lei 14.133/2021.'),
('edital','ed_09','Disposições Finais','AGENT_JURIDICO','generate_section_skill',9,true,'Legislação aplicável, foro, anexos.');

-- 6. Custom (1 seção livre)
INSERT INTO document_templates (doc_type, section_id, title, agent, skill, order_index, required, instructions) VALUES
('custom','custom_01','Seção Personalizada','AGENT_LICIT','generate_section_skill',1,false,'Seção criada pelo usuário. Gerar conteúdo formal conforme título e instruções fornecidas.');

-- =========================================================================
-- CONFIRMAR INSERÇÃO (Deve retornar os totais listados na Etapa 2)
-- =========================================================================

SELECT doc_type, COUNT(*) as secoes_inseridas
FROM document_templates
GROUP BY doc_type ORDER BY doc_type;
