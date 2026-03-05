# PROMPT PARA O ANTIGRAVITY — MEU JURÍDICO.AI
# Fase 4 — Módulo D: Acervo Curado de Elite (Few-Shot de Documentos Reais)
> Cole este prompt no chat do Antigravity dentro da pasta do projeto MeuJurídico.
> Pré-requisito: Módulos A, B e C da Fase 4 aprovados.

---

## CONTEXTO E ESTRATÉGIA

Este módulo implementa o maior diferencial competitivo do MeuJurídico sobre qualquer concorrente: um **acervo curado de documentos reais homologados** (ETP, DFD, TR, Editais, Contratos) coletados do PNCP, vetorizados e usados como referência de elite durante a geração de novos documentos.

**Custo operacional calculado:**
- Indexação inicial (~340 documentos): ~$1,50
- Renovação trimestral (~68 documentos): ~$0,30
- **Custo anual total: ~$2,70** (menos de R$ 15,00/ano)

**Fundamento legal:** Art. 9º, inciso III da IN 58/2022 — contratações similares de outros órgãos devem ser consideradas no levantamento de mercado. O sistema cumpre exigência legal ao usar documentos reais como referência.

---

## REGRAS ABSOLUTAS (herdadas)

1. Todas as chamadas de API ocorrem em Edge Functions — nunca no frontend
2. Chaves armazenadas como Supabase Secrets
3. Documentos do PNCP são públicos — sem credenciais necessárias para leitura
4. Conteúdo dos documentos é usado apenas como referência de calibração — nunca copiado verbatim
5. audit_logs registra toda atividade do pipeline de curadoria

---

## MISSÃO

Use `@backend-specialist` + `@database-architect` para implementar os 3 sub-módulos abaixo na ordem definida.

---

## SUB-MÓDULO D.1 — ESTRUTURA DO ACERVO NO BANCO

### Migration: tabela elite_documents

```sql
CREATE TABLE elite_documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação no PNCP
  pncp_cnpj         VARCHAR NOT NULL,
  pncp_ano          INTEGER NOT NULL,
  pncp_sequencial   INTEGER NOT NULL,
  pncp_doc_seq      INTEGER,              -- sequencial do arquivo no edital

  -- Classificação
  doc_type          VARCHAR NOT NULL,     -- 'ETP' | 'DFD' | 'TR' | 'EDITAL' | 'CONTRATO' | 'MAPA_RISCOS'
  objeto_categoria  VARCHAR,             -- 'TI' | 'Servico' | 'Bem' | 'Obra' | 'MaoDeObra'
  objeto_descricao  TEXT,

  -- Metadados de qualidade
  orgao_nome        VARCHAR NOT NULL,
  orgao_esfera      VARCHAR DEFAULT 'federal', -- 'federal' | 'estadual' | 'municipal'
  valor_estimado    NUMERIC,
  valor_contratado  NUMERIC,
  contrato_assinado BOOLEAN DEFAULT false,
  sem_impugnacao    BOOLEAN DEFAULT true,
  sem_achado_tcu    BOOLEAN DEFAULT true,
  qualidade_score   INTEGER DEFAULT 0,    -- 0-100, calculado pelos critérios abaixo

  -- Conteúdo
  full_text         TEXT,                -- texto extraído do PDF
  total_chunks      INTEGER DEFAULT 0,

  -- Controle
  coletado_em       TIMESTAMPTZ DEFAULT now(),
  indexado_em       TIMESTAMPTZ,
  ciclo_curadoria   VARCHAR,             -- ex: '2025-Q1', '2025-Q2'
  ativo             BOOLEAN DEFAULT true,

  UNIQUE(pncp_cnpj, pncp_ano, pncp_sequencial, doc_type)
);

-- Índices
CREATE INDEX ON elite_documents (doc_type, ativo, qualidade_score DESC);
CREATE INDEX ON elite_documents (objeto_categoria, doc_type, ativo);
CREATE INDEX ON elite_documents (ciclo_curadoria);

-- RLS: somente leitura para usuários autenticados
ALTER TABLE elite_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "elite_docs_read" ON elite_documents
  FOR SELECT TO authenticated USING (ativo = true);
CREATE POLICY "elite_docs_write" ON elite_documents
  FOR ALL TO service_role USING (true);

-- Adicionar tag na tabela norm_embeddings para identificar documentos do acervo elite
ALTER TABLE norm_embeddings
  ADD COLUMN IF NOT EXISTS elite_doc_id UUID REFERENCES elite_documents(id),
  ADD COLUMN IF NOT EXISTS is_elite     BOOLEAN DEFAULT false;
```

