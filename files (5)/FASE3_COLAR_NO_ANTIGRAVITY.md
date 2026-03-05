# PROMPT PARA O ANTIGRAVITY — MEU JURÍDICO.AI
# Fase 3 — Seed de Templates + Integração de APIs Públicas Brasileiras
> Cole este prompt no chat do Antigravity dentro da pasta do projeto MeuJurídico.

---

## CONTEXTO

Fase 1 e Fase 2 aprovadas 100%. O sistema tem wizard, editor, approval workflow e export funcionando. Agora precisa de duas entregas simultâneas:

1. **Seed dos 3 templates reais** (DFD, ETP, TR) no banco — sem isso o wizard não sabe quais seções gerar
2. **Integração com APIs públicas brasileiras** via Edge Functions — para trazer dados reais de legislação, preços e jurisprudência em tempo real durante a construção dos documentos

---

## REGRAS ABSOLUTAS (herdadas — não negociáveis)

1. RLS sagrado — todo acesso respeita `org_id`
2. `audit_logs` append-only — nunca UPDATE ou DELETE
3. LLM único — `claude-sonnet-4-20250514` via Edge Function apenas
4. Schema imutável — nenhuma tabela nova sem aprovação BX4
5. Todas as chamadas às APIs externas ocorrem em **Edge Functions**, nunca no frontend

---

## MÓDULO A — SEED DOS TEMPLATES NO BANCO

Use o agente `@database-architect` para executar este seed.

### A.1 — Template: DFD (Documento de Formalização da Demanda)

Execute este SQL no Supabase (via migration ou SQL Editor):

```sql
-- Inserir template DFD
INSERT INTO document_templates (
  id, name, doc_type, description, is_active, created_at
) VALUES (
  gen_random_uuid(),
  'Documento de Formalização da Demanda (DFD)',
  'DFD',
  'Fundamenta o plano de contratações anual. A área requisitante evidencia e detalha a necessidade de contratação conforme Lei 14.133/2021.',
  true,
  now()
) RETURNING id;
```

Após inserir o template, capture o `id` retornado e use como `template_id` nas seções abaixo:

```sql
-- Seções do DFD (inserir na ordem)
INSERT INTO document_sections (template_id, section_number, title, agent, required, section_type, tab_category, depends_on) VALUES
(:'template_id', '1', 'Informações Gerais', 'document-structure-engine', true, 'form', 'negocio', null),
(:'template_id', '2', 'Descrição Sucinta do Objeto', 'technical-expansion-engine', true, 'generated', 'negocio', '1'),
(:'template_id', '3', 'Grau de Prioridade', 'document-structure-engine', true, 'form', 'negocio', '1'),
(:'template_id', '4', 'Justificativa da Necessidade da Contratação', 'technical-expansion-engine', true, 'generated', 'juridico', '2'),
(:'template_id', '5', 'Estimativa de Quantidades e Valores', 'technical-expansion-engine', false, 'generated', 'negocio', '4'),
(:'template_id', '6', 'Identificação da Área Requisitante e Responsáveis', 'document-structure-engine', true, 'form', 'negocio', null),
(:'template_id', '7', 'Despacho', 'legal-argumentation-engine', true, 'generated', 'juridico', '4');
```

---

### A.2 — Template: ETP (Estudo Técnico Preliminar)

```sql
INSERT INTO document_templates (
  id, name, doc_type, description, is_active, created_at
) VALUES (
  gen_random_uuid(),
  'Estudo Técnico Preliminar (ETP)',
  'ETP',
  'Primeira etapa do planejamento de contratação. Caracteriza o interesse público e sua melhor solução. Base para o Termo de Referência conforme Lei 14.133/2021.',
  true,
  now()
) RETURNING id;
```

