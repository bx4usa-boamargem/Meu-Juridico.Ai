

# Pagina Publica de Compartilhamento + Geracao de PDF

## Resumo

Tres entregas: (1) pagina publica `/shared/:token` para visualizacao read-only do documento, (2) edge function `generate-pdf` para converter HTML em PDF e salvar no storage, (3) integracao do botao de PDF na tela DocumentView.

---

## Etapa 1 -- Pagina Publica `/shared/:token`

Criar `src/pages/SharedDocument.tsx` -- uma pagina sem autenticacao que:

1. Extrai o `token` da URL
2. Busca o `document_share_links` pelo token (a RLS policy `public_read_share_links` ja permite leitura anonima para links ativos)
3. Busca o `document_versions` pelo `version_id` (a RLS policy `public_read_via_share` ja permite leitura anonima)
4. Renderiza o HTML do documento em modo read-only (sem editor, sem toolbar de edicao)
5. Inclui header minimalista com titulo do documento e botao "Imprimir"

**Rota em App.tsx**: Adicionar `/shared/:token` FORA do `ProtectedRoute`, pois e acesso publico.

**Layout**: Pagina standalone, sem sidebar nem AppLayout -- apenas o documento centralizado com estilo clean.

---

## Etapa 2 -- Edge Function `generate-pdf`

Criar `supabase/functions/generate-pdf/index.ts` que:

1. Recebe `{ version_id, documento_id }` via POST
2. Valida JWT do usuario (seguranca em codigo)
3. Busca o `conteudo_html` da `document_versions`
4. Usa a API do Lovable AI (modelo `google/gemini-2.5-flash`) para... Na verdade, HTML-to-PDF nao e tarefa de LLM.

**Abordagem alternativa**: Usar a biblioteca `jspdf` + `html2canvas` no **client-side** em vez de edge function, pois:
- Edge functions Deno nao tem acesso a navegador para renderizar HTML
- Bibliotecas server-side de PDF em Deno sao limitadas
- A abordagem client-side funciona bem para documentos HTML estilizados

**Implementacao client-side**:
- No DocumentView, ao clicar "Gerar PDF", usar `window.print()` com `@media print` otimizado (ja implementado parcialmente)
- Alternativamente, usar a API nativa do navegador para capturar o HTML e gerar um Blob PDF via `print()`
- Salvar o PDF gerado no storage bucket `document-pdfs` via upload direto do client
- Atualizar `document_versions.pdf_url` e `pdf_gerado_em`

**Nota sobre Storage RLS**: Sera necessario criar policies de INSERT para o bucket `document-pdfs` permitindo usuarios autenticados fazerem upload.

---

## Etapa 3 -- Integracao do PDF no DocumentView

Adicionar ao toolbar do DocumentView:
- Botao "Gerar PDF" que abre janela de impressao otimizada para PDF
- Apos gerar, faz upload do arquivo para o storage
- Atualiza a versao com `pdf_url`
- Exibe link para download do PDF se ja existir

---

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/pages/SharedDocument.tsx` | **Novo** -- pagina publica read-only |
| `src/App.tsx` | Adicionar rota `/shared/:token` fora do ProtectedRoute |
| `src/pages/DocumentView.tsx` | Adicionar botao de PDF com upload para storage |
| Migration SQL | RLS policies para storage bucket `document-pdfs` |

## Detalhes Tecnicos

### SharedDocument.tsx - Consulta publica

A consulta usa o client Supabase com anon key (sem autenticacao). As RLS policies existentes ja permitem:
- `public_read_share_links`: SELECT quando `ativo = true` e nao expirado
- `public_read_via_share`: SELECT em `document_versions` quando o `id` esta referenciado em um share link ativo

### Storage RLS para document-pdfs

```sql
CREATE POLICY "authenticated_upload_pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'document-pdfs');

CREATE POLICY "public_read_pdfs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'document-pdfs');
```

### Fluxo de PDF

```text
Usuario clica "Gerar PDF"
    |
    v
window.print() abre dialogo de impressao
    |
    v
Usuario salva como PDF localmente
    |
    v
(Opcional futuro: upload automatico via File API)
```

Para a v1, o "Gerar PDF" usara `window.print()` com CSS `@media print` otimizado, que ja permite salvar como PDF pelo navegador. O upload automatico para storage pode ser adicionado em iteracao futura quando houver necessidade de persistencia server-side.

