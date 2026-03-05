# PROMPT PARA O ANTIGRAVITY — MEU JURÍDICO.AI
# Fase 4 — RAG + Motor de IA com Múltiplos LLMs e Normas em Tempo Real
> Cole este prompt no chat do Antigravity dentro da pasta do projeto MeuJurídico.

---

## CONTEXTO

Fases 1, 2 e 3 aprovadas. O Aditivo Técnico v1.0 (MeuJuridico_Aditivo_MultiLLM_v1.docx) foi assinado pelo BX4 e autoriza formalmente o uso de múltiplos provedores LLM com as salvaguardas definidas.

Esta é a Fase 4 — o motor de IA passa a operar com:
1. **RAG real** — base normativa vetorizada com pgvector alimentada pelas APIs públicas
2. **Multi-LLM roteado** — Claude, Gemini e GPT com responsabilidades distintas por agente
3. **Normas e jurisprudência em tempo real** — durante a geração de cada seção

---

## REGRAS ABSOLUTAS (aditivo + briefing original)

1. RLS sagrado — todo acesso respeita `org_id`
2. `audit_logs` append-only — nunca UPDATE ou DELETE
3. **Todas as chamadas LLM ocorrem em Edge Functions — nunca no frontend**
4. **Chaves de API armazenadas como Supabase Secrets — nunca em código ou .env commitado**
5. Dados RESTRITOS (CPF, matrícula, processos internos) — apenas Claude. Nunca Gemini ou GPT
6. Dados SIGILOSOS — proibido enviar a qualquer LLM
7. Sanitização obrigatória antes de qualquer chamada a Gemini ou GPT
8. Cada chamada LLM registrada em `ai_jobs` com `llm_provider`, `llm_model`, `data_classification`, `sanitized`

---

## MISSÃO

Use `@backend-specialist` + `@database-architect` + `@security-auditor` para implementar os 3 módulos abaixo na ordem definida. Não avance sem confirmar os critérios de aceite do módulo anterior.

---

## MÓDULO A — RAG: BASE NORMATIVA VETORIZADA

### A.1 — Migration: tabela norm_embeddings

```sql
-- Habilitar pgvector (já deve estar ativo no Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de embeddings da base normativa
CREATE TABLE norm_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        VARCHAR NOT NULL,       -- 'lexml' | 'planalto' | 'tcu' | 'pncp'
  doc_type      VARCHAR NOT NULL,       -- 'lei' | 'decreto' | 'in' | 'acordao' | 'contrato'
  title         TEXT NOT NULL,
  urn           TEXT,                   -- URN LexML quando disponível
  article       TEXT,                  -- Artigo específico (ex: "Art. 18")
  content       TEXT NOT NULL,         -- Texto do trecho indexado
  embedding     vector(768),           -- Embedding Google text-embedding-004
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Índice vetorial para busca por similaridade
CREATE INDEX ON norm_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RLS: base normativa é pública — qualquer usuário autenticado pode ler
ALTER TABLE norm_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "norm_embeddings_read" ON norm_embeddings
  FOR SELECT TO authenticated USING (true);

-- Somente service_role pode inserir/atualizar (pipeline de indexação)
CREATE POLICY "norm_embeddings_write" ON norm_embeddings
  FOR ALL TO service_role USING (true);
```

### A.2 — Edge Function: `index_norms`

Responsabilidade: Indexar as normas críticas do MeuJurídico na base vetorial.

```typescript
// supabase/functions/index_norms/index.ts
// Chamada: POST /functions/v1/index_norms
// Body: { source: 'lexml' | 'planalto' | 'tcu', force_reindex?: boolean }
// Auth: service_role apenas

// NORMAS PRIORITÁRIAS A INDEXAR (em ordem):

const NORMAS_CRITICAS = [
  // Lei 14.133/2021 — Nova Lei de Licitações (OBRIGATÓRIO)
  { url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm', tipo: 'lei', numero: '14133', ano: 2021 },

  // IN SEGES 65/2021 — Pesquisa de Preços (OBRIGATÓRIO)
  { urn: 'urn:lex:br:federal:instrucao.normativa:2021-07-07;65', tipo: 'in' },

  // IN SEGES 58/2022 — ETP Digital (OBRIGATÓRIO)
  { urn: 'urn:lex:br:federal:instrucao.normativa:2022-08-08;58', tipo: 'in' },

  // Lei 8.666/1993 — Lei anterior de licitações (referência)
  { url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', tipo: 'lei', numero: '8666', ano: 1993 },

  // LC 123/2006 — Simples Nacional / ME e EPP
  { url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm', tipo: 'lc', numero: '123', ano: 2006 },

  // Decreto 10.024/2019 — Pregão Eletrônico
  { urn: 'urn:lex:br:federal:decreto:2019-09-20;10024', tipo: 'decreto' },
];

// Lógica por source:
// 'planalto': fetch HTML → parsear artigos por <p id="Art..."> → chunking por artigo → embedding
// 'lexml': SRU API → parsear XML → chunking por dispositivo → embedding
// 'tcu': recupera-acordaos API → chunking por acórdão → embedding

// Embedding: usar Google text-embedding-004 via Gemini API
// Chunk size: máximo 500 tokens por chunk
// Overlap: 50 tokens entre chunks para preservar contexto

// Após indexar: registrar em audit_logs action: 'rag.index_completed'
// com metadata: { source, total_chunks, total_tokens_estimated }
```