```sql
INSERT INTO document_sections (template_id, section_number, title, agent, required, section_type, tab_category, depends_on) VALUES
(:'template_id', '1',    'Introdução',                                    'document-structure-engine',       true,  'static',    'negocio',     null),
(:'template_id', '2',    'Informações Básicas',                           'document-structure-engine',       true,  'form',      'negocio',     null),
(:'template_id', '3',    'Descrição da Necessidade / Justificativa',      'technical-expansion-engine',      true,  'generated', 'negocio',     '2'),
(:'template_id', '4',    'Equipe de Planejamento',                        'document-structure-engine',       true,  'form',      'negocio',     null),
(:'template_id', '5',    'Necessidades de Negócio',                       'technical-expansion-engine',      true,  'generated', 'negocio',     '3'),
(:'template_id', '6',    'Necessidades Tecnológicas',                     'technical-expansion-engine',      false, 'generated', 'tecnologico', '5'),
(:'template_id', '7',    'Requisitos Legais',                             'normative-compliance-engine',     true,  'generated', 'legal',       '2'),
(:'template_id', '8',    'Requisitos Gerais',                             'technical-expansion-engine',      true,  'generated', 'negocio',     '5'),
(:'template_id', '9',    'Requisitos Temporais',                          'technical-expansion-engine',      true,  'generated', 'negocio',     '2'),
(:'template_id', '10',   'Requisitos de Segurança',                       'technical-expansion-engine',      true,  'generated', 'seguranca',   '2'),
(:'template_id', '11',   'Requisitos Sociais, Ambientais e Culturais',    'technical-expansion-engine',      true,  'generated', 'social',      '2'),
(:'template_id', '12',   'Requisitos de Projeto e Implementação',         'technical-expansion-engine',      false, 'generated', 'projeto',     '5'),
(:'template_id', '13',   'Requisitos de Garantia Técnica',                'technical-expansion-engine',      false, 'generated', 'garantia',    '5'),
(:'template_id', '14',   'Requisitos de Experiência',                     'technical-expansion-engine',      false, 'generated', 'experiencia', '5'),
(:'template_id', '15',   'Estimativa da Demanda — Quantidades',           'technical-expansion-engine',      true,  'generated', 'negocio',     '5'),
(:'template_id', '16',   'Levantamento de Mercado',                       'technical-expansion-engine',      true,  'generated', 'negocio',     '15'),
(:'template_id', '17',   'Análise Comparativa das Soluções',              'technical-expansion-engine',      true,  'generated', 'negocio',     '16'),
(:'template_id', '18',   'Solução Escolhida e Justificativa',             'legal-argumentation-engine',      true,  'generated', 'juridico',    '17'),
(:'template_id', '19',   'Justificativa para Adoção do SRP',              'legal-argumentation-engine',      false, 'generated', 'juridico',    '3'),
(:'template_id', '20',   'Estimativa de Custos',                          'technical-expansion-engine',      true,  'generated', 'negocio',     '15'),
(:'template_id', '21',   'Declaração de Viabilidade',                     'validation-gap-engine',           true,  'generated', 'juridico',    '20');
```

---

### A.3 — Template: TR (Termo de Referência)

```sql
INSERT INTO document_templates (
  id, name, doc_type, description, is_active, created_at
) VALUES (
  gen_random_uuid(),
  'Termo de Referência (TR)',
  'TR',
  'Define as condições para contratação de bens e serviços. Elaborado após conclusão do ETP conforme Lei 14.133/2021.',
  true,
  now()
) RETURNING id;
```

