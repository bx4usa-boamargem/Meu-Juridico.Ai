# PROMPT PARA O ANTIGRAVITY — MEU JURÍDICO.AI
# Conexão de Todas as APIs — Automática + Chaves já disponíveis
> Cole este prompt no chat do Antigravity dentro da pasta do projeto MeuJurídico.

---

## MISSÃO

Conectar e validar todas as APIs necessárias para o funcionamento completo do MeuJurídico. As chaves de API já estão configuradas como Supabase Secrets pelo BX4. Sua responsabilidade é implementar e testar cada integração.

Use `@backend-specialist` para executar todos os passos abaixo.

---

## ETAPA 1 — VERIFICAR SECRETS NO SUPABASE

Antes de qualquer código, confirme que os seguintes secrets estão configurados:

```bash
# Via Supabase CLI
supabase secrets list
```

Confirme que existem:
```
ANTHROPIC_API_KEY     → deve existir
GOOGLE_GEMINI_API_KEY → deve existir  
OPENAI_API_KEY        → deve existir
```

Se algum estiver faltando, pare e informe. Não continue sem todos os 3.

---

## ETAPA 2 — APIs PÚBLICAS (sem autenticação)

Teste cada uma via fetch direto. Confirme que retornam status 200.

### 2.1 — PNCP
```typescript
// Teste: buscar contratações recentes
const res = await fetch(
  'https://pncp.gov.br/api/pncp/v1/orgaos/00394460000141/compras?dataInicial=20240101&dataFinal=20241231&pagina=1'
);
// Esperado: JSON com array de contratações
```

### 2.2 — ComprasGov
```typescript
const res = await fetch(
  'https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/1_consultarMaterial?pagina=1'
);
// Esperado: JSON com itens de material
```

### 2.3 — LexML
```typescript
const res = await fetch(
  'https://www.lexml.gov.br/busca/SRU?operation=searchRetrieve&version=1.1&query=urn+any+14133+and+date+any+2021&maximumRecords=5&startRecord=1'
);
// Esperado: XML com normas da Lei 14.133/2021
```

### 2.4 — TCU
```typescript
const res = await fetch(
  'https://dados-abertos.apps.tcu.gov.br/api/acordao/recupera-acordaos?inicio=0&quantidade=3'
);
// Esperado: JSON com acórdãos
```

### 2.5 — Planalto
```typescript
const res = await fetch(
  'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm'
);
// Esperado: HTML da Lei 14.133/2021
```

---

## ETAPA 3 — APIs PAGAS (usando Supabase Secrets)

### 3.1 — Anthropic Claude
```typescript
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'Responda apenas: OK' }]
  })
});
// Esperado: { content: [{ text: 'OK' }] }
```

### 3.2 — Google Gemini (geração de texto)
```typescript
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${Deno.env.get('GOOGLE_GEMINI_API_KEY')}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Responda apenas: OK' }] }]
    })
  }
);
// Esperado: { candidates: [{ content: { parts: [{ text: 'OK' }] } }] }
```

### 3.3 — Google Gemini (embeddings)
```typescript
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${Deno.env.get('GOOGLE_GEMINI_API_KEY')}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text: 'teste de embedding' }] }
    })
  }
);
// Esperado: { embedding: { values: [...768 floats...] } }
```

### 3.4 — OpenAI GPT
```typescript
const res = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'Responda apenas: OK' }]
  })
});
// Esperado: { choices: [{ message: { content: 'OK' } }] }
```

---

## ETAPA 4 — CRIAR EDGE FUNCTION DE HEALTH CHECK

Crie `supabase/functions/api_health_check/index.ts` que testa todas as APIs e retorna um relatório consolidado:

```typescript
// GET /functions/v1/api_health_check
// Auth: service_role
// Retorna status de cada API em menos de 10 segundos

interface ApiStatus {
  name: string;
  status: 'OK' | 'ERRO' | 'LENTO';
  latencia_ms: number;
  erro?: string;
}

// Testar todas em paralelo (Promise.allSettled)
// Timeout de 8 segundos por API
// Retornar:
// {
//   timestamp: ISO string,
//   apis: [
//     { name: 'PNCP',        status: 'OK',   latencia_ms: 320 },
//     { name: 'ComprasGov',  status: 'OK',   latencia_ms: 180 },
//     { name: 'LexML',       status: 'OK',   latencia_ms: 450 },
//     { name: 'TCU',         status: 'OK',   latencia_ms: 290 },
//     { name: 'Planalto',    status: 'OK',   latencia_ms: 510 },
//     { name: 'Anthropic',   status: 'OK',   latencia_ms: 980 },
//     { name: 'Gemini',      status: 'OK',   latencia_ms: 640 },
//     { name: 'Gemini Emb',  status: 'OK',   latencia_ms: 420 },
//     { name: 'OpenAI',      status: 'OK',   latencia_ms: 750 },
//   ],
//   total_ok: 9,
//   total_erro: 0
// }
```

