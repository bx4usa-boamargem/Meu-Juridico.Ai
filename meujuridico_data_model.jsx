import { useState } from "react";

const C = {
  bg: "#0A0E1A", surface: "#111827", border: "#1E2A3A",
  accent: "#1B7AAF", bright: "#3AAFCF", dark: "#1A3A5C",
  success: "#10B981", warning: "#F59E0B", danger: "#EF4444",
  text: "#E2E8F0", muted: "#64748B",
};

const tables = [
  {
    layer: "L1 — Tenant",
    color: C.bright,
    tables: [
      {
        name: "orgs",
        desc: "Órgão público — raiz de isolamento (tenant)",
        pk: "id UUID",
        cols: [
          { n: "name", t: "TEXT", note: "Prefeitura de Guarapuava" },
          { n: "slug", t: "TEXT UNIQUE", note: "" },
          { n: "cnpj", t: "TEXT", note: "" },
          { n: "esfera", t: "TEXT", note: "municipal | estadual | federal" },
          { n: "uf", t: "CHAR(2)", note: "" },
          { n: "plan", t: "TEXT", note: "essencial | institucional | enterprise" },
          { n: "plan_expires_at", t: "TIMESTAMPTZ", note: "" },
          { n: "settings", t: "JSONB", note: "Config do órgão" },
        ],
      },
      {
        name: "departments",
        desc: "Departamentos internos (Sec. Saúde, Educação...)",
        pk: "id UUID",
        fks: ["org_id → orgs.id"],
        cols: [
          { n: "org_id", t: "UUID FK", note: "" },
          { n: "name", t: "TEXT", note: "Secretaria de Saúde" },
          { n: "code", t: "TEXT", note: "Código interno" },
          { n: "active", t: "BOOLEAN", note: "" },
        ],
      },
    ],
  },
  {
    layer: "L2 — IAM / RBAC",
    color: "#A78BFA",
    tables: [
      {
        name: "users",
        desc: "Extensão do auth.users com role e org",
        pk: "id UUID → auth.users",
        fks: ["org_id → orgs.id", "department_id → departments.id"],
        cols: [
          { n: "org_id", t: "UUID FK", note: "" },
          { n: "department_id", t: "UUID FK", note: "" },
          { n: "full_name", t: "TEXT", note: "" },
          { n: "cargo", t: "TEXT", note: "Pregoeiro, Sec. TI..." },
          { n: "matricula", t: "TEXT", note: "Matrícula funcional" },
          { n: "role", t: "user_role ENUM", note: "8 papéis distintos", highlight: true },
          { n: "cpf", t: "TEXT", note: "Mascarado: ***.***.**-XX" },
        ],
      },
      {
        name: "process_permissions",
        desc: "Override de role por processo específico",
        pk: "id UUID",
        fks: ["process_id → processes.id", "user_id → users.id"],
        cols: [
          { n: "process_id", t: "UUID FK", note: "" },
          { n: "user_id", t: "UUID FK", note: "" },
          { n: "role", t: "user_role ENUM", note: "Role específica neste processo" },
          { n: "granted_by", t: "UUID FK", note: "" },
          { n: "expires_at", t: "TIMESTAMPTZ", note: "" },
        ],
      },
    ],
  },
  {
    layer: "L3-4 — Processo + Documentos",
    color: C.accent,
    tables: [
      {
        name: "processes",
        desc: "Processo administrativo = conjunto de documentos",
        pk: "id UUID",
        fks: ["org_id → orgs.id", "created_by → users.id"],
        cols: [
          { n: "org_id", t: "UUID FK", note: "" },
          { n: "numero_processo", t: "TEXT", note: "Número administrativo" },
          { n: "objeto", t: "TEXT NOT NULL", note: "Objeto da contratação", highlight: true },
          { n: "tipo_objeto", t: "TEXT", note: "servico | software | material | obra" },
          { n: "dados_base", t: "JSONB", note: "process_context da spec v2.0", highlight: true },
          { n: "valor_estimado", t: "NUMERIC(15,2)", note: "" },
          { n: "modalidade_prevista", t: "TEXT", note: "pregao | concorrencia..." },
          { n: "status", t: "document_status ENUM", note: "" },
          { n: "responsavel_id", t: "UUID FK", note: "" },
        ],
      },
      {
        name: "documents",
        desc: "DFD, ETP, TR, Edital, Contrato... (chain de herança)",
        pk: "id UUID",
        fks: ["process_id → processes.id", "parent_doc_id → documents.id"],
        cols: [
          { n: "process_id", t: "UUID FK", note: "" },
          { n: "doc_type", t: "document_type ENUM", note: "dfd | etp | tr | edital...", highlight: true },
          { n: "version", t: "INTEGER", note: "Versionamento" },
          { n: "parent_doc_id", t: "UUID FK SELF", note: "Herança DFD→ETP→TR", highlight: true },
          { n: "status", t: "document_status ENUM", note: "rascunho→finalizado", highlight: true },
          { n: "current_step", t: "INTEGER", note: "Step atual do wizard" },
          { n: "inherited_data", t: "JSONB", note: "Dados herdados do predecessor", highlight: true },
          { n: "locked", t: "BOOLEAN", note: "Bloqueado durante IA" },
          { n: "document_hash", t: "TEXT", note: "SHA-256 do conteúdo final", highlight: true },
          { n: "pdf_url", t: "TEXT", note: "" },
          { n: "docx_url", t: "TEXT", note: "" },
        ],
      },
    ],
  },
  {
    layer: "L5 — Document Engine",
    color: C.success,
    tables: [
      {
        name: "document_sections",
        desc: "Seção = dados estruturados + texto renderizado + checklist",
        pk: "id UUID",
        fks: ["document_id → documents.id"],
        cols: [
          { n: "section_id", t: "TEXT", note: "'etp_03', 'dfd_01'..." },
          { n: "section_number", t: "TEXT", note: "'1', '1.1', '3.2'" },
          { n: "agent", t: "TEXT", note: "AGENT_LICIT | AGENT_ADMIN...", highlight: true },
          { n: "structured_data", t: "JSONB", note: "Dados do formulário (esquerda)", highlight: true },
          { n: "rendered_content", t: "TEXT", note: "Markdown (preview direito)", highlight: true },
          { n: "rendered_html", t: "TEXT", note: "HTML para preview em tempo real" },
          { n: "status", t: "TEXT", note: "empty→ai_generated→validated" },
          { n: "has_warnings", t: "BOOLEAN", note: "⚠ nas tabs do Figma", highlight: true },
          { n: "checklist", t: "JSONB", note: "[{item, checked, required}]" },
          { n: "validation_report", t: "JSONB", note: "Resultado VALIDATE_SECTION", highlight: true },
          { n: "normative_refs", t: "JSONB", note: "Normas citadas nesta seção" },
          { n: "key_facts", t: "JSONB", note: "Para section_memory da spec" },
          { n: "values_declared", t: "JSONB", note: "Valores numéricos declarados" },
          { n: "depends_on", t: "TEXT[]", note: "Seções predecessoras" },
        ],
      },
      {
        name: "section_requirement_tabs",
        desc: "Tabs horizontais da tela: Necessidades do negócio, Tecnológicos...",
        pk: "id UUID",
        fks: ["section_id → document_sections.id"],
        cols: [
          { n: "tab_key", t: "TEXT", note: "necessidades_negocio | tecnologicos..." },
          { n: "tab_label", t: "TEXT", note: "Label exibido na UI" },
          { n: "order_index", t: "INTEGER", note: "" },
          { n: "is_complete", t: "BOOLEAN", note: "" },
          { n: "has_warnings", t: "BOOLEAN", note: "⚠ visível na tab" },
          { n: "field_data", t: "JSONB", note: "Dados dos campos desta tab" },
        ],
      },
    ],
  },
  {
    layer: "L6 — Workflow",
    color: C.warning,
    tables: [
      {
        name: "workflow_transitions",
        desc: "Histórico de transições de estado (machine de estados)",
        pk: "id UUID",
        fks: ["document_id → documents.id", "performed_by → users.id"],
        cols: [
          { n: "from_status", t: "document_status ENUM", note: "" },
          { n: "to_status", t: "document_status ENUM", note: "" },
          { n: "action", t: "transition_action ENUM", note: "submit | approve | reject..." },
          { n: "comment", t: "TEXT", note: "Obrigatório em rejeições" },
          { n: "is_rejection", t: "BOOLEAN", note: "" },
          { n: "performed_by", t: "UUID FK", note: "" },
          { n: "notified_users", t: "UUID[]", note: "" },
        ],
      },
      {
        name: "approval_instances",
        desc: "Instâncias de aprovação por documento e step",
        pk: "id UUID",
        fks: ["document_id → documents.id", "step_id → approval_steps.id"],
        cols: [
          { n: "assigned_to", t: "UUID FK", note: "" },
          { n: "status", t: "TEXT", note: "pending | approved | rejected | skipped" },
          { n: "comment", t: "TEXT", note: "" },
          { n: "deadline", t: "TIMESTAMPTZ", note: "" },
        ],
      },
    ],
  },
  {
    layer: "L7-8 — IA + Pesquisa de Preços",
    color: "#F472B6",
    tables: [
      {
        name: "ai_jobs",
        desc: "Jobs assíncronos: improve, validate, suggest, export...",
        pk: "id UUID",
        fks: ["document_id → documents.id", "section_id → document_sections.id"],
        cols: [
          { n: "job_type", t: "TEXT", note: "improve|validate|suggest|plan|export...", highlight: true },
          { n: "execution_stage", t: "TEXT", note: "PLAN|GENERATE|VALIDATE|CONSOLIDATE", highlight: true },
          { n: "agent", t: "TEXT", note: "Agente responsável" },
          { n: "status", t: "ai_job_status ENUM", note: "pending→running→completed|failed" },
          { n: "input_payload", t: "JSONB", note: "Input para a Edge Function" },
          { n: "output_payload", t: "JSONB", note: "Output da IA" },
          { n: "llm_model", t: "TEXT", note: "claude-sonnet-4-20250514" },
          { n: "cost_usd", t: "NUMERIC(10,6)", note: "Custo por job", highlight: true },
          { n: "retry_count", t: "INTEGER", note: "Max 2 (spec)" },
        ],
      },
      {
        name: "price_researches",
        desc: "Pesquisa de preços — sem evidência registrada não vale",
        pk: "id UUID",
        fks: ["document_id → documents.id"],
        cols: [
          { n: "source_type", t: "TEXT", note: "pncp | comprasgov | manual | cotacao", highlight: true },
          { n: "source_url", t: "TEXT", note: "" },
          { n: "source_ref", t: "TEXT", note: "Número do processo PNCP" },
          { n: "item_description", t: "TEXT NOT NULL", note: "" },
          { n: "unit_price", t: "NUMERIC(15,2)", note: "" },
          { n: "supplier_cnpj", t: "TEXT", note: "" },
          { n: "is_valid", t: "BOOLEAN", note: "" },
          { n: "excluded_reason", t: "TEXT", note: "Motivo de exclusão" },
        ],
      },
    ],
  },
  {
    layer: "L9 — Audit Log",
    color: C.danger,
    tables: [
      {
        name: "audit_logs",
        desc: "Quem / quando / o quê / por quê — imutável, TCU-ready",
        pk: "id BIGSERIAL",
        fks: ["document_id → documents.id", "user_id → users.id"],
        cols: [
          { n: "user_id", t: "UUID FK", note: "Quem" },
          { n: "user_role", t: "user_role ENUM", note: "Role no momento da ação" },
          { n: "action", t: "TEXT NOT NULL", note: "section.edited | doc.approved | ai.improve...", highlight: true },
          { n: "entity_type", t: "TEXT", note: "document | section | user..." },
          { n: "old_value", t: "JSONB", note: "Estado anterior" },
          { n: "new_value", t: "JSONB", note: "Estado novo" },
          { n: "diff", t: "JSONB", note: "Diff calculado" },
          { n: "reason", t: "TEXT", note: "Obrigatório em aprovações/rejeições" },
          { n: "ip_address", t: "INET", note: "" },
          { n: "created_at", t: "TIMESTAMPTZ", note: "Imutável — sem UPDATE/DELETE" },
        ],
      },
    ],
  },
];