```sql
INSERT INTO document_sections (template_id, section_number, title, agent, required, section_type, tab_category, depends_on) VALUES
(:'template_id', '1',  'Condições Gerais da Contratação',                 'document-structure-engine',   true,  'generated', 'negocio',     null),
(:'template_id', '2',  'Quadro de Itens',                                 'document-structure-engine',   true,  'form',      'negocio',     '1'),
(:'template_id', '3',  'Alinhamento com PCA e PNCP',                      'normative-compliance-engine', true,  'generated', 'legal',       '1'),
(:'template_id', '4',  'Da Participação em Consórcio',                    'legal-argumentation-engine',  true,  'generated', 'juridico',    '1'),
(:'template_id', '5',  'Da Subcontratação',                               'legal-argumentation-engine',  true,  'generated', 'juridico',    '1'),
(:'template_id', '6',  'Justificativa para Não Parcelamento',             'legal-argumentation-engine',  true,  'generated', 'juridico',    '1'),
(:'template_id', '7',  'Fundamentação e Descrição da Necessidade',        'technical-expansion-engine',  true,  'generated', 'negocio',     '1'),
(:'template_id', '8',  'Dos Benefícios a Serem Alcançados',               'technical-expansion-engine',  true,  'generated', 'negocio',     '7'),
(:'template_id', '9',  'Justificativa para Adoção do SRP',                'legal-argumentation-engine',  false, 'generated', 'juridico',    '1'),
(:'template_id', '10', 'Descrição da Solução — Ciclo de Vida',            'technical-expansion-engine',  true,  'generated', 'negocio',     '7'),
(:'template_id', '11', 'Requisitos Gerais',                               'technical-expansion-engine',  true,  'generated', 'negocio',     '1'),
(:'template_id', '12', 'Requisitos Legais',                               'normative-compliance-engine', true,  'generated', 'legal',       '1'),
(:'template_id', '13', 'Requisitos Temporais',                            'technical-expansion-engine',  true,  'generated', 'negocio',     '1'),
(:'template_id', '14', 'Requisitos de Segurança e Privacidade',           'technical-expansion-engine',  true,  'generated', 'seguranca',   '1'),
(:'template_id', '15', 'Requisitos Sociais, Ambientais e Culturais',      'technical-expansion-engine',  true,  'generated', 'social',      '1'),
(:'template_id', '16', 'Requisitos de Garantia Técnica',                  'technical-expansion-engine',  false, 'generated', 'garantia',    '1'),
(:'template_id', '17', 'Modelo de Execução do Objeto',                    'technical-expansion-engine',  true,  'generated', 'negocio',     '10'),
(:'template_id', '18', 'Modelo de Gestão do Contrato',                    'technical-expansion-engine',  true,  'generated', 'negocio',     '17'),
(:'template_id', '19', 'Critérios de Medição e Pagamento',                'technical-expansion-engine',  true,  'generated', 'negocio',     '18'),
(:'template_id', '20', 'Sanções Administrativas',                         'legal-argumentation-engine',  true,  'generated', 'juridico',    '1'),
(:'template_id', '21', 'Estimativa de Preços e Pesquisa de Mercado',      'technical-expansion-engine',  true,  'generated', 'negocio',     '2'),
(:'template_id', '22', 'Adequação Orçamentária',                          'document-structure-engine',   true,  'form',      'negocio',     '21');
```

### Critério de aceite do Módulo A
```
[ ] 3 templates inseridos em document_templates (DFD, ETP, TR)
[ ] Seções do DFD: 7 seções na ordem correta
[ ] Seções do ETP: 21 seções na ordem correta
[ ] Seções do TR: 22 seções na ordem correta
[ ] ModelsPage exibe os 3 templates reais (não hardcoded)
[ ] Step 4 do Wizard exibe os 3 templates como cards selecionáveis
[ ] Nenhum template sem seções vinculadas
```

---

## MÓDULO B — INTEGRAÇÃO DE APIs PÚBLICAS BRASILEIRAS

Use o agente `@backend-specialist` para criar as Edge Functions de integração.

### B.1 — MAPA DE APIs DISPONÍVEIS E GRATUITAS

Todas as APIs abaixo são **públicas, gratuitas e sem autenticação** (exceto onde indicado):

---

#### API 1 — PNCP (Portal Nacional de Contratações Públicas)
**O que fornece:** Contratos, atas de registro de preços, planos de contratação anual (PCA), editais publicados por todos os órgãos públicos do Brasil.

