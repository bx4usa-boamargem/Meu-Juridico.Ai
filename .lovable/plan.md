

## Sprint 2 — UI Plan

### Current State Assessment

After thorough code review, here's what already exists and what's missing:

| Task | Status | Notes |
|------|--------|-------|
| T1 — Section form in center area | **Already works** | `StepFormRenderer` renders fields, `Documento.tsx` wires it all up |
| T2 — "Criar Documento" button | **Already works** | `handleNext` on last step calls `orchestrate_document` edge function |
| T3 — Export DOCX button | **Missing** | No export button exists |
| T4 — Type selection screen | **Already works** | `SelecionarTipoDocumento.tsx` exists with route `/processo/:processoId/novo-documento` |
| T5 — Filters in Documentos | **Already works** | `Documentos.tsx` has filter pills for all 7 types |
| T6 — Monitoring panel | **Already works** | `MonitoramentoPanel.tsx` is full-featured with config, alerts, scope, drawer |
| T7 — Sidebar toggles | **Partially works** | Toggles fire `onToggleStep` which updates workflow state, but required sections can still be toggled off |

### What Actually Needs Fixing

Only **3 items** require changes:

---

### 1. Disable toggles for required sections (T7 fix)

**File**: `src/components/documento/DocumentStepSidebar.tsx`

The `Switch` is always enabled. For sections with `required: true`, the toggle should be disabled (locked ON).

- Pass `section.required` to disable the Switch
- Add visual indicator (lock icon or disabled state)

---

### 2. Add DOCX export button (T3 — stub until Antigravity confirms B2)

**File**: `src/pages/Documento.tsx` (or `DocumentView.tsx`)

Add a download button visible when `documento.status === 'gerado'` or `'aprovado'`. For now, invoke `export_docx` edge function. Show button in the DocumentMetaBar or footer area.

- Add "Exportar DOCX" button with `Download` icon
- Call `supabase.functions.invoke('export_docx', { body: { document_id: docId } })`
- Handle blob download
- Show only when document has generated content

---

### 3. Add conformity score badge after generation (T2 enhancement)

**File**: `src/pages/Documento.tsx` or `DocumentMetaBar.tsx`

After `orchestrate_document` returns, if the response includes a `score`, display a colored badge in the header:
- `> 0.8` → green
- `0.6–0.8` → yellow  
- `< 0.6` → red

---

### Implementation Order

1. Fix sidebar toggles for required sections (quick, isolated)
2. Add DOCX export button (stub, ready for Antigravity)
3. Add conformity score display (minor UI addition)

### What Will NOT Be Changed

- Header, footer, sidebar layout
- `StepFormRenderer`, `DocumentStepSidebar` structure
- `SelecionarTipoDocumento` page (already correct)
- `Documentos` filters (already correct)
- `MonitoramentoPanel` (already complete)
- Edge Functions
- Existing Configurações tabs

