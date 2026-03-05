# MENSAGEM MESTRA — MEU JURÍDICO.AI
# Ativação Completa do Plano de Execução
> Cole este prompt no chat do Antigravity dentro da pasta do projeto MeuJurídico.
> Esta mensagem substitui qualquer instrução anterior e define o plano completo de execução.

---

## LEITURA OBRIGATÓRIA ANTES DE QUALQUER AÇÃO

Você está trabalhando no projeto **MeuJurídico.ai** — plataforma GovTech de geração de documentos de contratação pública com conformidade nativa à Lei 14.133/2021.

Execute agora:

```bash
# 1. Leia toda a estrutura do projeto
ls -la

# 2. Leia os prompts de execução na pasta .agent ou raiz
ls *.md 2>/dev/null || find . -name "MEUJURIDICO_*.md" -not -path "*/node_modules/*"
```

---

## SEU PLANO DE EXECUÇÃO COMPLETO

Você tem **7 prompts de execução** criados e prontos. Execute-os na ordem exata abaixo. Não avance para o próximo sem confirmar os critérios de aceite do anterior.

---

### ✅ FASE 1 — JÁ CONCLUÍDA (não re-executar)
Conexão Supabase, autenticação, RLS, dashboard sem mocks, audit_logs, zero mocks.
**Status: APROVADO 8/8 critérios.**

---

### ✅ FASE 2 — JÁ CONCLUÍDA (não re-executar)
Wizard 4 etapas, Editor + Preview ao vivo, Approval Workflow, Export DOCX/PDF SHA-256.
**Status: APROVADO 4/4 módulos.**

---

### 🔴 PRÓXIMO — FASE 3: Templates + APIs Públicas
**Arquivo:** `MEUJURIDICO_fase3_templates_APIs.md`

**Módulo A — Seed dos 3 templates reais no banco:**
- DFD com 7 seções
- ETP com 21 seções
- TR com 22 seções
- Todos mapeados para os agentes corretos

**Módulo B — 5 Edge Functions de APIs públicas:**
- `search_pncp` → contratos e contratações do PNCP
- `search_prices` → preços do ComprasGov
- `search_legislation` → normas do LexML
- `search_tcu_jurisprudence` → acórdãos do TCU
- Painel "Fontes em Tempo Real" no SectionEditor

---

### 🔴 APÓS FASE 3 — CONEXÃO DE TODAS AS APIs
**Arquivo:** `MEUJURIDICO_conectar_todas_APIs.md`

Testar e validar as 9 integrações:
- 5 APIs públicas (PNCP, ComprasGov, LexML, TCU, Planalto) — sem credenciais
- 3 LLMs via Supabase Secrets (Anthropic, Google Gemini, OpenAI)
- Edge Function `api_health_check`
- Painel `/admin/apis` com status em tempo real

---

### 🔴 APÓS CONEXÃO — FASE 4: RAG + Multi-LLM
**Arquivo:** `MEUJURIDICO_fase4_RAG_multiLLM.md`

**Módulo A — Base normativa vetorizada (pgvector):**
- Tabela `norm_embeddings`
- Edge Function `index_norms` — indexa Lei 14.133/2021, INs e acórdãos TCU
- Edge Function `search_rag` — busca semântica por similaridade

**Módulo B — Roteador Multi-LLM:**
- Claude → agentes jurídicos e normativos
- Gemini Flash → estruturação e formatação
- GPT-4o-mini → extração de dados numéricos
- Sanitização obrigatória antes de Gemini/GPT
- Campos `llm_provider`, `sanitized`, `rag_chunks_used` em `ai_jobs`

**Módulo C — Painel de Rastreabilidade:**
- Aba "Rastreabilidade de IA" no DocumentPage
- Provedor por seção, fontes RAG usadas, custo total

---

### 🔴 EXTENSÃO DA FASE 4 — Acervo Curado de Elite
**Arquivo:** `MEUJURIDICO_fase4_moduloD_acervo_elite.md`

- Tabela `elite_documents`
- Pipeline `curate_elite_documents` — coleta PDFs reais do PNCP
- Score de qualidade automático (0-100) — apenas docs ≥ 60 indexados
- Cron trimestral `schedule_curadoria`
- Busca híbrida: normas legais + exemplos reais homologados
- Painel "Exemplos do Acervo" no SectionEditor
- **Custo: ~$2,70/ano**

---

## REGRAS ABSOLUTAS QUE NUNCA MUDAM

```
1. RLS sagrado — toda query respeita org_id do usuário autenticado
2. audit_logs append-only — nunca UPDATE ou DELETE
3. LLMs apenas via Edge Functions — nunca no frontend
4. Chaves de API via Supabase Secrets — nunca em código ou .env commitado
5. Dados RESTRITOS (CPF, matrícula) — apenas Claude, nunca Gemini ou GPT
6. Schema — nenhuma tabela nova sem aprovação BX4 por escrito
7. Frontend React puro — sem Lovable, sem no-code
8. Lógica financeira — backend only, nunca frontend
```

---

## COMO EXECUTAR

Para cada fase, leia o arquivo correspondente e execute exatamente o que ele define. Ao concluir cada módulo, entregue o relatório no formato:

```
MÓDULO [X] — [NOME]
====================
ARQUIVOS CRIADOS: [lista]
ARQUIVOS ALTERADOS: [lista]
CRITÉRIOS DE ACEITE: [PASSOU/FALHOU por item]
RESULTADO: [APROVADO / REPROVADO]
PRÓXIMO: Aguardando autorização para [próximo módulo]
```

**Não avance sem minha autorização explícita após cada módulo.**

---

## COMECE AGORA

Leia o arquivo `MEUJURIDICO_fase3_templates_APIs.md` e execute o **Módulo A — Seed dos Templates**.
