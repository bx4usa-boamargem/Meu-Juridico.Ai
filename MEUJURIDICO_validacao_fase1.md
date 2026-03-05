# PROMPT PARA O ANTIGRAVITY — MEU JURÍDICO.AI
# Missão: Validar os 8 Critérios de Aceite da Fase 1 (M9)
> Cole este prompt no chat do Antigravity dentro da pasta do projeto MeuJurídico.

---

## CONTEXTO

A **Fase 1 de Correção M9** foi declarada concluída pelo Antigravity com as seguintes entregas:
- `.env.local` criado com variáveis de ambiente
- `supabase.ts` refatorado (sem localhost hardcoded)
- `useAuth.ts` + `AuthGuard.tsx` + `LoginPage.tsx` implementados
- `App.tsx` reconstruído com rotas protegidas
- `DashboardPage.tsx` sem mocks de fallback
- `useTemplates.ts` + `ModelsPage.tsx` lendo de `document_templates`
- `CreateDocument.ts` com insert transacional em `processes`, `documents` e `audit_logs`
- `DocumentPage.tsx` lendo documento real via `eq('id', id)`

**Sua missão agora é validar se as entregas realmente funcionam** — testando cada um dos 8 critérios de aceite definidos no briefing técnico M9.

---

## REGRAS ABSOLUTAS (não negociáveis durante esta validação)

1. **RLS é sagrado** — nenhuma query pode retornar dados de `org_id` diferente do usuário autenticado
2. **audit_logs é append-only** — nunca execute UPDATE ou DELETE nesta tabela
3. **Sem mocks** — qualquer dado hardcoded encontrado é falha de aceite
4. **Sem frontend lógica financeira** — cálculos de custo/tokens só via Edge Function
5. **LLM único** — apenas `claude-sonnet-4-20250514`. Não invocar nesta fase.

---

## MISSÃO

Use o agente `@qa-automation-engineer` combinado com `@security-auditor` para executar a bateria completa de validação.

**Não corrija nada ainda.** Primeiro valide tudo e entregue o relatório completo. Só então corrija o que falhar.

---

## BATERIA DE VALIDAÇÃO — 8 CRITÉRIOS DE ACEITE

Execute cada critério na ordem. Para cada um: **PASSOU / FALHOU / PARCIAL** + evidência.

---

### CRITÉRIO 1 — Conexão Supabase real

