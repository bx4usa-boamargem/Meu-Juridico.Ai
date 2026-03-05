import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip
} from "recharts";
import { McTheme, formatBrl, getProviderFromModel, getModelShortName } from "./types";

const PROVIDER_COLORS: Record<string, string> = {
  google: "#FBBF24",
  openai: "#06C270",
  anthropic: "#8B5CF6",
  other: "#6B7588",
};

export function CostsTab({ mc }: { mc: McTheme }) {
  const { data: usageData } = useQuery({
    queryKey: ["admin-costs-all"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_usage_log").select("modelo_utilizado, custo_usd, orgao, tokens_input, tokens_output, tipo_documento, created_at");
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const usage = usageData ?? [];
  const totalCost = usage.reduce((s, r) => s + Number(r.custo_usd || 0), 0);

  // Projections
  const days = 30;
  const daily = totalCost / Math.max(days, 1);

  // Provider breakdown
  const providerMap = new Map<string, { cost: number; calls: number; tokens: number }>();
  usage.forEach(r => {
    const p = getProviderFromModel(r.modelo_utilizado);
    if (!providerMap.has(p)) providerMap.set(p, { cost: 0, calls: 0, tokens: 0 });
    const e = providerMap.get(p)!;
    e.cost += Number(r.custo_usd || 0);
    e.calls++;
    e.tokens += (r.tokens_input || 0) + (r.tokens_output || 0);
  });

  // Costs by org
  const orgCostMap = new Map<string, { docs: number; calls: number; cost: number }>();
  usage.forEach(r => {
    const org = r.orgao || "N/A";
    if (!orgCostMap.has(org)) orgCostMap.set(org, { docs: 0, calls: 0, cost: 0 });
    const e = orgCostMap.get(org)!;
    e.calls++;
    e.cost += Number(r.custo_usd || 0);
  });
  const orgCosts = Array.from(orgCostMap.entries()).sort((a, b) => b[1].cost - a[1].cost);

  // Cost evolution chart (last 30 days by provider)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const costChartMap = new Map<string, Record<string, number>>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    costChartMap.set(d, { google: 0, openai: 0, anthropic: 0 });
  }
  usage.filter(r => new Date(r.created_at) >= thirtyDaysAgo).forEach(r => {
    const d = r.created_at.slice(0, 10);
    const p = getProviderFromModel(r.modelo_utilizado);
    if (costChartMap.has(d) && (p === "google" || p === "openai" || p === "anthropic")) {
      costChartMap.get(d)![p] += Number(r.custo_usd || 0) * 5.8;
    }
  });
  const costChartData = Array.from(costChartMap.entries()).map(([date, v]) => ({ date: date.slice(5), ...v }));

  // Model comparison by task
  const taskModelMap = new Map<string, Map<string, { cost: number; count: number }>>();
  usage.forEach(r => {
    const task = r.tipo_documento || "geral";
    if (!taskModelMap.has(task)) taskModelMap.set(task, new Map());
    const m = taskModelMap.get(task)!;
    const model = r.modelo_utilizado;
    if (!m.has(model)) m.set(model, { cost: 0, count: 0 });
    m.get(model)!.cost += Number(r.custo_usd || 0);
    m.get(model)!.count++;
  });
  const taskComparison = Array.from(taskModelMap.entries()).map(([task, models]) => {
    const sorted = Array.from(models.entries()).sort((a, b) => b[1].count - a[1].count);
    const primary = sorted[0];
    const alt = sorted[1];
    const primaryAvg = primary ? (primary[1].cost / primary[1].count) : 0;
    const altAvg = alt ? (alt[1].cost / alt[1].count) : 0;
    const savings = altAvg > 0 && primaryAvg < altAvg ? Math.round(((altAvg - primaryAvg) / altAvg) * 100) : 0;
    return {
      task: task.toUpperCase(),
      model: primary ? getModelShortName(primary[0]) : "-",
      cost: formatBrl(primaryAvg),
      alt: alt ? getModelShortName(alt[0]) : "-",
      altCost: alt ? formatBrl(altAvg) : "-",
      savings: savings > 0 ? `${savings}%` : "-",
    };
  });

  return (
    <div className="space-y-6">
      {/* Projections */}
      <div className="rounded-xl p-5 border" style={{ background: mc.card, borderColor: mc.border }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4" style={{ color: mc.accent }} />
          <h3 className="text-sm font-semibold">Projeções de Custo</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Média Diária", val: daily * 5.8 },
            { label: "Proj. Semanal", val: daily * 7 * 5.8 },
            { label: "Proj. Mensal", val: daily * 30 * 5.8, highlight: true },
            { label: "Proj. Anual", val: daily * 365 * 5.8, warn: daily * 365 * 5.8 > 500 },
          ].map(p => (
            <div key={p.label}>
              <p className="text-[10px]" style={{ color: mc.muted }}>{p.label}</p>
              <p className="text-lg font-bold font-mono" style={{ color: p.warn ? "#FF4842" : p.highlight ? mc.accent : mc.text }}>
                R$ {p.val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Provider cards */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        {[
          { key: "google", label: "Google (Gemini)", emoji: "🟡" },
          { key: "openai", label: "OpenAI (GPT)", emoji: "🟢" },
          { key: "anthropic", label: "Anthropic (Claude)", emoji: "🟣" },
        ].map(p => {
          const d = providerMap.get(p.key) || { cost: 0, calls: 0, tokens: 0 };
          return (
            <div key={p.key} className="rounded-xl p-5 border-l-4" style={{ background: mc.card, borderColor: PROVIDER_COLORS[p.key], borderRightColor: mc.border, borderTopColor: mc.border, borderBottomColor: mc.border, borderRightWidth: 1, borderTopWidth: 1, borderBottomWidth: 1 }}>
              <h4 className="text-sm font-semibold mb-2">{p.emoji} {p.label}</h4>
              <p className="text-xl font-bold font-mono" style={{ color: mc.text }}>{formatBrl(d.cost)}</p>
              <div className="flex gap-4 mt-2 text-[11px]" style={{ color: mc.muted }}>
                <span>{d.calls.toLocaleString()} chamadas</span>
                <span>{(d.tokens / 1000000).toFixed(1)}M tokens</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Costs by org table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: mc.card, borderColor: mc.border }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: mc.border }}>
          <h3 className="text-sm font-semibold">Custos por Órgão</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${mc.border}`, color: mc.muted }}>
                <th className="text-left px-4 py-2.5 font-medium">Órgão</th>
                <th className="text-right px-4 py-2.5 font-medium">Chamadas IA</th>
                <th className="text-right px-4 py-2.5 font-medium">Custo Total</th>
                <th className="text-right px-4 py-2.5 font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {orgCosts.map(([org, d], i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${mc.border}` }}>
                  <td className="px-4 py-2.5 font-medium">{org}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{d.calls}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatBrl(d.cost)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{totalCost > 0 ? ((d.cost / totalCost) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
              <tr className="font-bold" style={{ borderTop: `2px solid ${mc.border}` }}>
                <td className="px-4 py-2.5">TOTAL</td>
                <td className="px-4 py-2.5 text-right font-mono">{usage.length}</td>
                <td className="px-4 py-2.5 text-right font-mono" style={{ color: mc.accent }}>{formatBrl(totalCost)}</td>
                <td className="px-4 py-2.5 text-right font-mono">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost evolution chart */}
      <div className="rounded-xl p-5 border" style={{ background: mc.card, borderColor: mc.border }}>
        <h3 className="text-sm font-semibold mb-4">Evolução de Custos por Provedor</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={costChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={mc.border} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: mc.muted }} />
            <YAxis tick={{ fontSize: 10, fill: mc.muted }} tickFormatter={v => `R$${v.toFixed(2)}`} />
            <Tooltip contentStyle={{ background: mc.card, border: `1px solid ${mc.border}`, borderRadius: 8, color: mc.text }} />
            <Area type="monotone" dataKey="google" stroke={PROVIDER_COLORS.google} fill={PROVIDER_COLORS.google} fillOpacity={0.15} name="Google" />
            <Area type="monotone" dataKey="openai" stroke={PROVIDER_COLORS.openai} fill={PROVIDER_COLORS.openai} fillOpacity={0.15} name="OpenAI" />
            <Area type="monotone" dataKey="anthropic" stroke={PROVIDER_COLORS.anthropic} fill={PROVIDER_COLORS.anthropic} fillOpacity={0.15} name="Anthropic" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Model comparison */}
      <div className="rounded-xl border overflow-hidden" style={{ background: mc.card, borderColor: mc.border }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: mc.border }}>
          <h3 className="text-sm font-semibold">Comparativo de Modelos por Tarefa</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${mc.border}`, color: mc.muted }}>
                <th className="text-left px-4 py-2.5 font-medium">Tarefa</th>
                <th className="text-left px-4 py-2.5 font-medium">Modelo Recomendado</th>
                <th className="text-right px-4 py-2.5 font-medium">Custo</th>
                <th className="text-left px-4 py-2.5 font-medium">Alternativa</th>
                <th className="text-right px-4 py-2.5 font-medium">Custo Alt.</th>
                <th className="text-right px-4 py-2.5 font-medium">Economia</th>
              </tr>
            </thead>
            <tbody>
              {taskComparison.map((t, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${mc.border}` }}>
                  <td className="px-4 py-2.5 font-medium">{t.task}</td>
                  <td className="px-4 py-2.5" style={{ color: mc.accent }}>{t.model}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{t.cost}</td>
                  <td className="px-4 py-2.5">{t.alt}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{t.altCost}</td>
                  <td className="px-4 py-2.5 text-right font-mono" style={{ color: t.savings !== "-" ? mc.green : mc.muted }}>{t.savings !== "-" ? `✓ ${t.savings}` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