### Critérios de qualidade (qualidade_score 0-100)

```
+30 pts → contrato_assinado = true (processo concluído com sucesso)
+20 pts → valor_contratado > R$ 500.000 (processos relevantes têm mais rigor técnico)
+20 pts → sem_impugnacao = true (edital não foi contestado)
+20 pts → sem_achado_tcu = true (sem achados de auditoria vinculados)
+10 pts → orgao_esfera = 'federal' (padrão técnico mais elevado)

Acervo ativo: somente documentos com qualidade_score >= 60
```

---

## SUB-MÓDULO D.2 — PIPELINE DE CURADORIA

### Edge Function: `curate_elite_documents`

Responsabilidade: Coletar, avaliar, extrair e indexar documentos de elite do PNCP.

```typescript
// supabase/functions/curate_elite_documents/index.ts
// Chamada: POST /functions/v1/curate_elite_documents
// Body: { doc_type: 'ETP'|'DFD'|'TR'|'EDITAL', ciclo: '2025-Q1', limite?: number }
// Auth: service_role apenas
// Custo estimado por execução: ~$0.08 para 20 documentos

// ═══════════════════════════════════════════
// PASSO 1: BUSCAR CONTRATAÇÕES CONCLUÍDAS NO PNCP
// ═══════════════════════════════════════════

const ORGAOS_PRIORITARIOS = [
  // Órgãos federais com alto volume e padrão técnico elevado
  '00394460000141', // Ministério da Fazenda / Receita Federal
  '00517058000108', // Ministério da Saúde
  '29979036000140', // INSS
  '00360305000104', // Banco Central
  '05526783000159', // AGU
  '00489828000108', // Ministério da Educação
  '00531701000197', // Ministério da Defesa
  '04196645000100', // ANATEL
  '02030481000197', // ANAC
  '03986982000181', // ANEEL
  // Adicionar mais conforme descoberta
];

// Endpoint PNCP para buscar contratações por órgão:
// GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras
//   ?dataInicial=YYYYMMDD&dataFinal=YYYYMMDD&pagina=1

// Filtros de qualidade na busca:
// - dataInicial: 12 meses atrás
// - Apenas contratações com situacao = 'Contrato Assinado'
// - Modalidades: Pregão Eletrônico, Concorrência, Dispensa

// ═══════════════════════════════════════════
// PASSO 2: BUSCAR ARQUIVOS DA CONTRATAÇÃO
// ═══════════════════════════════════════════

// Para cada contratação elegível, buscar seus arquivos:
// GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos

// Identificar o arquivo correto pelo nome/tipo:
const DOC_TYPE_KEYWORDS = {
  'ETP':     ['etp', 'estudo tecnico', 'estudo_tecnico', 'preliminar'],
  'DFD':     ['dfd', 'formalizacao', 'formalização', 'demanda'],
  'TR':      ['tr', 'termo de referencia', 'termo_referencia'],
  'EDITAL':  ['edital', 'instrumento convocatorio'],
  'CONTRATO':['contrato', 'instrumento contratual'],
};

// ═══════════════════════════════════════════
// PASSO 3: DOWNLOAD E EXTRAÇÃO DO PDF
// ═══════════════════════════════════════════

// GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos/{seq}
// Retorna: PDF binário

// Extração de texto via Gemini Flash (visão de PDF):
// - Enviar PDF como base64 para Gemini Flash
// - Prompt: "Extraia todo o texto deste documento público preservando a estrutura de seções.
//            Identifique e rotule cada seção com seu número e título.
//            Retorne apenas o texto extraído, sem comentários."
// - Custo: ~$0.075 por 1M tokens de input (PDF conta como tokens de imagem)
// - Estimativa: ~$0.004 por documento de 40 páginas

// ═══════════════════════════════════════════
// PASSO 4: CALCULAR QUALIDADE_SCORE
// ═══════════════════════════════════════════

function calcularScore(doc: any): number {
  let score = 0;
  if (doc.contrato_assinado)        score += 30;
  if (doc.valor_contratado > 500000) score += 20;
  if (doc.sem_impugnacao)           score += 20;
  if (doc.sem_achado_tcu)           score += 20;
  if (doc.orgao_esfera === 'federal') score += 10;
  return score;
}

// Apenas documentos com score >= 60 são indexados

// ═══════════════════════════════════════════
// PASSO 5: CHUNKING E VETORIZAÇÃO
// ═══════════════════════════════════════════

// Chunking inteligente por seção (não por tamanho fixo):
// - Identificar marcadores de seção no texto extraído ("1.", "2.", "Art.", etc.)
// - Cada seção = 1 chunk (se < 500 tokens) ou dividida com 50 tokens de overlap
// - Prefixar cada chunk com metadados:
//   "[ETP | Receita Federal | 2024 | Seção 5 - Levantamento de Mercado]\n{conteúdo}"

// Vetorização: gemini-embedding-001
// Inserir em norm_embeddings com:
//   is_elite = true
//   elite_doc_id = id do registro em elite_documents
//   source = 'pncp_elite'
//   doc_type = tipo do documento

// ═══════════════════════════════════════════
// PASSO 6: REGISTRO E AUDITORIA
// ═══════════════════════════════════════════

// Atualizar elite_documents: indexado_em, total_chunks, ciclo_curadoria
// Registrar em audit_logs:
//   action: 'elite_acervo.ciclo_concluido'
//   metadata: { ciclo, doc_type, total_coletados, total_indexados, total_rejeitados, custo_estimado_usd }
```