**Uso no MeuJurídico:** Pesquisa de contratos similares para embasar ETP (Levantamento de Mercado), busca de preços praticados, validação de modalidade de contratação.

```
Base URL:    https://pncp.gov.br/api/consulta/v1
Auth:        Não requerida (leitura pública)
Formato:     JSON

Endpoints úteis:
  Contratos por data:
  GET /contratos?dataInicial={YYYYMMDD}&dataFinal={YYYYMMDD}&pagina=1

  Contratações publicadas:
  GET /contratacoes/publicacao?dataInicial={YYYYMMDD}&dataFinal={YYYYMMDD}&codigoModalidadeContratacao={cod}&pagina=1

  Plano de Contratações Anual:
  GET /pca/?anoPca={ano}&pagina=1

  Atas de Registro de Preços:
  GET /atas?dataInicial={YYYYMMDD}&dataFinal={YYYYMMDD}&pagina=1
```

---

#### API 2 — ComprasGov / SIASG (Dados Abertos de Compras)
**O que fornece:** Preços praticados na compra de materiais e serviços pelo governo federal. Catálogo CATMAT/CATSER. Dados de fornecedores e licitações.

**Uso no MeuJurídico:** Pesquisa de preços para estimativa de valor no ETP e TR (seção Estimativa de Custos e Pesquisa de Mercado).

```
Base URL:    https://dadosabertos.compras.gov.br
Auth:        Não requerida
Formato:     JSON

Endpoints úteis:
  Pesquisa preço de material:
  GET /modulo-pesquisa-preco/1_consultarMaterial?pagina=1

  Pesquisa preço de serviço:
  GET /modulo-pesquisa-preco/2_consultarServico?pagina=1

  Catálogo de materiais (CATMAT):
  GET /modulo-material/1_consultarMaterial?pagina=1

  Catálogo de serviços (CATSER):
  GET /modulo-servico/1_consultarServico?pagina=1

  Contratos (módulo 7):
  GET /modulo-contrato/1_consultarContrato?pagina=1
```

---

#### API 3 — TCU Webservices (Tribunal de Contas da União)
**O que fornece:** Acórdãos do TCU com sumário, relator, data e URL do documento completo. Inabilitados para cargo público. Certidões de pessoas jurídicas.

**Uso no MeuJurídico:** Citação de jurisprudência TCU nas seções jurídicas do ETP e TR (agente Legal Argumentation Engine). Validação de fornecedores.

```
Base URL:    https://dados-abertos.apps.tcu.gov.br
Auth:        Não requerida
Formato:     JSON

Endpoints úteis:
  Acórdãos (paginado):
  GET /api/acordao/recupera-acordaos?inicio={n}&quantidade={n}

  Inabilitados:
  GET https://contas.tcu.gov.br/ords/condenacao/consulta/inabilitados

  Certidão por CNPJ:
  GET https://certidoes-apf.apps.tcu.gov.br/api/rest/publico/certidoes/{cnpj}
```

---

#### API 4 — LexML (Rede de Informação Legislativa e Jurídica)
**O que fornece:** Acervo completo de normas jurídicas federais e estaduais — leis, decretos, portarias, instruções normativas — desde 1808. Busca por palavra-chave, tipo, número, ano.

**Uso no MeuJurídico:** Busca em tempo real de artigos e dispositivos da Lei 14.133/2021, IN SEGES 65/2021 e demais normas referenciadas nas seções do documento (agente Normative Compliance Engine).

```
Base URL:    https://www.lexml.gov.br/busca/SRU
Auth:        Não requerida
Formato:     XML (parsear para JSON na Edge Function)
Padrão:      SRU (Search/Retrieval via URL)

Exemplo de busca:
  GET https://www.lexml.gov.br/busca/SRU?operation=searchRetrieve
    &version=1.1
    &query=urn+any+14133+and+date+any+2021
    &maximumRecords=10
    &startRecord=1

  Campos retornados: tipoDocumento, dc:title, dc:date, urn, dc:description
```

