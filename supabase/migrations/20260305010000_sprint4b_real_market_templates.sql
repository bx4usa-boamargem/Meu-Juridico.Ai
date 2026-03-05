-- ============================================================
-- SPRINT 4b — Templates de Mercado Real (ETP e TR)
-- Baseado em: IN 58/2022 (SEGES), padrão TCU, órgãos federais e SP
-- 14 seções para ETP · 13 seções para TR
-- MeuJurídico.ai — Março 2026
-- ============================================================

-- ────────────────────────────────────────────
-- ETP — 14 Seções (Padrão Real IN 58/2022 + TCU)
-- Estrutura observada em ETPs publicados no PNCP
-- com valores acima de R$ 500k (30-40 páginas)
-- ────────────────────────────────────────────
UPDATE document_templates
SET
  name         = 'ETP — Padrão Real de Mercado (14 seções · IN 58/2022 + TCU)',
  sections_plan = '[
    {
      "section_id": "etp_01",
      "section_number": "1",
      "title": "Introdução e Identificação do Documento",
      "order_index": 1,
      "required": true,
      "instructions": "Apresentar o objetivo do ETP, identificar o órgão requisitante, o processo administrativo, o responsável pela elaboração e a data de elaboração. Mencionar a fundamentação legal (art. 18, § 1º, Lei 14.133/2021) e a IN SEGES 58/2022. Incluir histórico de contratações anteriores, se houver."
    },
    {
      "section_id": "etp_02",
      "section_number": "2",
      "title": "Descrição da Necessidade da Contratação",
      "order_index": 2,
      "required": true,
      "instructions": "Descrever com EXTREMA precisão e profundidade a necessidade que originou a contratação, sob a perspectiva do interesse público. Quantificar a demanda, detalhar o problema a ser resolvido, os impactos negativos da não contratação, e os benefícios esperados. Referenciar o PCA (Decreto 10.947/2022). Incluir séries históricas de consumo e dados de demanda por área/unidade, se aplicável. Esta seção deve ter entre 3 e 5 páginas."
    },
    {
      "section_id": "etp_03",
      "section_number": "3",
      "title": "Alinhamento com o Plano de Contratações Anual (PCA) e Planejamento Estratégico",
      "order_index": 3,
      "required": true,
      "instructions": "Demonstrar que a contratação está prevista ou justificada no PCA. Vincular ao Plano Estratégico Institucional, metas do PDI, ou instrumento equivalente. Informar o número do item no PCA, a unidade demandante, e o link de referência. Explicar o alinhamento com os ODS e metas de governo, se aplicável."
    },
    {
      "section_id": "etp_04",
      "section_number": "4",
      "title": "Requisitos da Contratação",
      "order_index": 4,
      "required": true,
      "instructions": "Listar todos os requisitos técnicos, legais, normativos, ambientais e de negócio que a solução deve atender. Organizar em subcategorias: (4.1) Requisitos Técnicos e Normativos, (4.2) Requisitos de Qualificação, (4.3) Requisitos de Execução e Gestão, (4.4) Requisitos de Sustentabilidade (Decreto 7.746/2012), (4.5) Requisitos de Segurança da Informação (quando aplicável). Ser exaustivo e citar normas ABNT, resoluções e portarias específicas do objeto."
    },
    {
      "section_id": "etp_05",
      "section_number": "5",
      "title": "Estimativas das Quantidades para a Contratação",
      "order_index": 5,
      "required": true,
      "instructions": "Apresentar a metodologia de cálculo das quantidades com memória de cálculo detalhada. Incluir: (5.1) Metodologia e premissas adotadas, (5.2) Histórico de consumo ou utilização anterior, (5.3) Projeção de crescimento e sazonalidade, (5.4) Tabela consolidada por item com unidade de medida, quantidades anuais e justificativa. Referenciar planilha anexa se houver."
    },
    {
      "section_id": "etp_06",
      "section_number": "6",
      "title": "Levantamento de Mercado e Alternativas Disponíveis",
      "order_index": 6,
      "required": true,
      "instructions": "Identificar as soluções disponíveis no mercado para atender à necessidade. Apresentar pelo menos 3 alternativas estudadas (incluindo execução direta, terceirização, convênio, SRP). Para cada alternativa, avaliar: viabilidade técnica, capacidade de mercado, custo-benefício, sustentabilidade, riscos e aderência à legislação. Concluir com a alternativa selecionada e sua justificativa. Esta seção deve ter entre 4 e 6 páginas."
    },
    {
      "section_id": "etp_07",
      "section_number": "7",
      "title": "Descrição da Solução como um Todo",
      "order_index": 7,
      "required": true,
      "instructions": "Descrever em profundidade a solução escolhida, incluindo: (7.1) Escopo completo dos serviços ou fornecimentos, (7.2) Modelo de execução proposto, (7.3) Metodologia de prestação do serviço ou entrega, (7.4) Infraestrutura, ferramental e equipe necessários, (7.5) Aspectos de manutenção e assistência técnica, (7.6) Integração com sistemas ou contratos existentes. Incluir diagramas ou esquemas descritivos se pertinente."
    },
    {
      "section_id": "etp_08",
      "section_number": "8",
      "title": "Estimativa do Valor da Contratação",
      "order_index": 8,
      "required": true,
      "instructions": "Apresentar com transparência a estimativa de custos conforme a IN SEGES 65/2021. Incluir: (8.1) Metodologia de pesquisa de preços adotada, (8.2) Fontes consultadas (PNCP, Painel de Preços, fornecedores, contratos similares), (8.3) Planilha com composição de custos por item/serviço, (8.4) Memória de cálculo do valor global, (8.5) Análise crítica (outliers descartados, justificativa da média/mediana usada). Todos os valores devem ser apresentados com metodologia clara. Valor global ao final."
    },
    {
      "section_id": "etp_09",
      "section_number": "9",
      "title": "Justificativa para o Parcelamento ou Não da Solução",
      "order_index": 9,
      "required": true,
      "instructions": "Analisar tecnicamente se o objeto admite parcelamento (art. 40, §1º, Lei 14.133/2021 e Súmula TCU 247). Apresentar argumentos técnicos, econômicos e operacionais para a decisão. Se optar por não parcelar, justificar com base na inviabilidade técnica, desvantagem econômica ou prejuízo à estratégia da licitação. Citar jurisprudência do TCU se pertinente."
    },
    {
      "section_id": "etp_10",
      "section_number": "10",
      "title": "Demonstrativo dos Resultados Pretendidos em Termos de Economicidade e Melhor Aproveitamento dos Recursos",
      "order_index": 10,
      "required": true,
      "instructions": "Quantificar os benefícios esperados com a contratação: (10.1) Otimização de custos em relação à alternativa descartada, (10.2) Aumento de produtividade ou qualidade esperada, (10.3) Redução de riscos operacionais ou legais, (10.4) Benchmarks comparativos, (10.5) Indicadores de desempenho (KPIs) que serão monitorados. Sempre que possível, apresentar valores em reais para materializar o ganho."
    },
    {
      "section_id": "etp_11",
      "section_number": "11",
      "title": "Providências a Serem Adotadas pela Administração",
      "order_index": 11,
      "required": true,
      "instructions": "Listar todas as ações que a Administração deverá tomar antes da celebração do contrato, incluindo: (11.1) Capacitação de servidores para fiscalização e gestão contratual, (11.2) Adequações físicas ou tecnológicas necessárias, (11.3) Elaboração de manuais operacionais, (11.4) Definição de equipe de fiscalização (gestor e fiscal), (11.5) Publicações e comunicações internas."
    },
    {
      "section_id": "etp_12",
      "section_number": "12",
      "title": "Contratações Correlatas e/ou Interdependentes",
      "order_index": 12,
      "required": false,
      "instructions": "Identificar e descrever outros contratos vigentes ou em planejamento que guardem relação com o objeto (ex: contrato de manutenção que depende de fornecimento de peças, solução de TIC que depende de suporte técnico). Para cada correlação: indicar número do contrato, objeto, valor, vigência e grau de interdependência. Analisar riscos de dependência e propor mitigações."
    },
    {
      "section_id": "etp_13",
      "section_number": "13",
      "title": "Descrição dos Possíveis Impactos Ambientais e Medidas Mitigadoras",
      "order_index": 13,
      "required": false,
      "instructions": "Identificar e avaliar os impactos ambientais diretos e indiretos do objeto contratado (conforme Decreto 7.746/2012 e A3P). Para cada impacto identificado: (a) classificar por grau de significância, (b) propor medidas mitigadoras e compensatórias, (c) indicar o responsável pela implementação. Incluir critérios de sustentabilidade que serão exigidos no edital (uso de materiais recicláveis, eficiência energética, descarte responsável, etc.)."
    },
    {
      "section_id": "etp_14",
      "section_number": "14",
      "title": "Posicionamento Conclusivo da Equipe de Planejamento",
      "order_index": 14,
      "required": true,
      "instructions": "Apresentar a conclusão fundamentada da Equipe de Planejamento sobre: (14.1) Viabilidade técnica e econômica da contratação, (14.2) Adequação da solução proposta às necessidades identificadas, (14.3) Recomendação expressa de prosseguimento para elaboração do Termo de Referência, (14.4) Eventuais ressalvas ou condicionantes. Finalizar com local, data e campo de assinatura dos servidores responsáveis pela elaboração."
    }
  ]'::jsonb,
  normative_base = '["Lei nº 14.133/2021 art. 18, §1º", "IN SEGES/ME 58/2022", "IN SEGES 65/2021 (preços)", "Decreto 10.947/2022 (PCA)", "Decreto 7.746/2012 (sustentabilidade)", "Súmula TCU 247/2004 (parcelamento)"]'::jsonb,
  updated_at     = now()
