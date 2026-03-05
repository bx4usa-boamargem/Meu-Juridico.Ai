
-- 1. DOCUMENT TEMPLATES TABLE
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  icon text,
  sections_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read templates"
  ON public.document_templates FOR SELECT
  TO authenticated
  USING (true);

-- 2. SEED 7 DOCUMENT TEMPLATES
INSERT INTO public.document_templates (doc_type, title, description, icon, sections_plan) VALUES
('DFD', 'DFD', 'Documento de Formalização da Demanda', '📋', '[{"section_id":"area_requisitante","title":"Área Requisitante","order_index":1,"required":true,"instructions":"Identifique a área demandante, setor e responsável."},{"section_id":"identificacao_demanda","title":"Identificação da Demanda","order_index":2,"required":true,"instructions":"Descreva o objeto da contratação, categoria e modalidade."},{"section_id":"justificativa","title":"Justificativa da Contratação","order_index":3,"required":true,"instructions":"Justifique a necessidade da contratação e descreva a necessidade."},{"section_id":"resultados","title":"Resultados Pretendidos","order_index":4,"required":true,"instructions":"Identifique o problema público e o impacto esperado."},{"section_id":"alinhamento","title":"Alinhamento Estratégico","order_index":5,"required":true,"instructions":"Descreva o alinhamento estratégico e fundamento legal."},{"section_id":"quantidades","title":"Estimativa de Quantidades","order_index":6,"required":true,"instructions":"Estime quantidades, unidades de medida e descreva os itens."},{"section_id":"classificacao","title":"Classificação do Objeto","order_index":7,"required":true,"instructions":"Informe valor estimado, prioridade e prazo de entrega."},{"section_id":"orcamento","title":"Recursos Orçamentários","order_index":8,"required":false,"instructions":"Informações sobre recursos orçamentários disponíveis."},{"section_id":"encaminhamento","title":"Responsáveis e Encaminhamento","order_index":9,"required":true,"instructions":"Identifique responsável técnico, fiscal e ordenador de despesa."}]'::jsonb),
('ETP', 'ETP', 'Estudo Técnico Preliminar', '🔍', '[{"section_id":"descricao_necessidade","title":"Descrição da Necessidade","order_index":1,"required":true,"instructions":"Descreva a necessidade da contratação com referência ao DFD."},{"section_id":"area_requisitante","title":"Área Requisitante","order_index":2,"required":true,"instructions":"Identifique a área requisitante e responsáveis."},{"section_id":"levantamento_mercado","title":"Levantamento de Mercado","order_index":3,"required":true,"instructions":"Apresente as soluções disponíveis no mercado."},{"section_id":"requisitos","title":"Requisitos da Contratação","order_index":4,"required":true,"instructions":"Defina os requisitos técnicos e funcionais."},{"section_id":"estimativa_precos","title":"Estimativa de Preços","order_index":5,"required":true,"instructions":"Apresente estimativa de preços com base em pesquisa de mercado."},{"section_id":"descricao_solucao","title":"Descrição da Solução","order_index":6,"required":true,"instructions":"Descreva a solução escolhida e sua justificativa."},{"section_id":"justificativa_parcelamento","title":"Justificativa do Parcelamento","order_index":7,"required":false,"instructions":"Justifique o parcelamento ou não da solução."},{"section_id":"contratacoes_correlatas","title":"Contratações Correlatas","order_index":8,"required":false,"instructions":"Identifique contratações correlatas ou interdependentes."},{"section_id":"alinhamento_pca","title":"Alinhamento ao PCA","order_index":9,"required":false,"instructions":"Demonstre alinhamento ao Plano de Contratações Anual."},{"section_id":"viabilidade","title":"Análise de Viabilidade","order_index":10,"required":true,"instructions":"Apresente a análise de viabilidade da solução escolhida."}]'::jsonb),
('TR', 'Termo de Referência', 'Para serviços e compras', '📄', '[{"section_id":"definicao_objeto","title":"Definição do Objeto","order_index":1,"required":true,"instructions":"Defina o objeto da contratação de forma precisa e suficiente."},{"section_id":"fundamentacao","title":"Fundamentação da Contratação","order_index":2,"required":true,"instructions":"Fundamente a contratação com base no ETP."},{"section_id":"descricao_solucao","title":"Descrição da Solução","order_index":3,"required":true,"instructions":"Descreva detalhadamente a solução a ser contratada."},{"section_id":"requisitos","title":"Requisitos da Contratação","order_index":4,"required":true,"instructions":"Especifique requisitos de habilitação e qualificação."},{"section_id":"modelo_execucao","title":"Modelo de Execução","order_index":5,"required":true,"instructions":"Descreva o modelo de execução do objeto."},{"section_id":"modelo_gestao","title":"Modelo de Gestão","order_index":6,"required":true,"instructions":"Descreva o modelo de gestão do contrato."},{"section_id":"criterios_medicao","title":"Critérios de Medição e Pagamento","order_index":7,"required":true,"instructions":"Defina critérios de medição, aceitação e pagamento."},{"section_id":"estimativa_valor","title":"Estimativa de Valor","order_index":8,"required":true,"instructions":"Apresente o valor estimado da contratação."},{"section_id":"adequacao_orcamentaria","title":"Adequação Orçamentária","order_index":9,"required":true,"instructions":"Demonstre a adequação orçamentária."},{"section_id":"sancoes","title":"Sanções","order_index":10,"required":true,"instructions":"Defina as sanções aplicáveis."}]'::jsonb),
('projeto_basico', 'Projeto Básico', 'Para obras e engenharia', '🏗️', '[{"section_id":"objeto","title":"Objeto","order_index":1,"required":true,"instructions":"Defina o objeto da obra ou serviço de engenharia."},{"section_id":"justificativa","title":"Justificativa","order_index":2,"required":true,"instructions":"Justifique a necessidade da obra."},{"section_id":"especificacoes","title":"Especificações Técnicas","order_index":3,"required":true,"instructions":"Detalhe as especificações técnicas da obra."},{"section_id":"cronograma","title":"Cronograma Físico-Financeiro","order_index":4,"required":true,"instructions":"Apresente o cronograma de execução e desembolso."},{"section_id":"orcamento_detalhado","title":"Orçamento Detalhado","order_index":5,"required":true,"instructions":"Apresente planilha orçamentária detalhada."},{"section_id":"criterios_aceitacao","title":"Critérios de Aceitação","order_index":6,"required":true,"instructions":"Defina critérios de medição e aceitação dos serviços."},{"section_id":"riscos","title":"Análise de Riscos","order_index":7,"required":false,"instructions":"Identifique e analise riscos do projeto."}]'::jsonb),
('mapa_risco', 'Mapa de Risco', 'Identificação e alocação de riscos', '⚠️', '[{"section_id":"identificacao_riscos","title":"Identificação de Riscos","order_index":1,"required":true,"instructions":"Identifique os riscos associados ao processo."},{"section_id":"probabilidade_impacto","title":"Probabilidade e Impacto","order_index":2,"required":true,"instructions":"Avalie a probabilidade e o impacto de cada risco."},{"section_id":"alocacao","title":"Alocação de Riscos","order_index":3,"required":true,"instructions":"Defina a alocação dos riscos entre as partes."},{"section_id":"mitigacao","title":"Ações de Mitigação","order_index":4,"required":true,"instructions":"Proponha ações de mitigação e contingência."},{"section_id":"monitoramento","title":"Monitoramento","order_index":5,"required":false,"instructions":"Defina plano de monitoramento dos riscos."}]'::jsonb),
('edital', 'Edital', 'Pregão Eletrônico', '📢', '[{"section_id":"preambulo","title":"Preâmbulo","order_index":1,"required":true,"instructions":"Identifique o órgão, modalidade, número e objeto."},{"section_id":"objeto","title":"Objeto","order_index":2,"required":true,"instructions":"Defina o objeto da licitação com base no TR."},{"section_id":"condicoes_participacao","title":"Condições de Participação","order_index":3,"required":true,"instructions":"Defina as condições para participação."},{"section_id":"habilitacao","title":"Habilitação","order_index":4,"required":true,"instructions":"Defina os documentos de habilitação exigidos."},{"section_id":"proposta","title":"Proposta","order_index":5,"required":true,"instructions":"Defina os requisitos da proposta comercial."},{"section_id":"julgamento","title":"Critérios de Julgamento","order_index":6,"required":true,"instructions":"Defina os critérios de julgamento das propostas."},{"section_id":"recursos","title":"Recursos","order_index":7,"required":true,"instructions":"Defina os procedimentos de recurso."},{"section_id":"contrato","title":"Contrato","order_index":8,"required":true,"instructions":"Defina as condições contratuais."},{"section_id":"disposicoes_gerais","title":"Disposições Gerais","order_index":9,"required":true,"instructions":"Inclua disposições finais e transitórias."}]'::jsonb),
('custom', 'Personalizado', 'Monte seu próprio documento', '✏️', '[]'::jsonb);