### Edge Function: `schedule_curadoria` (Cron Job)

```typescript
// supabase/functions/schedule_curadoria/index.ts
// Configurar como cron job no Supabase: 0 2 1 */3 * (1º dia de cada trimestre às 2h)

// Executa em sequência para cada tipo de documento:
const tipos = ['ETP', 'DFD', 'TR', 'EDITAL'];
const ciclo = getCicloAtual(); // ex: '2026-Q1'

for (const tipo of tipos) {
  await invoke('curate_elite_documents', {
    doc_type: tipo,
    ciclo,
    limite: 20 // 20 novos documentos por tipo por ciclo = 80 total/trimestre
  });
}

// Após coleta: desativar documentos com mais de 4 ciclos (1 ano)
// para manter o acervo atual e enxuto
await supabase
  .from('elite_documents')
  .update({ ativo: false })
  .lt('ciclo_curadoria', getCiclo4AtrasAdo());
```

---

## SUB-MÓDULO D.3 — INTEGRAÇÃO NO RAG (INJEÇÃO DURANTE GERAÇÃO)

### Atualizar Edge Function `search_rag`

Adicionar filtro para priorizar documentos do acervo elite nas buscas:

```typescript
// Busca híbrida: normas legais + exemplos elite
async function search_rag_enhanced(query: string, doc_type: string, top_k = 8) {

  // Busca 1: normas legais (fonte primária — sempre incluída)
  const legal_chunks = await searchVector(query, {
    filter: { source: ['lexml', 'planalto', 'tcu'] },
    top_k: 4
  });

  // Busca 2: exemplos elite do mesmo tipo de documento
  const elite_chunks = await searchVector(query, {
    filter: { is_elite: true, doc_type: doc_type },
    top_k: 4
  });

  // Formatar para injeção no prompt do agente
  return {
    legal_context: formatLegalChunks(legal_chunks),
    elite_examples: formatEliteChunks(elite_chunks)
  };
}

function formatEliteChunks(chunks: any[]): string {
  if (!chunks.length) return '';
  return `
