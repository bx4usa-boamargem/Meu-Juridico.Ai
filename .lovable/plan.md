
# Sprint 1 — Plano Lovable (5 Tarefas)

## Pré-requisito obrigatório

O Antigravity deve criar ANTES de o Lovable começar:
- Tabela `document_templates` (com `doc_type`, `title`, `description`, `sections_plan` JSONB)
- Tabelas `monitoring_config`, `monitoring_alerts`, `monitoring_runs`
- Edge Functions `orchestrate_document`, `monitoring_agent`, `monitoring_scheduler`
- Regenerar `types.ts` após migrations

**NÃO usar `as any`** para tabelas. Aguardar types regenerados.

## Ressalvas do Antigravity (incorporadas)

1. **Nomes de tabela**: Banco atual usa `documentos` + `tipo`. Novas tabelas do Antigravity usarão `document_templates` (inglês). O Lovable deve usar os nomes exatos conforme existirem no banco.
2. **Sem `as any`**: Tarefas 1, 2 e 5 só começam após types regenerados. Tarefas 3 e 4 podem avançar imediatamente (tabelas existentes).
3. **Rota sem conflito**: Usar `/processo/:processoId/novo-documento` — não conflita com `/processo/:id` pois é mais específica.
4. **Configuracoes.tsx**: Preservar 100% das 3 sub-tabs existentes. Apenas adicionar 4ª tab "Monitoramento".

---

## Tarefa 1 — Tela de seleção de tipo de documento

**Rota**: `/processo/:processoId/novo-documento`
**Arquivo**: `src/pages/SelecionarTipoDocumento.tsx`

- Grid responsivo de cards (1/2/4 colunas)
- Lê tipos de `document_templates` (tabela nova do Antigravity)
- Hover: borda azul + sombra. Selecionado: fundo `#EFF6FF` + borda sólida
- Ao clicar: navega para wizard com `doc_type` no state
- Abaixo: docs existentes do processo com status

```ts
// Ler templates disponíveis
const { data: templates } = await supabase
  .from('document_templates')
  .select('doc_type, title, description, sections_plan')

// Docs existentes do processo
const { data: existingDocs } = await supabase
  .from('documentos')
  .select('tipo, status, updated_at')
  .eq('processo_id', processoId)
```

---

## Tarefa 2 — Wizard adaptativo por tipo

**Arquivos**: `src/hooks/useDocumentTemplate.ts` (novo), `src/pages/Documento.tsx`, `src/components/documento/CustomDocumentBuilder.tsx` (novo)

- Hook `useDocumentTemplate(docType)` carrega `sections_plan` de `document_templates`
- Fallback para seções hardcoded (DFD/ETP/TR) se template não encontrado
- **Edital**: Banner se houver TR aprovado no processo
- **Custom**: Tela intermediária para montar seções antes do wizard

---

## Tarefa 3 — Chamada correta ao backend (pode avançar já)

**Arquivo**: `src/pages/Documento.tsx`

- Botão final do wizard passa `doc_type` para `orchestrate_document`
- Nunca hardcodar tipo
- Exibir erros ao usuário

```ts
const { data, error } = await supabase.functions.invoke('orchestrate_document', {
  body: { document_id, process_id, doc_type: selectedDocType, form_data, provider: 'claude' }
})
if (error) toast.error('Erro ao gerar documento: ' + error.message)
```

---

## Tarefa 4 — Filtro por tipo em "Meus documentos" (pode avançar já)

**Arquivo**: `src/pages/Documentos.tsx`

- Tabs pill: `[Todos] [DFD] [ETP] [TR] [Projeto Básico] [Mapa de Risco] [Edital] [Personalizado]`
- "Todos" remove filtro, demais: `.eq('tipo', selectedFilter)`
- Manter visual existente

---

## Tarefa 5 — Painel de Monitoramento

**Arquivos**: `src/pages/Configuracoes.tsx` (adicionar tab), `src/components/configuracoes/MonitoramentoPanel.tsx` (novo), `src/components/configuracoes/AlertDetailDrawer.tsx` (novo)

**⚠️ Não alterar as 3 sub-tabs existentes — apenas adicionar a 4ª.**

### 5a — Card de controle
- Status ativo/pausado, frequência (diário/semanal/mensal)
- Próxima/última execução
- Barra de custo: soma `estimated_cost_usd` de `monitoring_runs` do mês / $5 limite
- Botão "Executar agora" → `supabase.functions.invoke('monitoring_agent')`

### 5b — Lista de alertas
- Tabela: Severidade (badge colorido) · Fonte · Tipos afetados (pills) · Título · Data · "Ver análise"
- Drawer lateral com `impact_analysis`
- Cores: critical=#DC2626, high=#EA580C, medium=#CA8A04, low=#64748B

### 5c — Filtros
- Pills de severidade + dropdowns de fonte, tipo, período

### 5d — Escopo monitorado (somente leitura)
- Federal: TCU, CGU, PNCP ✅
- Estados: SP, RJ, MG ✅
- Fase 2: 🔒 Demais estados

---

## Arquivos novos

| Arquivo | Finalidade |
|---------|-----------|
| `src/pages/SelecionarTipoDocumento.tsx` | Grid de seleção de tipo |
| `src/hooks/useDocumentTemplate.ts` | Carrega sections_plan do banco |
| `src/components/documento/CustomDocumentBuilder.tsx` | Montagem de doc personalizado |
| `src/components/configuracoes/MonitoramentoPanel.tsx` | Painel de monitoramento |
| `src/components/configuracoes/AlertDetailDrawer.tsx` | Drawer de análise de alerta |

## Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Rota `/processo/:processoId/novo-documento` |
| `src/pages/Documento.tsx` | Template hook + orchestrate call |
| `src/pages/Documentos.tsx` | Tabs de filtro por tipo |
| `src/pages/Configuracoes.tsx` | Adicionar tab Monitoramento (sem alterar as 3 existentes) |
