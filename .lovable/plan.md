
# Integracao Real do ProcessWorkspace -- Dados Reais com Ajustes Obrigatorios

## Resumo

Transformar `Processo.tsx` em orquestrador documental real que redireciona automaticamente ao DFD ativo, criar view e RPC no banco, e adicionar logica de finalizacao no `Documento.tsx`.

## Etapa 1 -- Migracoes SQL

### 1a. View `vw_processo_com_dfd` com LATERAL JOIN

Criar view que busca APENAS o DFD ativo (maior versao) usando `LEFT JOIN LATERAL ... ORDER BY versao DESC LIMIT 1`:

```text
CREATE VIEW vw_processo_com_dfd AS
SELECT
  p.id AS processo_id,
  p.numero_processo, p.orgao, p.objeto, p.modalidade,
  p.status, p.created_at, p.created_by, p.context_data,
  dfd.id AS dfd_id,
  dfd.status AS dfd_status,
  dfd.dados_estruturados AS dfd_dados,
  dfd.cadeia_id,
  dfd.versao AS dfd_versao
FROM processos p
LEFT JOIN LATERAL (
  SELECT d.id, d.status, d.dados_estruturados, d.cadeia_id, d.versao
  FROM documentos d
  WHERE d.processo_id = p.id
    AND d.tipo IN ('DFD', 'dfd')
  ORDER BY d.versao DESC NULLS LAST
  LIMIT 1
) dfd ON true;
```

Politica RLS na view: herda de `processos` via `created_by = auth.uid()`.

### 1b. RPC `obter_pipeline_processo`

Funcao que retorna a cadeia documental com status de cada documento:

```text
obter_pipeline_processo(p_processo_id uuid) RETURNS jsonb
  - Busca cadeia_id do primeiro documento do processo
  - Le array da cadeia documental
  - Para cada tipo: verifica se existe documento, seu status
  - Marca desbloqueado = true se posicao 0 OU documento anterior aprovado
  - Retorna array jsonb com {tipo, posicao, doc_id, status, desbloqueado}
```

## Etapa 2 -- Processo.tsx como Orquestrador

Reescrever `Processo.tsx` para:

1. Carregar dados via query direta (simulando a view, ja que views nao aparecem no SDK automaticamente -- usar query raw ou RPC)
2. Logica de auto-redirect via `useEffect`:
   - Se `dfd_id` existe E `dfd_status !== 'aprovado'` --> `navigate(/processo/{id}/documento/{dfd_id}, { replace: true })`
   - Se `dfd_status === 'aprovado'` --> mostrar pipeline completa (cadeia documental com status)
3. Carregar pipeline via `obter_pipeline_processo` quando DFD aprovado
4. Remover queries separadas de documentos e cadeia (substituidas pela view/RPC)

### Fluxo de decisao:

```text
Processo.tsx carrega vw_processo_com_dfd
  |
  +--> DFD nao aprovado? --> redirect para /processo/{id}/documento/{dfd_id}
  |
  +--> DFD aprovado? --> mostrar pipeline (DocumentChainView existente)
  |
  +--> Sem DFD? --> mostrar erro "Processo sem DFD"
```

## Etapa 3 -- Documento.tsx: Finalizacao do DFD

No `handleNext`, quando e o ultimo step:

1. Atualizar `documentos.status = 'aprovado'` para o docId atual
2. Atualizar `processos.status = 'DFD_APROVADO'` (conforme ajuste solicitado -- NAO 'ativo')
3. Invalidar queries do TanStack Query: `['processo', processoId]`
4. Toast de sucesso: "DFD finalizado com sucesso!"
5. `navigate(/processo/{processoId})` -- volta ao orquestrador que agora mostra pipeline

### Trecho de codigo (handleNext, ultimo step):

```text
if (nextIdx >= enabledSections.length) {
  // Finalizar documento
  await supabase.from("documentos").update({ status: "aprovado" }).eq("id", docId);
  await supabase.from("processos").update({ status: "DFD_APROVADO" }).eq("id", processoId);
  queryClient.invalidateQueries({ queryKey: ["processo", processoId] });
  toast.success("DFD finalizado com sucesso!");
  navigate(`/processo/${processoId}`);
  return;
}
```

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar `vw_processo_com_dfd` (LATERAL JOIN) + RPC `obter_pipeline_processo` |
| `src/pages/Processo.tsx` | Reescrever: carregar view, auto-redirect, mostrar pipeline |
| `src/pages/Documento.tsx` | Adicionar finalizacao: UPDATE status + navigate de volta |

### Arquivos NAO modificados
- `App.tsx` -- rotas permanecem identicas
- `NovoProcessoDialog.tsx` -- ja funciona com redirect
- `ProcessCard.tsx` -- ja funciona com navegacao direta
- `DocumentLayout.tsx` -- intacto
- Componentes do documento -- intactos
- Edge Functions -- intactas
- Autenticacao -- intacta

## Nenhum componente novo sera criado
Reutilizacao total de `DocumentChainView` para exibir pipeline quando DFD aprovado.
