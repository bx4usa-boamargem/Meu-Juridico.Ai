import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";
import { McTheme } from "./types";
import { toast } from "sonner";

const DATA_TYPES = [
  { key: "usage", label: "Chamadas de IA (ai_usage_log)" },
  { key: "docs", label: "Documentos" },
  { key: "orgs", label: "Órgãos (org_settings)" },
  { key: "health", label: "Saúde das APIs" },
];

export function ExportTab({ mc }: { mc: McTheme }) {
  const [days, setDays] = useState(30);
  const [dataType, setDataType] = useState("usage");
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      let data: any[] = [];

      if (dataType === "usage") {
        const { data: d } = await supabase.from("ai_usage_log").select("*").gte("created_at", since).order("created_at", { ascending: false });
        data = d ?? [];
      } else if (dataType === "docs") {
        const { data: d } = await supabase.from("documentos").select("id, tipo, status, created_at, processo_id").gte("created_at", since);
        data = d ?? [];
      } else if (dataType === "orgs") {
        const { data: d } = await supabase.from("org_settings").select("*");
        data = d ?? [];
      } else if (dataType === "health") {
        const { data: d } = await supabase.from("api_health_log").select("*").gte("created_at", since).order("created_at", { ascending: false });
        data = d ?? [];
      }

      if (data.length === 0) { toast.info("Sem dados para exportar"); setLoading(false); return; }

      const headers = Object.keys(data[0]);
      const csv = [headers.join(","), ...data.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_${dataType}_${days}d_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Relatório exportado com sucesso!");
    } catch (e) {
      toast.error("Erro ao exportar");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-xl p-6 border" style={{ background: mc.card, borderColor: mc.border }}>
        <h3 className="text-sm font-semibold mb-6">Exportar Dados</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs block mb-1.5" style={{ color: mc.muted }}>Período</label>
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              className="w-full text-sm rounded-md px-3 py-2 border"
              style={{ background: mc.bg, borderColor: mc.border, color: mc.text }}>
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
              <option value={365}>Último ano</option>
            </select>
          </div>

          <div>
            <label className="text-xs block mb-1.5" style={{ color: mc.muted }}>Dados</label>
            <select value={dataType} onChange={e => setDataType(e.target.value)}
              className="w-full text-sm rounded-md px-3 py-2 border"
              style={{ background: mc.bg, borderColor: mc.border, color: mc.text }}>
              {DATA_TYPES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg text-white transition-opacity"
            style={{ background: mc.accent, opacity: loading ? 0.6 : 1 }}
          >
            <Download className="h-4 w-4" />
            {loading ? "Exportando..." : "Gerar Relatório (CSV)"}
          </button>
        </div>
      </div>
    </div>
  );
}