---

## ETAPA 5 — PAINEL DE STATUS NO FRONTEND (ADMIN)

Adicione uma página `/admin/apis` visível apenas para role `admin`:

```
┌─────────────────────────────────────────────────────┐
│ ⚙️  Status das Integrações — MeuJurídico.ai          │
├─────────────────────────────────────────────────────┤
│ APIs Públicas (sem custo)                           │
│  ● PNCP              ✅ Online   320ms              │
│  ● ComprasGov        ✅ Online   180ms              │
│  ● LexML             ✅ Online   450ms              │
│  ● TCU               ✅ Online   290ms              │
│  ● Planalto          ✅ Online   510ms              │
├─────────────────────────────────────────────────────┤
│ Provedores LLM (com custo)                          │
│  ● Anthropic Claude  ✅ Online   980ms              │
│  ● Google Gemini     ✅ Online   640ms              │
│  ● Google Embeddings ✅ Online   420ms              │
│  ● OpenAI GPT        ✅ Online   750ms              │
├─────────────────────────────────────────────────────┤
│ [🔄 Testar Agora]    Última verificação: 14:32      │
└─────────────────────────────────────────────────────┘
```

**Arquivos a criar:**
- `supabase/functions/api_health_check/index.ts`
- `frontend/src/pages/admin/ApiStatusPage.tsx`
- `frontend/src/hooks/useApiStatus.ts`
- `frontend/src/App.tsx` — adicionar rota `/admin/apis` restrita a `admin`

---

## CRITÉRIOS DE ACEITE

```
[ ] supabase secrets list: ANTHROPIC_API_KEY, GOOGLE_GEMINI_API_KEY, OPENAI_API_KEY presentes
[ ] PNCP: retorna JSON com contratações reais
[ ] ComprasGov: retorna JSON com itens de material
[ ] LexML: retorna XML com normas da Lei 14.133/2021
[ ] TCU: retorna JSON com acórdãos
[ ] Planalto: retorna HTML da Lei 14.133/2021
[ ] Anthropic: retorna resposta válida com claude-sonnet-4-20250514
[ ] Gemini: retorna resposta válida com gemini-2.0-flash
[ ] Gemini Embeddings: retorna vetor de 768 floats
[ ] OpenAI: retorna resposta válida com gpt-4o-mini
[ ] Edge Function api_health_check: testa todas em paralelo e retorna relatório
[ ] Painel /admin/apis: exibe status real de cada API com latência
[ ] Painel restrito a role admin (RLS)
[ ] Nenhuma chave de API exposta em logs, respostas ou código frontend
```

---

## RELATÓRIO FINAL OBRIGATÓRIO

```
CONEXÃO DE APIs — MEU JURÍDICO.AI
===================================
APIs PÚBLICAS:
  [ OK / ERRO ] PNCP         — latência: Xms
  [ OK / ERRO ] ComprasGov   — latência: Xms
  [ OK / ERRO ] LexML        — latência: Xms
  [ OK / ERRO ] TCU          — latência: Xms
  [ OK / ERRO ] Planalto     — latência: Xms

PROVEDORES LLM:
  [ OK / ERRO ] Anthropic Claude  — latência: Xms
  [ OK / ERRO ] Google Gemini     — latência: Xms
  [ OK / ERRO ] Google Embeddings — latência: Xms
  [ OK / ERRO ] OpenAI GPT        — latência: Xms

RESULTADO: [ APROVADO / REPROVADO ]
PRÓXIMO: Aguardando autorização para iniciar Fase 4 — Módulo A (RAG)
```

---

## RESTRIÇÕES

- ❌ Nunca logar ou expor valores de chaves de API
- ❌ Nunca chamar APIs LLM do frontend — apenas via Edge Function
- ✅ Timeouts de 8s por API nos health checks
- ✅ Promise.allSettled para testar todas em paralelo (não travar se uma falhar)
- ✅ APIs públicas não precisam de nenhuma credencial
