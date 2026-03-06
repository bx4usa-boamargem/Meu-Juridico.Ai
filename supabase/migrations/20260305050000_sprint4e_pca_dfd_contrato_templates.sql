-- ============================================================
-- SPRINT 4e — PCA, DFD e CONTRATOS TEMPLATES
-- Completing the Professional Procurement Cycle
-- ============================================================

-- 1. PCA (Plano de Contratações Anual) - 6 seções
INSERT INTO document_templates (doc_type, section_id, title, agent, skill, order_index, required, instructions) VALUES
('pca','pca_01','Objetivos Estratégicos','AGENT_ADMIN','interpret_requirement_skill',1,true,'Alinhamento com o PPA (Plano Pluriunual) e LOA. Art. 12, VII, Lei 14.133.'),
('pca','pca_02','Relação de Itens Planejados','AGENT_LICIT','procurement_strategy_skill',2,true,'Lista de materiais e serviços para o exercício financeiro seguinte.'),
('pca','pca_03','Cronograma de Execução Estimado','AGENT_ADMIN','generate_section_skill',3,true,'Prazos para abertura de licitações ao longo do ano.'),
('pca','pca_04','Levantamento de Governança','AGENT_JURIDICO','legal_validation_skill',4,true,'Estrutura orgânica e pessoal qualificado para as contratações.'),
('pca','pca_05','Justificativa de Prioridades','AGENT_LICIT','generate_section_skill',5,true,'Critérios para priorização de demandas da prefeitura.'),
('pca','pca_06','Conclusão do Plano','AGENT_ADMIN','generate_section_skill',6,true,'Resumo executivo do plano de compras.');

-- 2. DFD (Documento de Formalização de Demanda) - 5 seções
INSERT INTO document_templates (doc_type, section_id, title, agent, skill, order_index, required, instructions) VALUES
('dfd','dfd_01','Justificativa da Necessidade','AGENT_ADMIN','interpret_requirement_skill',1,true,'Explicação detalhada do porquê a compra é necessária agora.'),
('dfd','dfd_02','Quantidade e Descrição','AGENT_LICIT','generate_section_skill',2,true,'Quantidade estimada baseada em consumo histórico.'),
('dfd','dfd_03','Prazo de Entrega/Execução','AGENT_ADMIN','generate_section_skill',3,true,'Data limite para recebimento do objeto.'),
('dfd','dfd_04','Responsáveis pela Requisição','AGENT_ADMIN','generate_section_skill',4,true,'Setor, servidor responsável e matrícula.'),
('dfd','dfd_05','Alinhamento com o PCA','AGENT_LICIT','generate_section_skill',5,true,'Vínculo com o item correspondente no Plano de Contratações Anual.');

-- 3. CONTRATO (Minuta de Contrato) - 10 seções
INSERT INTO document_templates (doc_type, section_id, title, agent, skill, order_index, required, instructions) VALUES
('contrato','ct_01','Cláusula Primeira: Objeto','AGENT_JURIDICO','legal_validation_skill',1,true,'Vincular ao Edital e TR. Art. 92, I, Lei 14.133.'),
('contrato','ct_02','Vigência e Prorrogação','AGENT_JURIDICO','legal_validation_skill',2,true,'Prazo de duração. Arts. 105-114.'),
('contrato','ct_03','Preço e Condições de Pagamento','AGENT_RESEARCH','price_research_skill',3,true,'Forma de reajuste e prazos. Art. 92, V.'),
('contrato','ct_04','Dotação Orçamentária','AGENT_ADMIN','generate_section_skill',4,true,'Cessão de recursos. Art. 92, VIII.'),
('contrato','ct_05','Obrigações da Contratada','AGENT_JURIDICO','legal_validation_skill',5,true,'Responsabilidades técnicas e trabalhistas.'),
('contrato','ct_06','Obrigações da Contratante','AGENT_JURIDICO','legal_validation_skill',6,true,'Pagamento, fiscalização e recebimento.'),
('contrato','ct_07','Sanções Administrativas','AGENT_JURIDICO','legal_validation_skill',7,true,'Penalidades por descumprimento. Art. 156.'),
('contrato','ct_08','Rescisão Contratual','AGENT_JURIDICO','legal_validation_skill',8,true,'Hipóteses de extinção do contrato. Arts. 137-139.'),
('contrato','ct_09','Gestão e Fiscalização','AGENT_ADMIN','generate_section_skill',9,true,'Indicação do gestor e fiscal. Art. 117.'),
('contrato','ct_10','Foro e Assinaturas','AGENT_JURIDICO','generate_section_skill',10,true,'Eleição de foro e conformidade legal.');