### A.3 — Edge Function: `search_rag`

Responsabilidade: Busca semântica na base normativa para alimentar os agentes durante geração.

```typescript
// supabase/functions/search_rag/index.ts
// Input: { query: string, doc_type?: string[], top_k?: number, section_context?: string }
// Output: { chunks: [{ content, source, title, article, urn, similarity }] }

// Lógica:
// 1. Gerar embedding da query via Google text-embedding-004
// 2. Buscar no pgvector com cosine similarity:
//    SELECT *, 1 - (embedding <=> query_embedding) as similarity
//    FROM norm_embeddings
//    WHERE (doc_type = ANY($types) OR $types IS NULL)
//    ORDER BY embedding <=> query_embedding
//    LIMIT top_k (default: 5)
// 3. Retornar chunks ordenados por relevância
// 4. Incluir metadados: source, title, article, urn para citação formal
```

### Critério de aceite do Módulo A
```
[ ] Migration executada: tabela norm_embeddings criada com índice ivfflat
[ ] Edge Function index_norms: indexa Lei 14.133/2021 sem erro
[ ] Chunks gerados: mínimo 200 chunks da Lei 14.133/2021
[ ] Edge Function search_rag: retorna chunks relevantes para query "pesquisa de preços"
[ ] Chunks retornados incluem artigos da Lei 14.133/2021 e/ou IN 65/2021
[ ] RLS: usuário autenticado consegue fazer SELECT, não consegue INSERT
[ ] audit_logs registra 'rag.index_completed' após indexação
```

---

## MÓDULO B — MULTI-LLM: ROTEADOR DE PROVEDORES

### B.1 — Migration: novos campos em ai_jobs

```sql
ALTER TABLE ai_jobs
  ADD COLUMN IF NOT EXISTS llm_provider       VARCHAR DEFAULT 'anthropic',
  ADD COLUMN IF NOT EXISTS llm_model          VARCHAR DEFAULT 'claude-sonnet-4-20250514',
  ADD COLUMN IF NOT EXISTS llm_provider_req_id VARCHAR,
  ADD COLUMN IF NOT EXISTS data_classification VARCHAR DEFAULT 'institutional',
  ADD COLUMN IF NOT EXISTS sanitized          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rag_chunks_used    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rag_sources        JSONB DEFAULT '[]';

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS llm_provider_mix   JSONB DEFAULT '[]';
```

### B.2 — Refatorar Edge Function `orchestrate_document`

Adicionar ao fluxo existente:

```typescript
// 1. SANITIZAÇÃO (antes de qualquer chamada a Gemini ou GPT)
function sanitize_payload(data: any, target_provider: string): any {
  if (target_provider === 'anthropic') return data; // Claude recebe tudo
  // Para Gemini e GPT: remover campos sensíveis
  const RESTRICTED_FIELDS = ['cpf', 'matricula', 'rg', 'endereco_pessoal', 'dados_bancarios'];
  return stripFields(data, RESTRICTED_FIELDS);
}

// 2. ROTEAMENTO POR AGENTE
const AGENT_ROUTER = {
  'technical-expansion-engine':      { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  'legal-argumentation-engine':      { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  'normative-compliance-engine':     { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  'consistency-coherence-engine':    { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  'validation-gap-engine':           { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  'document-structure-engine':       { provider: 'google',    model: 'gemini-2.0-flash' },
  'formatting-standardization':      { provider: 'google',    model: 'gemini-2.0-flash' },
  'search_prices':                   { provider: 'openai',    model: 'gpt-4o-mini' },
};

// 3. RAG INJECTION (antes de chamar o LLM para seções jurídicas)
async function inject_rag_context(section: any, agent: string): Promise<string> {
  if (!['legal-argumentation-engine', 'normative-compliance-engine', 'technical-expansion-engine'].includes(agent)) {
    return ''; // RAG apenas para agentes que precisam de contexto normativo
  }
  const chunks = await search_rag({
    query: `${section.title} ${section.structured_data?.tipo_objeto || ''}`,
    top_k: 5
  });
  return chunks.map(c => `[${c.source} — ${c.title} ${c.article}]: ${c.content}`).join('\n\n');
}

// 4. CHAMADA AO PROVEDOR CORRETO
async function call_llm(provider: string, model: string, prompt: string): Promise<LLMResponse> {
  if (provider === 'anthropic') {
    // Anthropic SDK — já implementado
  }
  if (provider === 'google') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': Deno.env.get('GOOGLE_GEMINI_API_KEY') },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return { text: data.candidates[0].content.parts[0].text, provider_req_id: data.usageMetadata?.requestId };
  }
  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 1000 })
    });
    const data = await res.json();
    return { text: data.choices[0].message.content, provider_req_id: data.id };
  }
}

// 5. REGISTRO EM ai_jobs (incluindo novos campos)
await supabase.from('ai_jobs').insert({
  document_id, section_id, agent, execution_stage,
  llm_provider: provider,
  llm_model: model,
  llm_provider_req_id: response.provider_req_id,
  data_classification: 'institutional',
  sanitized: provider !== 'anthropic',
  rag_chunks_used: chunks.length,
  rag_sources: chunks.map(c => ({ source: c.source, title: c.title, article: c.article })),
  prompt_tokens, completion_tokens, cost_usd
});
```

