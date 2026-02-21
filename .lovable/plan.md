
# Corrigir Falha na Geracao do Document Engine

## Problema
O `handleNext` em `Documento.tsx` nao valida o retorno do INSERT em `document_versions`. Se o insert falhar (ex: RLS, campo nulo), o codigo continua atualizando status e navegando para `/view`, onde nao ha versao -- resultando em "Nenhuma versao encontrada".

## Correcao 1 -- Documento.tsx (handleNext, linhas 219-244)

Reescrever o bloco de finalizacao com validacao sequencial:

```text
1. Verificar que docId e processoId nao sao null
2. renderDfdTemplate(formData, processoData) -> htmlFinal
3. INSERT em document_versions com .select().single()
4. SE erro no insert -> toast.error("Erro ao gerar documento. Tente novamente.") e RETURN
5. Somente apos sucesso:
   a. UPDATE documentos.status = 'aprovado'
   b. UPDATE processos.status = 'DFD_APROVADO'
   c. invalidateQueries
   d. navigate para /view
```

Codigo resultante:
```typescript
if (nextIdx >= enabledSections.length) {
  if (!docId || !processoId) {
    toast.error("IDs de documento ou processo não encontrados.");
    return;
  }

  const htmlFinal = renderDfdTemplate(formData, processoData);

  const { error: insertError } = await supabase
    .from("document_versions")
    .insert({
      documento_id: docId,
      processo_id: processoId,
      conteudo_html: htmlFinal,
      versao: 1,
      gerado_por: user?.id,
    });

  if (insertError) {
    console.error("Erro ao inserir versão:", insertError);
    toast.error("Erro ao gerar documento. Tente novamente.");
    return;
  }

  await supabase.from("documentos").update({
    status: "aprovado",
    conteudo_final: htmlFinal,
    workflow_status: "rascunho",
  }).eq("id", docId);

  await supabase.from("processos").update({ status: "DFD_APROVADO" }).eq("id", processoId);

  queryClient.invalidateQueries({ queryKey: ["processo", processoId] });
  queryClient.invalidateQueries({ queryKey: ["pipeline", processoId] });
  toast.success("DFD finalizado! Redirecionando para visualização...");
  navigate(`/processo/${processoId}/documento/${docId}/view`);
  return;
}
```

## Correcao 2 -- DocumentView.tsx (query, linha 41)

Trocar `.single()` por `.maybeSingle()` para nao lancar erro quando nao ha versao. Isso permite exibir mensagem amigavel em vez de erro no console.

## Correcao 3 -- Verificar RLS

A policy `users_own_versions` ja existe com comando ALL e verifica `processo_id IN (SELECT id FROM processos WHERE created_by = auth.uid())`. Isso cobre INSERT. Nenhuma alteracao de RLS necessaria.

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Documento.tsx` | Adicionar validacao de erro no INSERT e guards de null |
| `src/pages/DocumentView.tsx` | Trocar `.single()` por `.maybeSingle()` na query de versao |
