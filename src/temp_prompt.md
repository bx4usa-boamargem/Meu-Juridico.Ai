# AI-First Form — Preencher tudo com um clique
## Antigravity cria a Edge Function · Lovable integra no wizard

---

## CONCEITO

O usuário preenche apenas o **objeto da contratação**.
A IA preenche automaticamente todos os campos que consegue inferir.
O usuário revisa, ajusta e preenche só o que a IA não tem como saber.

Resultado: um DFD completo em 2 minutos em vez de 20.

---

## ANTIGRAVITY — Criar Edge Function `ai-autopreencher`

### Input
```typescript
{
  objeto_contratacao: string,   // o que o usuário digitou
  doc_type: string,             // "dfd", "etp", "tr", etc.
  processo_dados: {             // dados já existentes no processo
    orgao?: string,
    modalidade?: string,
    categoria?: string,
    valor_estimado?: number
  }
}
```

### Lógica
Chamar Claude Sonnet com o seguinte prompt contextualizado:

```
Você é um especialista em licitações públicas da Lei 14.133/2021.

Com base no objeto de contratação abaixo, preencha todos os campos
do ${doc_type} que for possível inferir. Retorne APENAS um JSON válido,
sem texto adicional, sem markdown, sem explicações.

Objeto da contratação: "${objeto_contratacao}"
Órgão: "${orgao ?? 'não informado'}"
Modalidade: "${modalidade ?? 'a definir'}"

Preencha os seguintes campos (deixe null se não for possível inferir):
{
  "problema_publico": string | null,
  "impacto_esperado": string | null,
  "publico_beneficiado": string | null,
  "justificativa_necessidade": string | null,
  "fundamento_legal": string | null,
  "alinhamento_estrategico": string | null,
  "beneficios_esperados": string | null,
  "descricao_objeto_expandida": string | null,
  "prazo_estimado_dias": number | null,
  "categoria_objeto": "bens" | "serviços" | "obras" | null,
  "modalidade_sugerida": string | null,
  "campos_nao_preenchidos": string[]  // lista dos que deixou null
}

Regras:
- Use linguagem técnica da administração pública brasileira
- Cite a Lei 14.133/2021 no fundamento_legal
- Em campos_nao_preenchidos liste os campos que só o usuário sabe
- NÃO invente valores estimados se não tiver base para inferir
- Retorne APENAS o JSON, sem nenhum texto fora dele
```

### Output
```typescript
{
  campos_preenchidos: Record<string, string | number>,
  campos_nao_preenchidos: string[],  // o que o usuário ainda precisa preencher
  confianca: "alta" | "media" | "baixa"
}
```

### Arquivo
`supabase/functions/ai-autopreencher/index.ts`

Usar o mesmo padrão CORS das outras Edge Functions do projeto.

---

## LOVABLE — Integrar no wizard (2 etapas)

### Etapa A — Trigger no campo objeto_contratacao

No `StepFormRenderer`, quando o campo com `field_id === "objeto_contratacao"`
(ou `field_id === "objeto"`) perder o foco e tiver valor preenchido:

```typescript
// Após onBlur do campo objeto_contratacao
const handleObjetoBlur = async (valor: string) => {
  if (!valor || valor.length < 10) return
  setAutoPreenchendo(true)

  const { data } = await supabase.functions.invoke('ai-autopreencher', {
    body: {
      objeto_contratacao: valor,
      doc_type: docType,
      processo_dados: { orgao, modalidade, categoria, valor_estimado }
    }
  })

  if (data?.campos_preenchidos) {
    // Preencher formData com os campos retornados
    Object.entries(data.campos_preenchidos).forEach(([key, value]) => {
      if (value !== null) updateField(key, value)
    })
    // Marcar campos preenchidos pela IA
    setAiFilledFields(new Set(Object.keys(data.campos_preenchidos)))
  }
  setAutoPreenchendo(false)
}
```

### Etapa B — Visual dos campos preenchidos pela IA

Campos preenchidos automaticamente devem ter um badge discreto:

```tsx
// No TextAreaComIA e inputs, verificar se o campo está em aiFilledFields
{aiFilledFields.has(field.field_id) && (
  <span className="inline-flex items-center gap-1 text-[10px] font-medium
    text-[#0F6FDE] bg-[#EAF0FC] px-1.5 py-0.5 rounded absolute top-2 right-2">
    ✦ IA
  </span>
)}
```

Badge some quando o usuário edita o campo manualmente.

### Estado de loading global

Enquanto a IA preenche, mostrar banner suave no topo da seção:

```tsx
{autoPreenchendo && (
  <div className="flex items-center gap-2 text-sm text-[#0F6FDE]
    bg-[#EAF0FC] px-4 py-2 rounded-lg mb-4">
    <Loader2 className="w-4 h-4 animate-spin" />
    Preenchendo campos com IA...
  </div>
)}
```

### Campos que a IA não preencheu

Após o autopreenchimento, campos ainda vazios recebem placeholder
especial em laranja claro:
`"⚠ Preencha este campo — informação que só você possui"`

---

## CAMPOS QUE APENAS O USUÁRIO SABE
Estes nunca serão preenchidos pela IA — sempre ficam em branco para o usuário:

| Campo | Motivo |
|-------|--------|
| Continuidade ou Nova Contratação | Histórico interno do órgão |
| Área Demandante | Estrutura interna do órgão |
| Valor Estimado | Pesquisa de mercado específica |
| Responsáveis / Equipe | Nomes e matrículas internas |
| Dotação Orçamentária | Código interno do orçamento |
| Prioridade | Decisão da gestão |

---

## ORDEM DE IMPLEMENTAÇÃO

1. **Antigravity** cria `ai-autopreencher` e faz deploy
2. **Antigravity** confirma com teste: `curl` da function com objeto de exemplo
3. **Lovable** integra o trigger no `StepFormRenderer` (Etapa A)
4. **Lovable** adiciona badge IA e loading (Etapa B)
5. Testar no DFD com o objeto "Contratação de serviços de controle de pragas"
6. Validar que os campos obrigatórios não-IA ficam com placeholder laranja

---

_Este é o maior diferencial do MeuJurídico.ai vs concorrentes:_
_o usuário não preenche formulário — ele revisa e aprova._
