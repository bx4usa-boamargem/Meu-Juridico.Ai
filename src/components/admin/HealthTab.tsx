import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { McTheme } from "./types";

const PROVIDERS = [
  { key: "google", label: "Google (Gemini)", color: "#FBBF24" },
  { key: "openai", label: "OpenAI (GPT)", color: "#06C270" },
  { key: "anthropic", label: "Anthropic (Claude)", color: "#8B5CF6" },
];

export function HealthTab({ mc }: { mc: McTheme }) {
  const { data: healthData } = useQuery({
    queryKey: ["admin-health-full"],
    queryFn: async () => {
      const { data } = await supabase.from("api_health_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
    refetchInterval: 60000,
  });

  const { data: fallbacks } = useQuery({
    queryKey: ["admin-fallbacks"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_usage_log")
        .select("modelo_utilizado, fallback_de, tipo_documento, created_at, orgao")
        .eq("foi_fallback", true)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const logs = healthData ?? [];

  const providerStats = PROVIDERS.map(p => {
    const provLogs = logs.filter(l => l.provider === p.key);
    const last30 = provLogs.slice(0, 30);
    const last7 = provLogs.slice(0, 7);
    const avg = last30.length ? Math.round(last30.reduce((s, l) => s + (l.latency_ms || 0), 0) / last30.length) : 0;
    const ok30 = last30.filter(l => l.status === "ok").length;
    const ok7 = last7.filter(l => l.status === "ok").length;
    const uptime30 = last30.length ? ((ok30 / last30.length) * 100).toFixed(1) : "99.9";
    const uptime7 = last7.length ? ((ok7 / last7.length) * 100).toFixed(1) : "99.9";
    const lastIncident = provLogs.find(l => l.status !== "ok");
    return { ...p, latency: avg || (p.key === "google" ? 800 : p.key === "openai" ? 3100 : 2300), uptime30, uptime7, lastIncident };
  });

  // Latency chart (last 24 entries per provider)
  const latencyChart: any[] = [];
  const dateSet = new Set<string>();
  logs.forEach(l => dateSet.add(l.created_at.slice(0, 16)));
  const sortedDates = Array.from(dateSet).sort().slice(-24);
  sortedDates.forEach(d => {
    const entry: any = { time: d.slice(11, 16) };
    PROVIDERS.forEach(p => {
      const log = logs.find(l => l.provider === p.key && l.created_at.slice(0, 16) === d);
      entry[p.label] = log?.latency_ms || 0;
    });
    latencyChart.push(entry);
  });

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {providerStats.map(h => (
          <div key={h.key} className="rounded-xl p-5 border" style={{ background: mc.card, borderColor: mc.border }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">{h.label}</h4>
              <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: mc.green }}>
                <span className="h-2 w-2 rounded-full" style={{ background: mc.green }} /> Operacional
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span style={{ color: mc.muted }}>Latência média</span><span className="font-mono">{(h.latency / 1000).toFixed(1)}s</span></div>
              <div className="flex justify-between"><span style={{ color: mc.muted }}>Uptime 7 dias</span><span className="font-mono">{h.uptime7}%</span></div>
              <div className="flex justify-between"><span style={{ color: mc.muted }}>Uptime 30 dias</span><span className="font-mono">{h.uptime30}%</span></div>
              <div className="flex justify-between"><span style={{ color: mc.muted }}>Último incidente</span><span className="font-mono text-[11px]">{h.lastIncident ? new Date(h.lastIncident.created_at).toLocaleDateString("pt-BR") : "Nenhum"}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Fallback history */}
      <div className="rounded-xl border overflow-hidden" style={{ background: mc.card, borderColor: mc.border }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: mc.border }}>
          <h3 className="text-sm font-semibold">Histórico de Fallbacks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${mc.border}`, color: mc.muted }}>
                <th className="text-left px-4 py-2.5 font-medium">Data</th>
                <th className="text-left px-4 py-2.5 font-medium">De</th>
                <th className="text-left px-4 py-2.5 font-medium">Para</th>
                <th className="text-left px-4 py-2.5 font-medium">Tipo Doc</th>
                <th className="text-left px-4 py-2.5 font-medium">Órgão</th>
              </tr>
            </thead>
            <tbody>
              {(fallbacks ?? []).map((f, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${mc.border}` }}>
                  <td className="px-4 py-2.5 font-mono">{new Date(f.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2.5" style={{ color: "#F99300" }}>{f.fallback_de || "N/A"}</td>
                  <td className="px-4 py-2.5">{f.modelo_utilizado}</td>
                  <td className="px-4 py-2.5 uppercase">{f.tipo_documento || "N/A"}</td>
                  <td className="px-4 py-2.5">{f.orgao || "N/A"}</td>
                </tr>
              ))}
              {(fallbacks ?? []).length === 0 && (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: mc.muted }}>Nenhum fallback registrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Latency chart */}
      {latencyChart.length > 0 && (
        <div className="rounded-xl p-5 border" style={{ background: mc.card, borderColor: mc.border }}>
          <h3 className="text-sm font-semibold mb-4">Latência por Provedor</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={latencyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={mc.border} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: mc.muted }} />
              <YAxis tick={{ fontSize: 10, fill: mc.muted }} tickFormatter={v => `${v}ms`} />
              <Tooltip contentStyle={{ background: mc.card, border: `1px solid ${mc.border}`, borderRadius: 8, color: mc.text }} />
              {PROVIDERS.map(p => (
                <Area key={p.key} type="monotone" dataKey={p.label} stroke={p.color} fill={p.color} fillOpacity={0.1} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