**O que validar:**
- Abra `frontend/src/lib/supabase.ts` — confirme que não há `localhost` hardcoded
- Confirme que a URL e a `anon key` vêm de `process.env.NEXT_PUBLIC_SUPABASE_URL` e `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou equivalente)
- Confirme que `.env.local` existe e tem as duas variáveis preenchidas (mostre as chaves, não os valores)
- Confirme que o arquivo `.env.local` está no `.gitignore`

**Evidência esperada:**
```
✅ supabase.ts: URL vem de env var (sem localhost)
✅ .env.local: existe com SUPABASE_URL e SUPABASE_ANON_KEY
✅ .gitignore: .env.local presente
```

---

### CRITÉRIO 2 — Login funcional via Supabase Auth

**O que validar:**
- `LoginPage.tsx` existe e chama `supabase.auth.signInWithPassword()` (ou equivalente)
- `useAuth.ts` gerencia sessão via `supabase.auth.getSession()` e `onAuthStateChange`
- `AuthGuard.tsx` redireciona para `/login` quando não autenticado
- `App.tsx` envelopa rotas privadas com `AuthGuard`
- Rode o dev server e confirme que acessar `/dashboard` sem login redireciona para `/login`

**Evidência esperada:**
```
✅ LoginPage.tsx: chama supabase.auth.signInWithPassword
✅ useAuth.ts: gerencia sessão com onAuthStateChange
✅ AuthGuard.tsx: redireciona não-autenticados para /login
✅ App.tsx: rotas privadas protegidas com AuthGuard
✅ Redirecionamento funcional confirmado
```

---

### CRITÉRIO 3 — Dashboard 100% real (zero mocks)

**O que validar:**
- Abra `DashboardPage.tsx` — procure por: `mock`, `Mock`, `hardcoded`, `'TR mockado'`, `'ETP mockado'`, arrays estáticos de documentos
- O estado de loading exibe um spinner/skeleton real (não dados falsos)
- O estado de erro exibe mensagem real (não fallback com dados fictícios)
- Se o banco estiver vazio, o dashboard exibe "nenhum documento" — não dados inventados

**Evidência esperada:**
```
✅ DashboardPage.tsx: nenhuma string "mock" ou "mockado" encontrada
✅ Estado de loading: spinner real
✅ Estado de erro: mensagem real sem fallback data
✅ Banco vazio: tela em branco / "nenhum documento"
```

---

### CRITÉRIO 4 — Modelos lidos da tabela `document_templates`

**O que validar:**
- Abra `useTemplates.ts` — confirme query `supabase.from('document_templates').select()`
- Abra `ModelsPage.tsx` — confirme que não há array `mockTemplates` ou strings hardcoded de templates
- Confirme que a página exibe loading enquanto busca e erro se a query falhar

**Evidência esperada:**
```
✅ useTemplates.ts: query real em document_templates
✅ ModelsPage.tsx: sem mockTemplates hardcoded
✅ Loading e error states implementados
```

---

### CRITÉRIO 5 — Botão "Criar" insere no banco

**O que validar:**
- Abra `CreateDocument.ts` — confirme que faz insert em `processes` primeiro, depois em `documents`, depois em `audit_logs`
- Confirme que é transacional: se `documents` falhar, `processes` não fica órfão
- Confirme que o `audit_logs` recebe `action: 'document.created'` com `user_id`, `role` e timestamp
- Confirme que após o insert, o router redireciona para `/documents/:id` com o UUID real do Postgres (não um ID falso gerado no frontend)

**Evidência esperada:**
```
✅ CreateDocument.ts: insert serial em processes → documents → audit_logs
✅ Tratamento de erro transacional implementado
✅ audit_logs: action 'document.created' com user_id real
✅ Redirecionamento para UUID real do Postgres após insert
```

---

### CRITÉRIO 6 — DocumentPage lê conteúdo real do banco

**O que validar:**
- Abra `DocumentPage.tsx` — confirme que não há texto hardcoded como `"Este é um documento..."`
- Confirme que usa `useParams()` para pegar o `id` da URL
- Confirme query `supabase.from('documents').select().eq('id', id)`
- Confirme que também busca `document_sections` pelo `document_id`
- Confirme loading e error states

**Evidência esperada:**
```
✅ DocumentPage.tsx: sem texto hardcoded
✅ useParams() capturando id da URL
✅ Query em documents com eq('id', id)
✅ Query em document_sections com document_id
✅ Loading e error states implementados
```

---

### CRITÉRIO 7 — Auditoria registrada em `audit_logs`

**O que validar:**
- Confirme que `audit_logs` recebe registro no momento de criação do documento
- O registro deve conter: `user_id`, `role`, `action: 'document.created'`, `new_value` com o ID do documento criado
- Acesse o Supabase Studio (ou via query direta) e confirme que a tabela está recebendo registros
- Confirme que **não há** nenhum `UPDATE` ou `DELETE` na tabela `audit_logs` em nenhum arquivo do projeto

**Evidência esperada:**
```
✅ audit_logs: insert confirmado após criação de documento
✅ Campos: user_id, role, action, new_value presentes
✅ Nenhum UPDATE ou DELETE em audit_logs em todo o projeto
```

---

### CRITÉRIO 8 — Erradicação total de mocks

**O que validar:**
Execute uma busca global no projeto por qualquer resquício de dados falsos:

```bash
grep -r "mock\|Mock\|hardcoded\|fallback data\|placeholder\|dummy\|faker\|Lorem ipsum" frontend/src --include="*.ts" --include="*.tsx" -l
```

Qualquer arquivo retornado que não seja de testes (`*.test.*`, `*.spec.*`) é uma **falha de aceite**.

**Evidência esperada:**
```
✅ grep retorna 0 arquivos de produção com mock/hardcoded
```

---

## RELATÓRIO FINAL OBRIGATÓRIO

Após executar todos os critérios, entregue este relatório:

```
MEU JURÍDICO — VALIDAÇÃO FASE 1 (M9)
======================================

CRITÉRIO 1 — Conexão Supabase:     [ PASSOU / FALHOU / PARCIAL ]
CRITÉRIO 2 — Login Supabase Auth:  [ PASSOU / FALHOU / PARCIAL ]
CRITÉRIO 3 — Dashboard sem mocks:  [ PASSOU / FALHOU / PARCIAL ]
CRITÉRIO 4 — Modelos reais:        [ PASSOU / FALHOU / PARCIAL ]
CRITÉRIO 5 — Insert no banco:      [ PASSOU / FALHOU / PARCIAL ]
CRITÉRIO 6 — DocumentPage real:    [ PASSOU / FALHOU / PARCIAL ]
CRITÉRIO 7 — audit_logs:           [ PASSOU / FALHOU / PARCIAL ]
CRITÉRIO 8 — Zero mocks:           [ PASSOU / FALHOU / PARCIAL ]

RESULTADO GERAL: [ APROVADO / REPROVADO / APROVADO COM RESSALVAS ]

ITENS QUE FALHARAM:
- [lista com arquivo e linha]

PRÓXIMA AÇÃO RECOMENDADA:
- [ ] Fase 1 aprovada — iniciar planejamento da Fase 2
- [ ] Fase 1 com falhas — corrigir itens listados antes de avançar
```

---

## SE HOUVER FALHAS

Após entregar o relatório, corrija apenas os itens que falharam — **sem adicionar nenhuma funcionalidade nova**. O escopo desta fase é estritamente corretivo.

Não inicie Editor, Wizard, Approval Workflow nem chame Edge Functions nesta fase.