const enums = [
  { name: "document_type", values: ["dfd","etp","tr","edital","contrato","parecer_juridico","portaria_designacao"] },
  { name: "document_status", values: ["rascunho","em_elaboracao","em_revisao","em_ajuste","aprovado","finalizado","arquivado"] },
  { name: "user_role", values: ["admin_org","demandante","planejamento","juridico","controle_interno","gestor_contrato","autoridade_competente","visualizador"] },
  { name: "ai_job_status", values: ["pending","running","completed","failed","cancelled"] },
  { name: "transition_action", values: ["submit_for_review","request_adjustment","approve","finalize","archive","reopen"] },
];

const TableCard = ({ table, layerColor }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      backgroundColor: C.surface,
      border: `1px solid ${open ? layerColor + "66" : C.border}`,
      borderLeft: `3px solid ${layerColor}`,
      borderRadius: 8,
      marginBottom: 8,
      overflow: "hidden",
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "10px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: layerColor }}>
            {table.name}
          </span>
          <span style={{ fontSize: 11, color: C.muted }}>{table.desc}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: C.muted }}>{table.cols.length} cols</span>
          <span style={{ color: C.muted, fontSize: 12 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "0 0 8px" }}>
          {/* PK */}
          <div style={{ padding: "6px 14px", backgroundColor: "#0D111E" }}>
            <span style={{ fontSize: 11, color: C.warning, fontFamily: "monospace" }}>PK</span>
            <span style={{ fontSize: 11, color: C.text, marginLeft: 8, fontFamily: "monospace" }}>{table.pk}</span>
          </div>
          {/* FKs */}
          {table.fks?.map((fk, i) => (
            <div key={i} style={{ padding: "4px 14px", backgroundColor: "#0D111E" }}>
              <span style={{ fontSize: 11, color: "#A78BFA", fontFamily: "monospace" }}>FK</span>
              <span style={{ fontSize: 11, color: C.muted, marginLeft: 8, fontFamily: "monospace" }}>{fk}</span>
            </div>
          ))}
          {/* Cols */}
          {table.cols.map((col, i) => (
            <div key={i} style={{
              padding: "5px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderTop: `1px solid ${C.border}`,
              backgroundColor: col.highlight ? C.accent + "11" : "transparent",
            }}>
              <span style={{
                fontFamily: "monospace", fontSize: 12,
                color: col.highlight ? C.bright : C.text,
                minWidth: 180,
              }}>{col.n}</span>
              <span style={{
                fontFamily: "monospace", fontSize: 11,
                color: C.warning, minWidth: 160,
              }}>{col.t}</span>
              {col.note && (
                <span style={{ fontSize: 11, color: C.muted }}>{col.note}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function DataModel() {
  const [activeLayer, setActiveLayer] = useState(null);
  const [showEnums, setShowEnums] = useState(false);

  const filtered = activeLayer === null
    ? tables
    : tables.filter(l => l.layer === activeLayer);

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", backgroundColor: C.bg, color: C.text, minHeight: "100vh", padding: "0 0 48px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0D1B2E, #0A0E1A)", borderBottom: `1px solid ${C.border}`, padding: "20px 28px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, marginBottom: 4 }}>
          MeuJurídico.ai · Data Model v1.0
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "#fff", fontFamily: "system-ui" }}>
          Supabase Schema — PostgreSQL + RLS
        </h1>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
          13 tabelas · 9 layers · Tenant por Órgão · Baseado em LLM Spec v2.0 + Lei 14.133/2021
        </p>
      </div>

      {/* Tenant Decision */}
      <div style={{ margin: "16px 28px 0", backgroundColor: "#0D1B2E", border: `1px solid ${C.accent}`, borderLeft: `4px solid ${C.accent}`, borderRadius: 8, padding: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: "0.1em" }}>DECISÃO DE TENANT MODEL · </span>
        <span style={{ fontSize: 12, color: C.text }}>
          <strong>Órgão = tenant raiz</strong> → Departamento → Usuário → Processo → Documento.
          Lei 14.133 exige segregação por unidade administrativa — um servidor de Saúde não pode ver o processo de Educação. RLS por org_id em todas as tabelas.
        </span>
      </div>

      {/* Layer Filter */}
      <div style={{ padding: "16px 28px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setActiveLayer(null)} style={{
          padding: "5px 12px", borderRadius: 6, border: `1px solid ${activeLayer === null ? C.bright : C.border}`,
          backgroundColor: activeLayer === null ? C.bright + "22" : "transparent",
          color: activeLayer === null ? C.bright : C.muted,
          cursor: "pointer", fontSize: 11, fontWeight: 600,
        }}>Todos</button>
        {tables.map(l => (
          <button key={l.layer} onClick={() => setActiveLayer(l.layer === activeLayer ? null : l.layer)} style={{
            padding: "5px 12px", borderRadius: 6,
            border: `1px solid ${activeLayer === l.layer ? l.color : C.border}`,
            backgroundColor: activeLayer === l.layer ? l.color + "22" : "transparent",
            color: activeLayer === l.layer ? l.color : C.muted,
            cursor: "pointer", fontSize: 11, fontWeight: 600,
          }}>{l.layer}</button>
        ))}
        <button onClick={() => setShowEnums(!showEnums)} style={{
          padding: "5px 12px", borderRadius: 6,
          border: `1px solid ${showEnums ? C.warning : C.border}`,
          backgroundColor: showEnums ? C.warning + "22" : "transparent",
          color: showEnums ? C.warning : C.muted,
          cursor: "pointer", fontSize: 11, fontWeight: 600, marginLeft: "auto",
        }}>ENUMS {showEnums ? "▲" : "▼"}</button>
      </div>

      {/* Enums */}
      {showEnums && (
        <div style={{ margin: "12px 28px 0", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
          {enums.map(e => (
            <div key={e.name} style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.warning, fontFamily: "monospace", marginBottom: 8 }}>
                ENUM {e.name}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {e.values.map(v => (
                  <span key={v} style={{
                    fontSize: 10, padding: "2px 6px", borderRadius: 4,
                    backgroundColor: C.border, color: C.text, fontFamily: "monospace",
                  }}>{v}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tables */}
      <div style={{ padding: "16px 28px 0" }}>
        {filtered.map(layer => (
          <div key={layer.layer} style={{ marginBottom: 20 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
              paddingBottom: 6, borderBottom: `1px solid ${layer.color}44`,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: layer.color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: layer.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {layer.layer}
              </span>
            </div>
            {layer.tables.map(t => (
              <TableCard key={t.name} table={t} layerColor={layer.color} />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ margin: "8px 28px 0", padding: 14, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", marginBottom: 6 }}>STACK DECISION</div>
        <div style={{ fontSize: 11, color: C.text, lineHeight: 1.7 }}>
          <span style={{ color: C.bright }}>Orquestrador:</span> Supabase Edge Functions (não Vertex AI) ·{" "}
          <span style={{ color: C.bright }}>LLM Engine:</span> Claude API (claude-sonnet-4-20250514) ·{" "}
          <span style={{ color: C.bright }}>RLS:</span> Por org_id em todas as tabelas ·{" "}
          <span style={{ color: C.bright }}>Vector search:</span> pgvector para RAG ·{" "}
          <span style={{ color: C.bright }}>Audit:</span> audit_logs imutável (sem UPDATE/DELETE)
        </div>
      </div>
    </div>
  );
}
