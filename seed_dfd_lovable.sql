-- =========================================================================
-- MEUJURIDICO.AI - SPRINT 1
-- INSERÇÃO DO TEMPLATE DE DFD (Documento de Formalização de Demanda)
-- =========================================================================

-- 1. DFD (5 seções padrões baseadas na Lei 14.133/2021)
INSERT INTO document_templates (doc_type, section_id, title, agent, skill, order_index, required, instructions) VALUES
('dfd','dfd_01','Identificação do Setor Requisitante','AGENT_ADMIN','interpret_requirement_skill',1,true,'Setor, responsável e data da formalização da demanda.'),
('dfd','dfd_02','Justificativa da Necessidade','AGENT_LICIT','generate_section_skill',2,true,'Motivos que justificam a necessidade da contratação pela Administração. Art. 18, I da Lei 14.133/2021.'),
('dfd','dfd_03','Quantidade a ser Contratada/Adquirida','AGENT_LICIT','generate_section_skill',3,true,'Estimativa de quantitativos com base em consumo/previsão de uso.'),
('dfd','dfd_04','Previsão no PAC','AGENT_ADMIN','interpret_requirement_skill',4,true,'Indicação de alinhamento ao Plano de Contratações Anual.'),
('dfd','dfd_05','Estimativa Preliminar do Valor','AGENT_RESEARCH','price_research_skill',5,false,'Valor preliminar estimado (opcional no DFD, será aprofundado no ETP).')
ON CONFLICT (doc_type, section_id) DO UPDATE SET title = EXCLUDED.title, agent = EXCLUDED.agent, skill = EXCLUDED.skill, order_index = EXCLUDED.order_index, required = EXCLUDED.required, instructions = EXCLUDED.instructions;

-- CONFIRMAR INSERÇÃO NO FINAL
SELECT doc_type, COUNT(*) as secoes_inseridas
FROM document_templates
WHERE doc_type = 'dfd'
GROUP BY doc_type;