### Critério de aceite do Módulo B
```
[ ] Migration executada: novos campos em ai_jobs e documents
[ ] AGENT_ROUTER: document-structure-engine chama Gemini (não Claude)
[ ] RAG injection: seções jurídicas recebem chunks relevantes da base normativa no prompt
[ ] Seções técnicas: prompt inclui "Baseie-se nos seguintes dispositivos legais:" + chunks RAG
[ ] ai_jobs.llm_provider registrado corretamente para cada chamada
[ ] ai_jobs.sanitized = true quando provider != 'anthropic'
[ ] ai_jobs.rag_chunks_used > 0 para seções com agentes normativos
[ ] documents.llm_provider_mix atualizado ao final da geração
[ ] Nenhuma chave de API exposta em logs ou respostas
[ ] Dados com CPF/matrícula não chegam a Gemini ou GPT
```

---

## MÓDULO C — PAINEL DE RASTREABILIDADE NO FRONTEND

Adicionar ao `DocumentPage.tsx` uma aba **"Rastreabilidade de IA"** visível para roles `admin` e `approver`:

```
┌─────────────────────────────────────────────────────┐
│ 🤖 Rastreabilidade de IA — Documento #UUID           │
├─────────────────────────────────────────────────────┤
│ Provedores utilizados: Claude ● Gemini               │
│ Total de seções geradas: 21                          │
│ Custo estimado: R$ 0,42                              │
├─────────────────────────────────────────────────────┤
│ Seção | Agente | Provedor | RAG | Tokens | Custo     │
│ ──────────────────────────────────────────────────── │
│ 1. Introdução | doc-structure | Gemini | 0 | 120 |   │
│ 7. Req. Legais | norm-comp | Claude | 5 | 890 | R$.. │
│ 18. Solução | legal-arg | Claude | 4 | 1240 | R$..   │
├─────────────────────────────────────────────────────┤
│ Fontes RAG utilizadas neste documento:               │
│ • Lei 14.133/2021, Art. 18 (5 seções)               │
│ • IN SEGES 65/2021, §3º (2 seções)                  │
│ • TCU Acórdão 2622/2021 (1 seção)                   │
└─────────────────────────────────────────────────────┘
```

**Arquivos a criar/alterar:**
- `frontend/src/components/documents/AITraceabilityPanel.tsx`
- `frontend/src/hooks/useAIJobs.ts` — query em `ai_jobs` pelo `document_id`
- `frontend/src/components/documents/DocumentPage.tsx` — adicionar aba

### Critério de aceite do Módulo C
```
[ ] Aba "Rastreabilidade de IA" visível para admin e approver
[ ] Tabela mostra provedor correto por seção (Claude vs Gemini)
[ ] RAG sources exibidas com título e artigo da norma
[ ] Custo total do documento calculado e exibido
[ ] Dados buscados de ai_jobs via Supabase (real, não mockado)
[ ] Usuário sem role admin/approver não vê a aba
```

---

## ORDEM DE ENTREGA

```
Módulo A (RAG) → aceite → Módulo B (Multi-LLM) → aceite → Módulo C (Painel) → aceite
```

---

## RELATÓRIO POR MÓDULO

```
MÓDULO [A/B/C] — [NOME]
========================
ARQUIVOS CRIADOS: [lista]
ARQUIVOS ALTERADOS: [lista]
CRITÉRIOS DE ACEITE:
  [ PASSOU / FALHOU ] — Critério
RESULTADO: [ APROVADO / REPROVADO ]
PRÓXIMO: Aguardando autorização
```

---

## RESTRIÇÕES DESTA FASE

- ❌ Nunca expor chave de API em código, log ou resposta
- ❌ Nunca enviar CPF, matrícula ou dados restritos para Gemini ou GPT
- ❌ Nunca chamar LLM diretamente do frontend
- ❌ Não criar tabelas além das definidas neste prompt sem aprovação BX4
- ✅ Supabase Secrets para todas as chaves: ANTHROPIC_API_KEY, GOOGLE_GEMINI_API_KEY, OPENAI_API_KEY
- ✅ Toda chamada LLM registrada em ai_jobs com llm_provider e sanitized
- ✅ RAG injection obrigatória para: legal-argumentation-engine, normative-compliance-engine, technical-expansion-engine