-- 3. MONITORING CONFIG TABLE
CREATE TABLE public.monitoring_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frequency text NOT NULL DEFAULT 'daily',
  is_active boolean NOT NULL DEFAULT true,
  cost_limit_usd numeric(10,2) NOT NULL DEFAULT 5.00,
  last_run_at timestamptz,
  next_run_at timestamptz,
  scope jsonb NOT NULL DEFAULT '{"federal":["TCU","CGU","PNCP"],"estados":["SP","RJ","MG"]}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monitoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read monitoring config"
  ON public.monitoring_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update monitoring config"
  ON public.monitoring_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.monitoring_config (frequency, is_active, cost_limit_usd, next_run_at)
VALUES ('daily', true, 5.00, now() + interval '1 day');

-- 4. MONITORING ALERTS TABLE
CREATE TABLE public.monitoring_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  title text NOT NULL,
  summary text,
  impact_analysis text,
  affected_doc_types text[] DEFAULT '{}',
  severity text NOT NULL DEFAULT 'medium',
  is_relevant boolean NOT NULL DEFAULT true,
  source_url text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read alerts"
  ON public.monitoring_alerts FOR SELECT TO authenticated USING (true);

-- 5. MONITORING RUNS TABLE
CREATE TABLE public.monitoring_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  items_collected integer DEFAULT 0,
  items_filtered_out integer DEFAULT 0,
  items_analyzed_light integer DEFAULT 0,
  items_analyzed_deep integer DEFAULT 0,
  alerts_generated integer DEFAULT 0,
  estimated_cost_usd numeric(10,4) DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monitoring_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read monitoring runs"
  ON public.monitoring_runs FOR SELECT TO authenticated USING (true);
