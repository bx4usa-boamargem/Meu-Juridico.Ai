

# Ajuste Visual do Document Workspace para Fidelidade ao Figma

## Problema
O Document Workspace funciona e renderiza corretamente, mas o visual dos componentes internos nao esta alinhado com o Figma. Os principais desvios sao no layout dos campos (coluna unica vs grid), ausencia de sub-secoes com cards agrupados, falta de contadores de caracteres, e o step de Visualizacao que deveria ter um editor de texto rico com dados dinamicos.

## Mudancas Planejadas

### 1. StepFormRenderer -- Layout de campos em grid 2 colunas
- Campos curtos (text, date, select) renderizados lado a lado em grid de 2 colunas
- Campos textarea ocupam largura total (col-span-2)
- Adicionar contador de caracteres nos textareas (ex: "0/200")
- Texto do banner "Informacao importante" atualizado para: "Antes de editar o documento, confira as todas as informacoes abaixo e certifique-se que esta editando o documento correto, pois as alteracoes serao salvas automaticamente."

### 2. StepFormRenderer -- Sub-secao "Informacoes basicas" com card agrupado
- Quando existem campos herdados/readOnly numa secao, agrupa-los dentro de um card com borda, contendo header "Informacoes basicas" e callout "Preenchimento automatico - Dados obtidos durante a construcao do ETP"
- Campos herdados dentro do card em layout grid (Numero do processo, Orgao, Categoria lado a lado)
- Campos editaveis ficam fora do card

### 3. DocumentStepSidebar -- Ajuste visual dos step items
- O item ativo deve ter fundo azul claro com borda esquerda azul (como no Figma, o card selecionado tem fundo highlight)
- Icone de documento (FileText) em todos os steps (nao Lock para os desbloqueados)
- Remover o contador "X/Y campos" do sidebar (simplificar como no Figma)

### 4. DocumentMetaBar -- Alinhar com Figma
- Lado esquerdo: Titulo do documento + icone editar + icone hamburger (menu)
- Texto "Data da ultima alteracao" com data formatada
- "Editado por" com avatar e nome
- "Status" com badge colorida (laranja para Rascunho)
- Manter botoes "Sair" e "Criar documento" a direita

### 5. Secao "Informacoes gerais" -- Campos atualizados
- Adicionar campo "Data da conclusao da contratacao" (type: date)
- Adicionar campo "Area requisitante" (type: select, placeholder "Selecione o ETP")
- Adicionar campo "Descricao sucinta do objeto" (type: textarea com Melhorar e 0/200)
- Adicionar campo "Prioridade" (type: select, opcoes Alto/Medio/Baixo)
- Adicionar campo "Justificativa da prioridade" (type: textarea com Melhorar)

### 6. Step "Visualizacao" -- Placeholder de editor rico
- Ao inves de mostrar um resumo read-only simples, mostrar um placeholder visual indicando que o editor de texto rico estara disponivel em breve
- Incluir area de "Dados dinamicos" na lateral direita com tokens copiaveis (numero_processo, orgao, etc.)

## Detalhes Tecnicos

### Arquivos afetados

| Arquivo | Acao |
|---------|------|
| `src/components/documento/StepFormRenderer.tsx` | Refatorar layout para grid 2 colunas, adicionar sub-secao agrupada, contadores |
| `src/components/documento/DocumentStepSidebar.tsx` | Ajustar estilo do item ativo e icones |
| `src/components/documento/DocumentMetaBar.tsx` | Reformatar para match Figma (data, editado por, status) |
| `src/lib/document-sections.ts` | Atualizar campos da secao "informacoes_gerais" e adicionar maxLength nos FieldDef |
| `src/pages/Documento.tsx` | Ajustes menores no header da secao (remover "SESSAO: X DE Y" e usar "Sessao: {label}") |

### Mudanca no FieldDef (document-sections.ts)
- Adicionar propriedade opcional `maxLength?: number` para suportar contadores
- Adicionar propriedade opcional `colspan?: number` para controlar layout grid
- Adicionar propriedade opcional `group?: string` para agrupar campos em sub-secoes

### Nenhuma mudanca em:
- Rotas (App.tsx)
- Banco de dados / RPCs
- Edge Functions
- Autenticacao
- DocumentLayout
- Logica de workflow/autosave

