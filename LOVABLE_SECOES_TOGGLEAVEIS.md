# Seções opcionais com toggle no wizard de documentos

## Contexto

O mesmo documento (DFD, ETP, TR) precisa servir desde uma prefeitura pequena
até um Ministério federal. A solução não é ter múltiplos modelos — é dar ao
usuário o poder de ativar ou desativar seções opcionais antes de preencher.

---

## Comportamento esperado

Na sidebar do wizard, cada seção deve ter um indicador visual de obrigatória
ou opcional. Seções opcionais têm um toggle ao lado do nome.

**Toggle ON** (padrão para opcionais): seção aparece no wizard e no documento final.
**Toggle OFF**: seção some do wizard e não aparece no documento gerado.

Seções obrigatórias por lei não têm toggle — aparecem sempre com ícone de
cadeado indicando que não podem ser removidas.

---

## Visual na sidebar

```
✦ Informações Básicas          🔒  ← obrigatória, sem toggle
✦ Necessidades                 🔒
✦ Solução                      🔒
✦ Benefícios esperados         ●—  ← opcional, toggle ON
✦ Vinculação/Dependência       ●—  ← opcional, toggle ON  
✦ Alinhamento Estratégico       —○  ← opcional, toggle OFF (seção oculta)
✦ Recursos Orçamentários       ●—
✦ Responsáveis                 🔒
```

Toggle ativo: bg `#0F6FDE`, bolinha direita
Toggle inativo: bg `#E2E8F0`, bolinha esquerda
Ícone cadeado: `🔒` em cinza claro, sem interação

---

## Implementação

### 1. Adicionar `optional: boolean` ao `SectionDef`

```ts
// document-sections.ts
interface SectionDef {
  id: string
  label: string
  required: boolean   // true = obrigatória por lei, sem toggle
  optional?: boolean  // true = pode ser desativada pelo usuário
  fields: FieldDef[]
  condition?: { field: string; value: string }
}
```

### 2. Estado de seções ativas no `Documento.tsx`

```ts
// Inicializar com todas as opcionais ativas por padrão
const [disabledSections, setDisabledSections] = useState<Set<string>>(new Set())

const toggleSection = (sectionId: string) => {
  setDisabledSections(prev => {
    const next = new Set(prev)
    next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId)
    return next
  })
}

// Filtrar seções para o wizard
const activeSections = sections.filter(s => {
  if (s.condition && formData[s.condition.field] !== s.condition.value) return false
  if (s.optional && disabledSections.has(s.id)) return false
  return true
})
```

### 3. Toggle na sidebar (`DocumentStepSidebar.tsx`)

Para cada item de seção opcional, renderizar ao lado do nome:

```tsx
{section.optional && (
  <button
    onClick={(e) => { e.stopPropagation(); onToggleSection(section.id) }}
    className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5
      ${isDisabled ? 'bg-[#E2E8F0]' : 'bg-[#0F6FDE]'}`}
    title={isDisabled ? 'Ativar seção' : 'Desativar seção'}
  >
    <span className={`w-3 h-3 bg-white rounded-full transition-transform
      ${isDisabled ? 'translate-x-0' : 'translate-x-4'}`} />
  </button>
)}
{!section.optional && (
  <span className="text-[#C0C0C0] text-xs" title="Seção obrigatória por lei">🔒</span>
)}
```

### 4. Passar `disabledSections` para o gerador de documento

Ao chamar `orchestrate_document`, incluir quais seções foram desativadas:

```ts
body: {
  doc_id: docId,
  doc_type: documento?.tipo,
  form_data: formData,
  generate_with_ai: true,
  disabled_sections: Array.from(disabledSections)  // ← novo campo
}
```

O backend já filtra seções com `condition` — aplicar o mesmo filtro
para `disabled_sections` antes de gerar o conteúdo de cada seção.

---

## Seções obrigatórias vs opcionais no DFD

| Seção | Status | Base legal |
|-------|--------|------------|
| Identificação da Área Requisitante | 🔒 Obrigatória | Decreto 10.947/2022 Art. 8º |
| Justificativa da Necessidade | 🔒 Obrigatória | Art. 8º, inciso I |
| Descrição do Objeto | 🔒 Obrigatória | Art. 8º, inciso II |
| Estimativa de Quantidades e Valor | 🔒 Obrigatória | Art. 8º, incisos III e IV |
| Data e Prioridade | 🔒 Obrigatória | Art. 8º, incisos V e VI |
| Benefícios Esperados | 🔒 Obrigatória | Art. 8º, inciso VIII |
| Vinculação ou Dependência | ● Opcional | Art. 8º, inciso VII |
| Alinhamento Estratégico | ● Opcional | Boa prática |
| Fundamento Legal | ● Opcional | Boa prática |
| Recursos Orçamentários | ● Opcional | Boa prática |
| Responsáveis e Encaminhamento | 🔒 Obrigatória | Art. 11 Decreto 10.947/2022 |

---

## Resultado esperado

Uma prefeitura pequena desativa 4 seções opcionais → documento limpo
com 7 seções essenciais, gerado pela IA sem conteúdo desnecessário.

Um Ministério federal mantém tudo ativo → documento completo com 11 seções,
cada uma gerada com profundidade pela IA.

O mesmo wizard, o mesmo modelo, o mesmo backend.

Confirme qual arquivo controla a sidebar para eu validar antes de alterar.