EXEMPLOS DE REFERÊNCIA (documentos reais homologados no PNCP):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${chunks.map((c, i) => `
[${i+1}] ${c.metadata.orgao} — ${c.metadata.ano} — ${c.metadata.secao}
Valor contratado: R$ ${c.metadata.valor_formatado}
Trecho de referência: "${c.content.substring(0, 300)}..."
`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use estes exemplos como calibração de nível e estrutura.
NÃO copie o conteúdo — produza texto original baseado na realidade do órgão contratante.
`;
}
```

### Atualizar prompt dos agentes para usar exemplos elite

No `orchestrate_document`, injetar no prompt do agente:

```typescript
const { legal_context, elite_examples } = await search_rag_enhanced(
  `${section.title} ${process.dados_base.tipo_objeto}`,
  document.template.doc_type
);

const prompt = `
${AGENT_SYSTEM_PROMPT[agent]}

CONTEXTO NORMATIVO (base legal obrigatória):
${legal_context}

${elite_examples}

DADOS DO PROCESSO:
${JSON.stringify(section.structured_data)}

SEÇÃO A GERAR: ${section.title}
Produza o texto completo desta seção com linguagem formal, impessoal e em conformidade
com a Lei 14.133/2021. Use os exemplos acima como referência de qualidade e estrutura,
mas produza conteúdo original adequado à realidade deste órgão e objeto.
`;
```

### Painel de exemplos no frontend (SectionEditor)

Adicionar ao painel "Fontes em Tempo Real" uma seção **"Exemplos do Acervo"**:

```
┌─────────────────────────────────────────────────────┐
│ 📚 Exemplos do Acervo de Elite                      │
├─────────────────────────────────────────────────────┤
│ Seção atual: Levantamento de Mercado                │
│                                                     │
│ [ETP] Receita Federal 2024 — TI Infrastructure      │
│ Valor: R$ 4,2M | Score: 90/100 | Ver trecho ›       │
│                                                     │
│ [ETP] INSS 2023 — Serviços de Cloud                 │
│ Valor: R$ 890K | Score: 80/100 | Ver trecho ›       │
│                                                     │
│ [ETP] ANATEL 2024 — Segurança da Informação         │
│ Valor: R$ 2,1M | Score: 70/100 | Ver trecho ›       │
│                                                     │
│ 💡 Esses exemplos já foram injetados no prompt       │
│    do agente que gerou esta seção.                  │
└─────────────────────────────────────────────────────┘
```

**Arquivos a criar/alterar:**
- `supabase/functions/curate_elite_documents/index.ts` — pipeline de curadoria
- `supabase/functions/schedule_curadoria/index.ts` — cron job trimestral
- `supabase/functions/search_rag/index.ts` — busca híbrida (atualizar)
- `supabase/functions/orchestrate_document/index.ts` — injetar elite_examples (atualizar)
- `frontend/src/components/documents/EliteExamplesPanel.tsx` — painel visual
- `frontend/src/components/documents/SectionEditor.tsx` — integrar painel (atualizar)
- `frontend/src/hooks/useEliteExamples.ts` — query em elite_documents + norm_embeddings

---

## CRITÉRIOS DE ACEITE DO MÓDULO D

```
[ ] Migration: tabela elite_documents criada com índices e RLS
[ ] curate_elite_documents: coleta pelo menos 5 documentos reais do PNCP sem erro
[ ] PDFs extraídos via Gemini Flash com texto legível e seções identificadas
[ ] qualidade_score calculado corretamente (apenas docs >= 60 indexados)
[ ] norm_embeddings: chunks elite têm is_elite=true e elite_doc_id preenchido
[ ] search_rag: retorna chunks legais + chunks elite na mesma resposta
[ ] orchestrate_document: prompt inclui seção "EXEMPLOS DE REFERÊNCIA" para agentes jurídicos
[ ] EliteExamplesPanel: exibe documentos reais com orgão, ano, valor e score
[ ] schedule_curadoria: cron configurado para execução trimestral
[ ] audit_logs: registra 'elite_acervo.ciclo_concluido' com custo estimado
[ ] Documentos com score < 60 NÃO aparecem no acervo ativo
[ ] Após 4 ciclos (1 ano), documentos são desativados automaticamente
[ ] Conteúdo dos exemplos NUNCA é copiado verbatim — apenas usado como referência
```

---

## RELATÓRIO FINAL

```
MÓDULO D — ACERVO CURADO DE ELITE
===================================
ARQUIVOS CRIADOS: [lista]
ARQUIVOS ALTERADOS: [lista]
DOCUMENTOS COLETADOS NO CICLO INICIAL:
  ETP: [N] documentos | score médio: [N]
  DFD: [N] documentos | score médio: [N]
  TR:  [N] documentos | score médio: [N]
CUSTO REAL DA INDEXAÇÃO: $[valor]
CRITÉRIOS DE ACEITE: [lista com PASSOU/FALHOU]
RESULTADO: [ APROVADO / REPROVADO ]
```

---

## RESTRIÇÕES

- ❌ Nunca copiar verbatim conteúdo de documentos do PNCP na geração
- ❌ Nunca indexar documentos com qualidade_score < 60
- ❌ Nunca desativar documentos manualmente — apenas pelo ciclo de curadoria automático
- ✅ Documentos do PNCP são públicos — sem autenticação necessária para download
- ✅ Custo trimestral esperado: ~$0,30 (menos de R$ 2,00 por ciclo)
- ✅ Acervo alvo: 80 documentos ativos por tipo, renovados 25% a cada trimestre