---

#### API 5 — Planalto (Portal da Legislação Federal)
**O que fornece:** Texto completo das leis federais diretamente do portal oficial da Presidência da República.

**Uso no MeuJurídico:** Busca e exibição do texto íntegro de artigos específicos citados nos documentos. RAG para a base normativa (pgvector).

```
Base URL:    https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/
Auth:        Não requerida
Formato:     HTML (parsear na Edge Function)

Leis críticas para o MeuJurídico:
  Lei 14.133/2021:  /l14133.htm
  Lei 8.666/1993:   https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm
  LC 123/2006:      https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm
```

---

### B.2 — EDGE FUNCTIONS A CRIAR

Crie as seguintes Edge Functions em `supabase/functions/`:

---

#### `search_pncp`
**Responsabilidade:** Buscar contratos e contratações similares no PNCP para embasar o Levantamento de Mercado do ETP.

```typescript
// supabase/functions/search_pncp/index.ts
// Input: { query: string, modalidade?: string, dataInicial?: string, dataFinal?: string }
// Output: { contratos: [], contratacoes: [], total: number }

// Lógica:
// 1. Chamar GET /contratos com filtros de data (últimos 12 meses por default)
// 2. Chamar GET /contratacoes/publicacao com filtros
// 3. Filtrar por palavras-chave do query nos campos de descrição
// 4. Retornar array formatado com: numero, objeto, valor, modalidade, orgao, data, url
// 5. Registrar chamada em audit_logs: action 'api.pncp.searched'
```

---

#### `search_prices`
**Responsabilidade:** Buscar preços praticados no ComprasGov para estimativa de valor.

```typescript
// supabase/functions/search_prices/index.ts
// Input: { descricao: string, tipo: 'material' | 'servico', quantidade?: number }
// Output: { itens: [], media: number, mediana: number, menor: number, maior: number }

// Lógica:
// 1. Chamar API ComprasGov /modulo-pesquisa-preco/1_consultarMaterial ou 2_consultarServico
// 2. Filtrar resultados por descrição
// 3. Calcular média, mediana, menor e maior preço (excluir outliers > 2x desvio padrão)
// 4. Retornar array de price_researches formatado para inserção na tabela price_researches
// 5. Registrar em audit_logs: action 'api.compras.prices_searched'
```

---

#### `search_legislation`
**Responsabilidade:** Buscar artigos e dispositivos legais no LexML para o Normative Compliance Engine.

```typescript
// supabase/functions/search_legislation/index.ts
// Input: { query: string, tipo?: 'Lei' | 'Decreto' | 'InstrucaoNormativa', numero?: string, ano?: number }
// Output: { normas: [{ titulo, tipo, numero, ano, urn, descricao, url }] }

// Lógica:
// 1. Montar query SRU com os parâmetros recebidos
// 2. Chamar LexML SRU API
// 3. Parsear XML de resposta → JSON
// 4. Retornar array de normas com campos: titulo, tipo, data, urn, descricao
// 5. Priorizar na resposta: Lei 14.133/2021, IN SEGES 65/2021, IN 58/2022
// 6. Não registrar em audit_logs (leitura pública, sem custo de rastreamento)
```

---

#### `search_tcu_jurisprudence`
**Responsabilidade:** Buscar acórdãos do TCU relevantes para fundamentação jurídica.

```typescript
// supabase/functions/search_tcu_jurisprudence/index.ts
// Input: { query: string, quantidade?: number }
// Output: { acordaos: [{ numero, ano, titulo, sumario, relator, data, urlPDF }] }

// Lógica:
// 1. Chamar GET /api/acordao/recupera-acordaos com paginação
// 2. Filtrar acórdãos que contenham palavras do query no título ou sumário
// 3. Retornar os N mais relevantes (default: 5)
// 4. Incluir urlArquivoPDF para o agente Legal Argumentation Engine citar a fonte
// 5. Não registrar em audit_logs (leitura pública)
```

