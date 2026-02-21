
# Validacao Visual + Editor Rico no Step 8

## Resumo

Tres entregas: (1) validacao visual com destaque vermelho nos campos obrigatorios vazios ao tentar avancar, (2) teste do botao Finalizar no Step 8, e (3) editor de texto rico na Visualizacao.

## Etapa 1 -- Validacao Visual nos Campos Obrigatorios

### Problema atual
Quando o usuario clica "Proximo" sem preencher campos obrigatorios, aparece apenas um toast generico. Nao ha indicacao visual de QUAIS campos estao faltando.

### Solucao

Adicionar estado `invalidFields` (Set de keys) em `Documento.tsx`. Quando `handleNext` detecta campos faltantes, popula esse Set e passa para `StepFormRenderer`. O Set e limpo quando o usuario muda de step ou preenche o campo.

**Documento.tsx:**
- Novo estado: `const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set())`
- No `handleNext`, quando `!complete`: identificar campos vazios, chamar `setInvalidFields(new Set(missingKeys))` e retornar
- Ao mudar de step (`handleSelectStep`, `handlePrevious`): limpar `setInvalidFields(new Set())`
- No `handleFieldChange`: remover a key do Set quando preenchida
- Passar `invalidFields` como prop para `StepFormRenderer`

**StepFormRenderer.tsx:**
- Nova prop `invalidFields?: Set<string>`
- No `renderField`, se `invalidFields.has(field.key)`:
  - Borda vermelha no Input/Textarea/Select: `border-destructive`
  - Mensagem inline abaixo: `<p className="text-[10px] text-destructive">Campo obrigatorio</p>`

### Resultado visual

```text
+------------------------------------------+
| Objeto da Contratacao *                   |
| +--------------------------------------+ |
| |                          (borda verm) | |
| +--------------------------------------+ |
| Campo obrigatorio                        |
+------------------------------------------+
```

## Etapa 2 -- Teste do Finalizar (Step 8)

O codigo de finalizacao ja existe em `handleNext` (linhas 191-199). Porem ha um bug: o botao "Finalizar" tem `disabled={!canAdvance && !isLastStep}` -- no ultimo step, `isLastStep` e `true`, entao o `disabled` e `false` (OK). Mas `canAdvance` usa `currentSection.required` que e `false` para Visualizacao, entao funciona.

**Ajuste necessario:** Nenhum no codigo -- o fluxo ja funciona. Basta testar clicando Finalizar no Step 8 e verificar:
1. Documento atualiza para `status = 'aprovado'`
2. Processo atualiza para `status = 'DFD_APROVADO'`
3. Redirect para `/processo/{id}` que mostra pipeline

## Etapa 3 -- Editor de Texto Rico no Step 8

### Abordagem
Usar `contentEditable` com `execCommand` para um editor leve sem dependencias externas. Isso e suficiente para formatacao basica (negrito, italico, listas, titulos) e evita adicionar bibliotecas pesadas.

### Novo componente: `RichTextEditor.tsx`

```text
src/components/documento/RichTextEditor.tsx
```

- Toolbar com botoes: Negrito, Italico, Sublinhado, Lista, Titulo
- Area editavel via `div[contentEditable]` com borda e padding
- Recebe `value` (HTML string) e `onChange` callback
- Salva conteudo como `conteudo_final` no formData
- Substitui tokens `{{campo}}` por valores reais na pre-visualizacao

### Integracao no StepFormRenderer

Na secao de Visualizacao (quando `section.fields.length === 0`), substituir o placeholder atual pelo `RichTextEditor`:

- Editor ocupa a area principal (flex-1)
- Painel de tokens dinamicos permanece a direita (w-48)
- Ao clicar num token, insere `{{token}}` na posicao do cursor no editor
- O conteudo e salvo via `onChange("conteudo_final", htmlContent)`

### Persistencia

O conteudo do editor sera salvo no campo `conteudo_final` da tabela `documentos` (coluna ja existente, tipo `text`). O auto-save existente (`useDocumentAutoSave`) ja persiste `formData`, entao basta adicionar a key `conteudo_final` ao formData.

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/pages/Documento.tsx` | Adicionar estado `invalidFields`, logica de validacao visual, passar prop |
| `src/components/documento/StepFormRenderer.tsx` | Receber `invalidFields`, renderizar borda vermelha e mensagem inline, integrar RichTextEditor no Step 8 |
| `src/components/documento/RichTextEditor.tsx` | **Novo** -- editor contentEditable com toolbar de formatacao |

### Arquivos NAO modificados
- `document-sections.ts` -- definicoes permanecem identicas
- `SectionCard.tsx` -- nao usado no fluxo principal do wizard
- Edge Functions -- intactas
- Migracoes SQL -- nenhuma necessaria (coluna `conteudo_final` ja existe)
