import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { McTheme, getModelColor, getModelShortName, formatBrl } from "./types";

export function AgentsTab({ mc }: { mc: McTheme }) {
  const { data: agentData } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_usage_log")
        .select("modelo_utilizado, tipo_documento, tokens_input, tokens_output, custo_usd, foi_fallback, duracao_ms, created_at");
      if (!data) return { agents: [], chart: [] };

      const map = new Map<string, any>();
      data.forEach((r) => {
        const key = `${r.modelo_utilizado}|${r.tipo_documento || "geral"}`;
        if (!map.has(key)) {
          map.set(key, { modelo: r.modelo_utilizado, tipo: r.tipo_documento || "geral", total: 0, tokens: 0, custo: 0, fallbacks: 0, duracao: 0 });
        }
        const v = map.get(key)!;
        v.total++;
        v.tokens += (r.tokens_input || 0) + (r.tokens_output || 0);
        v.custo += Number(r.custo_usd || 0);
        v.fallbacks += r.foi_fallback ? 1 : 0;
        v.duracao += r.duracao_ms || 0;
      });

      // Chart: daily usage per top 3 models
      const modelCounts = new Map<string, number>();
      data.forEach(r => modelCounts.set(r.modelo_utilizado, (modelCounts.get(r.modelo_utilizado) || 0) + 1));
      const topModels = Array.from(modelCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
      const dayMap = new Map<string, Record<string, number>>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        const entry: Record<string, number> = {};
        topModels.forEach(m => entry[getModelShortName(m)] = 0);
        dayMap.set(d, entry);
      }
      data.filter(r => new Date(r.created_at) >= thirtyDaysAgo && topModels.includes(r.modelo_utilizado)).forEach(r => {
        const d = r.created_at.slice(0, 10);
        if (dayMap.has(d)) dayMap.get(d)![getModelShortName(r.modelo_utilizado)]++;
      });

      return {
        agents: Array.from(map.values()).sort((a, b) => b.total - a.total),
        chart: Array.from(dayMap.entries()).map(([date, v]) => ({ date: date.slice(5), ...v })),
        topModels: topModels.map(m => ({ name: getModelShortName(m), color: getModelColor(m) })),
      };
    },
  });

  const agents = agentData?.agents ?? [];
  const chartData = agentData?.chart ?? [];
  const topModels = (agentData as any)?.topModels ?? [];

  return (
    <div className="space-y-6">
      {/* Agent cards */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {agents.slice(0, 6).map((a, i) => (
          <div key={i} className="rounded-xl p-4 border" style={{ background: mc.card, borderColor: mc.border }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-3 w-3 rounded-full" style={{ background: getModelColor(a.modelo) }} />
              <span className="text-xs font-semibold">{getModelShortName(a.modelo)}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded uppercase" style={{ background: `${mc.accent}20`, color: mc.accent }}>{a.tipo}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div><p style={{ color: mc.muted }}>Total</p><p className="font-mono font-bold">{a.total}</p></div>
              <div><p style={{ color: mc.muted }}>Tokens</p><p className="font-mono">{(a.tokens / 1000000).toFixed(1)}M</p></div>
              <div><p style={{ color: mc.muted }}>Custo</p><p className="font-mono">{formatBrl(a.custo)}</p></div>
              <div><p style={{ color: mc.muted }}>Fallbacks</p><p className="font-mono">{a.fallbacks}</p></div>
              <div><p style={{ color: mc.muted }}>Tempo Méd.</p><p className="font-mono">{a.total ? (a.duracao / a.total / 1000).toFixed(1) : 0}s</p></div>
              <div><p style={{ color: mc.muted }}>Status</p><p style={{ color: mc.green }}>🟢 Ativo</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: mc.card, borderColor: mc.border }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: mc.border }}>
          <h3 className="text-sm font-semibold">Produção Detalhada</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${mc.border}`, color: mc.muted }}>
                <th className="text-left px-4 py-2.5 font-medium">Agente</th>
                <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
                <th className="text-right px-4 py-2.5 font-medium">Total</th>
                <th className="text-right px-4 py-2.5 font-medium">Tokens</th>
                <th className="text-right px-4 py-2.5 font-medium">Custo BRL</th>
                <th className="text-right px-4 py-2.5 font-medium">Fallbacks</th>
                <th className="text-right px-4 py-2.5 font-medium">Tempo Méd.</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${mc.border}` }}>
                  <td className="px-4 py-2.5"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: getModelColor(a.modelo) }} /><span className="font-medium">{getModelShortName(a.modelo)}</span></div></td>
                  <td className="px-4 py-2.5 uppercase">{a.tipo}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{a.total}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{(a.tokens / 1000000).toFixed(1)}M</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatBrl(a.custo)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{a.fallbacks}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{a.total ? (a.duracao / a.total / 1000).toFixed(1) : 0}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage timeline chart */}
      {topModels.length > 0 && (
        <div className="rounded-xl p-5 border" style={{ background: mc.card, borderColor: mc.border }}>
          <h3 className="text-sm font-semibold mb-4">Uso por Agente — últimos 30 dias</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={mc.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: mc.muted }} />
              <YAxis tick={{ fontSize: 10, fill: mc.muted }} />
              <Tooltip contentStyle={{ background: mc.card, border: `1px solid ${mc.border}`, borderRadius: 8, color: mc.text }} />
              {topModels.map((m: any) => (
                <Area key={m.name} type="monotone" dataKey={m.name} stroke={m.color} fill={m.color} fillOpacity={0.1} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