---

### B.3 — INTEGRAÇÃO NO EDITOR (FRONTEND)

Adicione um painel lateral "Fontes em Tempo Real" no `SectionEditor.tsx`:

```
┌─────────────────────────────────┐
│ 🔍 Fontes em Tempo Real         │
├─────────────────────────────────┤
│ [Buscar no PNCP]                │  → chama search_pncp
│ [Pesquisar Preços]              │  → chama search_prices
│ [Buscar Legislação]             │  → chama search_legislation
│ [Jurisprudência TCU]            │  → chama search_tcu_jurisprudence
└─────────────────────────────────┘
```

**Comportamento:**
- Cada botão abre um painel de busca inline (sem modal separado)
- Resultados aparecem em cards abaixo do campo de busca
- Card tem botão **"Inserir referência"** que appenda o texto formatado na seção ativa
- Formato ao inserir: `"Conforme [Lei/Acórdão/Contrato], [resumo do conteúdo relevante]."`
- A inserção atualiza `document_sections.normative_refs` para normas e jurisprudência

---

### B.4 — INTEGRAÇÃO NO AGENTE NORMATIVE COMPLIANCE (AUTOMÁTICA)

Quando o agente `normative-compliance-engine` gerar a seção, ele deve automaticamente:

1. Chamar `search_legislation` com os termos do objeto da contratação
2. Inserir as normas encontradas em `document_sections.normative_refs`
3. Citar artigos específicos da Lei 14.133/2021 relevantes ao tipo de objeto
4. Se houver acórdãos TCU pertinentes via `search_tcu_jurisprudence`, incluir como nota de rodapé

---

### Critério de aceite do Módulo B

```
[ ] Edge Function search_pncp: retorna contratos reais do PNCP em JSON
[ ] Edge Function search_prices: retorna preços com média/mediana calculados
[ ] Edge Function search_legislation: retorna normas do LexML parseadas de XML para JSON
[ ] Edge Function search_tcu_jurisprudence: retorna acórdãos com urlPDF
[ ] Frontend: painel "Fontes em Tempo Real" visível no SectionEditor
[ ] Botão "Inserir referência" appenda texto formatado na seção ativa
[ ] document_sections.normative_refs atualizado após inserção
[ ] Nenhuma chamada de API externa ocorre no frontend (todas via Edge Function)
[ ] Nenhuma chave de API é exposta no frontend (não há chaves — todas são públicas)
```

---

## ORDEM DE ENTREGA

```
Módulo A (Seed de Templates) → confirmar aceite → Módulo B (APIs) → confirmar aceite
```

Entregue relatório de cada módulo antes de avançar.

---

## RELATÓRIO POR MÓDULO

```
MÓDULO [A/B] — [NOME]
======================
ARQUIVOS CRIADOS: [lista]
ARQUIVOS ALTERADOS: [lista]
CRITÉRIOS DE ACEITE:
  [ PASSOU / FALHOU ] — Critério
RESULTADO: [ APROVADO / REPROVADO ]
PRÓXIMO: Aguardando autorização
```

---

## RESTRIÇÕES DESTA FASE

- ❌ Não criar tabelas novas sem aprovação BX4
- ❌ Não chamar APIs externas do frontend — somente via Edge Function
- ❌ Não expor tokens ou credenciais (as APIs desta fase são todas públicas)
- ❌ Não invocar Claude API nas Edge Functions desta fase — são apenas integrações de dados
- ✅ LexML retorna XML — parsear para JSON antes de retornar ao frontend
- ✅ PNCP pode ter instabilidade ocasional — implementar try/catch com mensagem amigável de fallback