WHERE doc_type = 'etp';

-- ────────────────────────────────────────────
-- TR — 13 Seções (Padrão Real · v completa)
-- ────────────────────────────────────────────
UPDATE document_templates
SET
  name         = 'TR — Padrão Real de Mercado (13 seções · Lei 14.133/2021)',
  sections_plan = '[
    {
      "section_id": "tr_01",
      "section_number": "1",
      "title": "Definição do Objeto",
      "order_index": 1,
      "required": true,
      "instructions": "Descrever o objeto de forma precisa, completa e sem ambiguidade (art. 6º, XXIII, a). Incluir: (1.1) Descrição técnica detalhada dos serviços ou bens, (1.2) Código CATSER ou CATMAT (quando aplicável), (1.3) Unidade de medida, (1.4) Quantidade total estimada, (1.5) Prazo contratual previsto. Para serviços continuados, indicar expressamente essa característica. Usar linguagem técnica precisa, sem termos subjetivos."
    },
    {
      "section_id": "tr_02",
      "section_number": "2",
      "title": "Fundamentação e Descrição da Necessidade da Contratação",
      "order_index": 2,
      "required": true,
      "instructions": "Referenciar o ETP aprovado como documento que embasou esta contratação (art. 6º, XXIII, b). Resumir os principais fundamentos do ETP: necessidade identificada, alinhamento com PCA, alternativas descartadas e solução escolhida. Citar o interesse público envolvido e as consequências da não realização da contratação."
    },
    {
      "section_id": "tr_03",
      "section_number": "3",
      "title": "Descrição da Solução como um Todo",
      "order_index": 3,
      "required": true,
      "instructions": "Descrever em profundidade como a solução será entregue/executada pelo contratado. Incluir: (3.1) Escopo detalhado do serviço, (3.2) Especificações técnicas mínimas, (3.3) Padrões de qualidade exigidos (normas ABNT, certificações), (3.4) Recursos humanos e tecnológicos necessários, (3.5) Metodologia de prestação do serviço, (3.6) Frequência de atendimento e regime de trabalho. Esta seção deve ser exaustiva e evitar ambiguidades."
    },
    {
      "section_id": "tr_04",
      "section_number": "4",
      "title": "Requisitos da Contratação",
      "order_index": 4,
      "required": true,
      "instructions": "Listar de forma organizada todos os requisitos exigidos do contratado: (4.1) Requisitos Técnicos indispensáveis ao objeto, (4.2) Requisitos de Qualificação Técnica (atestados, certidões), (4.3) Requisitos de Qualificação Econômico-Financeira, (4.4) Requisitos Normativos e Regulatórios, (4.5) Requisitos de Sustentabilidade (Decreto 7.746/2012), (4.6) Requisitos de Segurança da Informação (Lei 13.709/2018 - LGPD, quando aplicável)."
    },
    {
      "section_id": "tr_05",
      "section_number": "5",
      "title": "Modelo de Execução do Objeto",
      "order_index": 5,
      "required": true,
      "instructions": "Detalhar as condições de execução contratual (art. 6º, XXIII, e): (5.1) Local de execução e abrangência geográfica, (5.2) Horário e regime de trabalho, (5.3) Ferramental, equipamentos e materiais de responsabilidade do contratado, (5.4) Instalações, equipamentos e infraestrutura de responsabilidade do contratante, (5.5) Cronograma de execução ou plano de trabalho, (5.6) Procedimentos para início da execução, (5.7) Gestão de subcontratações, se permitido."
    },
    {
      "section_id": "tr_06",
      "section_number": "6",
      "title": "Modelo de Gestão do Contrato",
      "order_index": 6,
      "required": true,
      "instructions": "Estabelecer o modelo completo de gestão e fiscalização contratual (art. 117, Lei 14.133/2021): (6.1) Papéis e responsabilidades (Gestor e Fiscal do Contrato), (6.2) Rotinas de fiscalização: frequência, instrumentos, registros, (6.3) Indicadores de qualidade e SLA (Acordo de Nível de Serviço), (6.4) Procedimentos para apuração de inadimplemento, (6.5) Relatórios de acompanhamento exigidos do contratado, (6.6) Reuniões periódicas de acompanhamento, (6.7) Avaliação de desempenho e CEIS/CNEP. Definir explicitamente os prazos para cada ação."
    },
    {
      "section_id": "tr_07",
      "section_number": "7",
      "title": "Critérios de Medição e Pagamento",
      "order_index": 7,
      "required": true,
      "instructions": "Estabelecer os critérios de medição de forma que não haja dúvidas sobre o que e quando se paga (art. 141, Lei 14.133/2021): (7.1) Unidade de medição por item, (7.2) Metodologia de medição e apuração, (7.3) Documentação necessária para faturamento (nota fiscal, relatório de execução aprovado), (7.4) Prazo de liquidação após ateste (máximo 30 dias), (7.5) Forma de pagamento e dados para liquidação, (7.6) Repactuação e reajuste (índice INPC ou IPCA, com cláusula específica), (7.7) Retenção de garantia de execução."
    },
    {
      "section_id": "tr_08",
      "section_number": "8",
      "title": "Forma de Seleção do Fornecedor e Critério de Julgamento",
      "order_index": 8,
      "required": true,
      "instructions": "Definir e justificar a modalidade licitatória e critério de julgamento (Decreto 11.871/2023 e art. 33, Lei 14.133/2021). Apresentar: (8.1) Modalidade licitatória proposta e justificativa (Pregão Eletrônico, Concorrência, Dispensa de Licitação), (8.2) Critério de julgamento (menor preço, melhor técnica e preço, técnica e preço) com fundamentação, (8.3) Modo de disputa (aberto, fechado, aberto-fechado), (8.4) Justificativa para SRP se couber (art. 79, Lei 14.133/2021), (8.5) Motivação para tratamento diferenciado a ME/EPP (LC 123/2006)."
    },
    {
      "section_id": "tr_09",
      "section_number": "9",
      "title": "Estimativa do Valor do Contrato",
      "order_index": 9,
      "required": true,
      "instructions": "Importar e detalhar a estimativa de valor do ETP vinculado. Incluir: (9.1) Metodologia de composição do preço de referência, (9.2) Planilha de composição de custos por item (unitário, total anual, total do contrato), (9.3) Fontes de pesquisa utilizadas com respectivas datas e links de acesso, (9.4) Valor global estimado do contrato, com valor por período se plurianual, (9.5) Declaração de conformidade com a IN SEGES 65/2021. Instrução expressa sobre sigilo do valor antes da abertura dos envelopes, se for o caso."
    },
    {
      "section_id": "tr_10",
      "section_number": "10",
      "title": "Adequação Orçamentária e Financeira",
      "order_index": 10,
      "required": true,
      "instructions": "Identificar a disponibilidade orçamentária para fazer frente às despesas: (10.1) Exercício financeiro que comportará a despesa, (10.2) Programa de Trabalho, (10.3) Natureza de Despesa e elemento de despesa, (10.4) Fonte de recursos, (10.5) Nota de empenho prévia (se necessária), (10.6) Para contratos plurianuais: declaração de disponibilidade nos exercícios futuros com arresto de dotação. Citar o art. 6º, XXIII, j, da Lei 14.133/2021."
    },
    {
      "section_id": "tr_11",
      "section_number": "11",
      "title": "Matriz de Riscos",
      "order_index": 11,
      "required": true,
      "instructions": "Apresentar tabela completa de riscos contratuais (art. 22, Lei 14.133/2021) com no mínimo 10 riscos identificados. Para cada risco: (a) Descrição do risco, (b) Causa raiz, (c) Consequência provável, (d) Probabilidade (Alta/Média/Baixa), (e) Impacto (Alto/Médio/Baixo), (f) Nível de risco (resultado da matriz), (g) Responsável pela gestão (Contratante/Contratada/Compartilhado), (h) Medidas preventivas e mitigadoras, (i) Cláusula contratual recomendada. Incluir riscos de: inadimplemento, caso fortuito/força maior, mudanças legais, falha técnica, etc."
    },
    {
      "section_id": "tr_12",
      "section_number": "12",
      "title": "Critérios de Sustentabilidade e Responsabilidade Socioambiental",
      "order_index": 12,
      "required": false,
      "instructions": "Detalhar os requisitos de sustentabilidade a serem exigidos do contratado (Decreto 7.746/2012, IN SLTI 01/2010 e normativas setoriais): (12.1) Critérios ambientais na execução do objeto, (12.2) Gestão de resíduos e destinação final ambientalmente adequada, (12.3) Uso eficiente de recursos (energia, água, materiais), (12.4) Exigências de certificação ambiental ou social (quando pertinente), (12.5) Indicadores de sustentabilidade que serão monitorados, (12.6) Penalidades específicas por descumprimento de critérios ambientais."
    },
    {
      "section_id": "tr_13",
      "section_number": "13",
      "title": "Penalidades e Sanções Administrativas",
      "order_index": 13,
      "required": true,
      "instructions": "Estabelecer o regime sancionatório completo (arts. 155-163, Lei 14.133/2021): (13.1) Tabela de infrações e sanções correspondentes com fundamentação legal, (13.2) Critérios de dosimetria das sanções, (13.3) Percentuais de multa por tipo de infração (mora, inexecução parcial, inexecução total), (13.4) Processo administrativo de apuração garantindo contraditório e ampla defesa, (13.5) Possibilidade de reabilitação, (13.6) Registros nos sistemas SICAF, CEIS e CNEP. Para contratos de serviço continuado, incluir tabela de SLA com descontos escalonados por nível de descumprimento."
    }
  ]'::jsonb,
  normative_base = '["Lei nº 14.133/2021 arts. 6º, 22, 33, 40, 117, 141, 155-163", "Decreto 11.871/2023", "IN SEGES 65/2021", "LC 123/2006", "Decreto 7.746/2012", "Lei 13.709/2018 (LGPD)"]'::jsonb,
  updated_at     = now()
WHERE doc_type = 'tr';
