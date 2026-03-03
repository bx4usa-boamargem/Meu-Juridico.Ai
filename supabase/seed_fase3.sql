-- ==========================================
-- SEED DE TEMPLATES — FASE 3 (MÓDULO A)
-- ==========================================

DO $$ 
DECLARE
  v_dfd_id UUID := '11111111-1111-1111-1111-111111111111';
  v_etp_id UUID := '22222222-2222-2222-2222-222222222222';
  v_tr_id  UUID := '33333333-3333-3333-3333-333333333333';
BEGIN

  -- 1. TEMPLATE DFD
  INSERT INTO document_templates (id, name, doc_type, description, is_active, created_at)
  VALUES (
    v_dfd_id,
    'Documento de Formalização da Demanda (DFD)',
    'DFD',
    'Fundamenta o plano de contratações anual. A área requisitante evidencia e detalha a necessidade de contratação conforme Lei 14.133/2021.',
    true,
    now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO document_sections (template_id, section_number, title, agent, required, section_type, tab_category, depends_on) VALUES
  (v_dfd_id, '1', 'Informações Gerais', 'document-structure-engine', true, 'form', 'negocio', null),
  (v_dfd_id, '2', 'Descrição Sucinta do Objeto', 'technical-expansion-engine', true, 'generated', 'negocio', '1'),
  (v_dfd_id, '3', 'Grau de Prioridade', 'document-structure-engine', true, 'form', 'negocio', '1'),
  (v_dfd_id, '4', 'Justificativa da Necessidade da Contratação', 'technical-expansion-engine', true, 'generated', 'juridico', '2'),
  (v_dfd_id, '5', 'Estimativa de Quantidades e Valores', 'technical-expansion-engine', false, 'generated', 'negocio', '4'),
  (v_dfd_id, '6', 'Identificação da Área Requisitante e Responsáveis', 'document-structure-engine', true, 'form', 'negocio', null),
  (v_dfd_id, '7', 'Despacho', 'legal-argumentation-engine', true, 'generated', 'juridico', '4')
  ON CONFLICT DO NOTHING;

  -- 2. TEMPLATE ETP
  INSERT INTO document_templates (id, name, doc_type, description, is_active, created_at)
  VALUES (
    v_etp_id,
    'Estudo Técnico Preliminar (ETP)',
    'ETP',
    'Primeira etapa do planejamento de contratação. Caracteriza o interesse público e sua melhor solução. Base para o Termo de Referência conforme Lei 14.133/2021.',
    true,
    now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO document_sections (template_id, section_number, title, agent, required, section_type, tab_category, depends_on) VALUES
  (v_etp_id, '1',    'Introdução',                                    'document-structure-engine',       true,  'static',    'negocio',     null),
  (v_etp_id, '2',    'Informações Básicas',                           'document-structure-engine',       true,  'form',      'negocio',     null),
  (v_etp_id, '3',    'Descrição da Necessidade / Justificativa',      'technical-expansion-engine',      true,  'generated', 'negocio',     '2'),
  (v_etp_id, '4',    'Equipe de Planejamento',                        'document-structure-engine',       true,  'form',      'negocio',     null),
  (v_etp_id, '5',    'Necessidades de Negócio',                       'technical-expansion-engine',      true,  'generated', 'negocio',     '3'),
  (v_etp_id, '6',    'Necessidades Tecnológicas',                     'technical-expansion-engine',      false, 'generated', 'tecnologico', '5'),
  (v_etp_id, '7',    'Requisitos Legais',                             'normative-compliance-engine',     true,  'generated', 'legal',       '2'),
  (v_etp_id, '8',    'Requisitos Gerais',                             'technical-expansion-engine',      true,  'generated', 'negocio',     '5'),
  (v_etp_id, '9',    'Requisitos Temporais',                          'technical-expansion-engine',      true,  'generated', 'negocio',     '2'),
  (v_etp_id, '10',   'Requisitos de Segurança',                       'technical-expansion-engine',      true,  'generated', 'seguranca',   '2'),
  (v_etp_id, '11',   'Requisitos Sociais, Ambientais e Culturais',    'technical-expansion-engine',      true,  'generated', 'social',      '2'),
  (v_etp_id, '12',   'Requisitos de Projeto e Implementação',         'technical-expansion-engine',      false, 'generated', 'projeto',     '5'),
  (v_etp_id, '13',   'Requisitos de Garantia Técnica',                'technical-expansion-engine',      false, 'generated', 'garantia',    '5'),
  (v_etp_id, '14',   'Requisitos de Experiência',                     'technical-expansion-engine',      false, 'generated', 'experiencia', '5'),
  (v_etp_id, '15',   'Estimativa da Demanda — Quantidades',           'technical-expansion-engine',      true,  'generated', 'negocio',     '5'),
  (v_etp_id, '16',   'Levantamento de Mercado',                       'technical-expansion-engine',      true,  'generated', 'negocio',     '15'),
  (v_etp_id, '17',   'Análise Comparativa das Soluções',              'technical-expansion-engine',      true,  'generated', 'negocio',     '16'),
  (v_etp_id, '18',   'Solução Escolhida e Justificativa',             'legal-argumentation-engine',      true,  'generated', 'juridico',    '17'),
  (v_etp_id, '19',   'Justificativa para Adoção do SRP',              'legal-argumentation-engine',      false, 'generated', 'juridico',    '3'),
  (v_etp_id, '20',   'Estimativa de Custos',                          'technical-expansion-engine',      true,  'generated', 'negocio',     '15'),
  (v_etp_id, '21',   'Declaração de Viabilidade',                     'validation-gap-engine',           true,  'generated', 'juridico',    '20')
  ON CONFLICT DO NOTHING;

  -- 3. TEMPLATE TR
  INSERT INTO document_templates (id, name, doc_type, description, is_active, created_at)
  VALUES (
    v_tr_id,
    'Termo de Referência (TR)',
    'TR',
    'Define as condições para contratação de bens e serviços. Elaborado após conclusão do ETP conforme Lei 14.133/2021.',
    true,
    now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO document_sections (template_id, section_number, title, agent, required, section_type, tab_category, depends_on) VALUES
  (v_tr_id, '1',  'Condições Gerais da Contratação',                 'document-structure-engine',   true,  'generated', 'negocio',     null),
  (v_tr_id, '2',  'Quadro de Itens',                                 'document-structure-engine',   true,  'form',      'negocio',     '1'),
  (v_tr_id, '3',  'Alinhamento com PCA e PNCP',                      'normative-compliance-engine', true,  'generated', 'legal',       '1'),
  (v_tr_id, '4',  'Da Participação em Consórcio',                    'legal-argumentation-engine',  true,  'generated', 'juridico',    '1'),
  (v_tr_id, '5',  'Da Subcontratação',                               'legal-argumentation-engine',  true,  'generated', 'juridico',    '1'),
  (v_tr_id, '6',  'Justificativa para Não Parcelamento',             'legal-argumentation-engine',  true,  'generated', 'juridico',    '1'),
  (v_tr_id, '7',  'Fundamentação e Descrição da Necessidade',        'technical-expansion-engine',  true,  'generated', 'negocio',     '1'),
  (v_tr_id, '8',  'Dos Benefícios a Serem Alcançados',               'technical-expansion-engine',  true,  'generated', 'negocio',     '7'),
  (v_tr_id, '9',  'Justificativa para Adoção do SRP',                'legal-argumentation-engine',  false, 'generated', 'juridico',    '1'),
  (v_tr_id, '10', 'Descrição da Solução — Ciclo de Vida',            'technical-expansion-engine',  true,  'generated', 'negocio',     '7'),
  (v_tr_id, '11', 'Requisitos Gerais',                               'technical-expansion-engine',  true,  'generated', 'negocio',     '1'),
  (v_tr_id, '12', 'Requisitos Legais',                               'normative-compliance-engine', true,  'generated', 'legal',       '1'),
  (v_tr_id, '13', 'Requisitos Temporais',                            'technical-expansion-engine',  true,  'generated', 'negocio',     '1'),
  (v_tr_id, '14', 'Requisitos de Segurança e Privacidade',           'technical-expansion-engine',  true,  'generated', 'seguranca',   '1'),
  (v_tr_id, '15', 'Requisitos Sociais, Ambientais e Culturais',      'technical-expansion-engine',  true,  'generated', 'social',      '1'),
  (v_tr_id, '16', 'Requisitos de Garantia Técnica',                  'technical-expansion-engine',  false, 'generated', 'garantia',    '1'),
  (v_tr_id, '17', 'Modelo de Execução do Objeto',                    'technical-expansion-engine',  true,  'generated', 'negocio',     '10'),
  (v_tr_id, '18', 'Modelo de Gestão do Contrato',                    'technical-expansion-engine',  true,  'generated', 'negocio',     '17'),
  (v_tr_id, '19', 'Critérios de Medição e Pagamento',                'technical-expansion-engine',  true,  'generated', 'negocio',     '18'),
  (v_tr_id, '20', 'Sanções Administrativas',                         'legal-argumentation-engine',  true,  'generated', 'juridico',    '1'),
  (v_tr_id, '21', 'Estimativa de Preços e Pesquisa de Mercado',      'technical-expansion-engine',  true,  'generated', 'negocio',     '2'),
  (v_tr_id, '22', 'Adequação Orçamentária',                          'document-structure-engine',   true,  'form',      'negocio',     '21')
  ON CONFLICT DO NOTHING;

END $$;
