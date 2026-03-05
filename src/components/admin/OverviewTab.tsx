import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Users, FileText, Bot, DollarSign, TrendingUp, Radio
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { BrazilStateMap } from "@/components/configuracoes/BrazilStateMap";
import { McTheme, LiveBadge, getModelColor, getModelShortName, formatBrl } from "./types";

function KpiCard({ label, value, emoji, mc }: {
  label: string; value: string | number; emoji: string; mc: McTheme;
}) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: mc.card, borderColor: mc.border }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <span className="text-[11px] font-medium" style={{ color: mc.muted }}>{label}</span>
        </div>
        <LiveBadge mc={mc} />
      </div>
      <p className="text-2xl font-bold font-mono tracking-tight" style={{
        color: mc.text,
        textShadow: `0 0 20px ${mc.accent}40, 0 0 40px ${mc.accent}20`,
      }}>
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </p>
    </div>
  );
}

export function OverviewTab({ mc, showRegionsOnly }: { mc: McTheme; showRegionsOnly?: boolean }) {
  const [activityEvents, setActivityEvents] = useState<any[]>([]);

  const { data: kpis } = useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async () => {
      const [orgsRes, docsRes, docsHojeRes] = await Promise.all([
        supabase.from("org_settings").select("org_id", { count: "exact", head: true }),
        supabase.from("documentos").select("id", { count: "exact", head: true }),
        supabase.from("documentos").select("id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      ]);
      const { data: usageData } = await supabase.from("ai_usage_log").select("custo_usd, user_id, created_at");
      const totalCalls = usageData?.length ?? 0;
      const totalCost = (usageData ?? []).reduce((s: number, r: any) => s + Number(r.custo_usd || 0), 0);
      const today = new Date(Date.now() - 86400000).toISOString();
      const activeUsers = new Set((usageData ?? []).filter((r: any) => r.created_at > today).map((r: any) => r.user_id)).size;
      return {
        clients: orgsRes.count ?? 0,
        activeUsers,
        totalDocs: docsRes.count ?? 0,
        docsToday: docsHojeRes.count ?? 0,
        aiCalls: totalCalls,
        totalCostBrl: formatBrl(totalCost),
      };
    },
    refetchInterval: 30000,
  });

  // Cost projections
  const { data: projections } = useQuery({
    queryKey: ["admin-projections"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase.from("ai_usage_log").select("custo_usd, created_at").gte("created_at", thirtyDaysAgo);
      if (!data || data.length === 0) return { daily: 0, weekly: 0, monthly: 0, yearly: 0, trend: 0 };
      const total = data.reduce((s, r) => s + Number(r.custo_usd || 0), 0);
      const days = 30;
      const daily = total / days;
      // trend: compare first 15 vs last 15 days
      const mid = new Date(Date.now() - 15 * 86400000).toISOString();
      const first = data.filter(r => r.created_at < mid).reduce((s, r) => s + Number(r.custo_usd || 0), 0);
      const second = data.filter(r => r.created_at >= mid).reduce((s, r) => s + Number(r.custo_usd || 0), 0);
      const trend = first > 0 ? ((second - first) / first) * 100 : 0;
      return { daily: daily * 5.8, weekly: daily * 7 * 5.8, monthly: daily * 30 * 5.8, yearly: daily * 365 * 5.8, trend };
    },
  });

  const { data: activityData } = useQuery({
    queryKey: ["admin-activity-chart"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: docs } = await supabase.from("documentos").select("created_at").gte("created_at", thirtyDaysAgo);
      const { data: calls } = await supabase.from("ai_usage_log").select("created_at").gte("created_at", thirtyDaysAgo);
      const dayMap = new Map<string, { docs: number; ai: number }>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        dayMap.set(d.toISOString().slice(0, 10), { docs: 0, ai: 0 });
      }
      (docs ?? []).forEach((d: any) => { const k = d.created_at?.slice(0, 10); if (k && dayMap.has(k)) dayMap.get(k)!.docs++; });
      (calls ?? []).forEach((c: any) => { const k = c.created_at?.slice(0, 10); if (k && dayMap.has(k)) dayMap.get(k)!.ai++; });
      return Array.from(dayMap.entries()).map(([date, v]) => ({ date: date.slice(5), Documentos: v.docs, IA: v.ai }));
    },
  });

  const { data: modelDist } = useQuery({
    queryKey: ["admin-model-dist"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_usage_log").select("modelo_utilizado");
      if (!data) return [];
      const map = new Map<string, number>();
      data.forEach((r) => { const m = r.modelo_utilizado || "unknown"; map.set(m, (map.get(m) || 0) + 1); });
      return Array.from(map.entries()).map(([name, value]) => ({ name: getModelShortName(name), value, color: getModelColor(name) }));
    },
  });

  const { data: stateUsage } = useQuery({
    queryKey: ["admin-state-usage"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_usage_log").select("estado, custo_usd");
      if (!data) return {};
      const map: Record<string, { count: number; cost: number }> = {};
      data.forEach((r) => { const s = r.estado || "N/A"; if (!map[s]) map[s] = { count: 0, cost: 0 }; map[s].count++; map[s].cost += Number(r.custo_usd || 0); });
      return map;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("ai-activity-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_usage_log" }, (payload) => {
        setActivityEvents((prev) => [payload.new, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const sortedStates = Object.entries(stateUsage ?? {}).filter(([k]) => k !== "N/A").sort((a, b) => b[1].count - a[1].count).slice(0, 10);
  const maxStateCount = sortedStates[0]?.[1]?.count || 1;

  if (showRegionsOnly) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[6fr_4fr]">
          <div className="rounded-xl p-5 border" style={{ background: mc.card, borderColor: mc.border }}>
            <h3 className="text-sm font-semibold mb-4">Consumo por Estado — Brasil</h3>
            <BrazilStateMap activeStates={new Set(Object.keys(stateUsage ?? {}).filter(k => k !== "N/A"))} onToggleState={() => {}} />
          </div>
          <div className="rounded-xl p-5 border" style={{ background: mc.card, borderColor: mc.border }}>
            <h3 className="text-sm font-semibold mb-4">Top 10 Estados</h3>
            <div className="space-y-3">
              {sortedStates.map(([state, data]) => (
                <div key={state} className="flex items-center gap-3">
                  <span className="text-xs font-mono w-6">{state}</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: mc.border }}>
                    <div className="h-full rounded-full" style={{ width: `${(data.count / maxStateCount) * 100}%`, background: mc.accent }} />
                  </div>
                  <span className="text-[11px] font-mono w-16 text-right">{data.count} docs</span>
                </div>
              ))}
              {sortedStates.length === 0 && <p className="text-xs text-center py-4" style={{ color: mc.muted }}>Sem dados regionais</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            { label: "Média Diária", val: projections?.daily },
            { label: "Proj. Semanal", val: projections?.weekly },
            { label: "Proj. Mensal", val: projections?.monthly, highlight: true },
            { label: "Proj. Anual", val: projections?.yearly, warn: (projections?.yearly ?? 0) > 500 },
          ].map((p) => (
            <div key={p.label}>
              <p className="text-[10px]" style={{ color: mc.muted }}>{p.label}</p>
              <p className="text-lg font-bold font-mono" style={{ color: p.warn ? "#FF4842" : p.highlight ? mc.accent : mc.text }}>
                R$ {(p.val ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
        {projections && (
          <p className="text-[11px] mt-3" style={{ color: projections.trend < 0 ? mc.green : "#FF4842" }}>
            {projections.trend < 0 ? "↘" : "↗"} Custos {projections.trend < 0 ? "em queda" : "em alta"}: {projections.trend.toFixed(1)}% na segunda metade do período
          </p>
        )}
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard emoji="🏢" label="Total de Clientes" value={kpis?.clients ?? 0} mc={mc} />
        <KpiCard emoji="👥" label="Usuários Ativos Hoje" value={kpis?.activeUsers ?? 0} mc={mc} />
        <KpiCard emoji="📄" label="Documentos Gerados" value={kpis?.totalDocs ?? 0} mc={mc} />
        <KpiCard emoji="📄" label="Documentos Hoje" value={kpis?.docsToday ?? 0} mc={mc} />
        <KpiCard emoji="🤖" label="Chamadas de IA" value={kpis?.aiCalls ?? 0} mc={mc} />
        <KpiCard emoji="💰" label="Custo Total (BRL)" value={kpis?.totalCostBrl ?? "R$ 0,00"} mc={mc} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-[7fr_3fr]">
        <div className="rounded-xl p-5 border" style={{ background: mc.card, borderColor: mc.border }}>
          <h3 className="text-sm font-semibold mb-4">Atividade da Plataforma — últimos 30 dias</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={activityData ?? []}>
              <defs>
                <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={mc.accent} stopOpacity={0.3} /><stop offset="100%" stopColor={mc.accent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={mc.green} stopOpacity={0.3} /><stop offset="100%" stopColor={mc.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={mc.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: mc.muted }} />
              <YAxis tick={{ fontSize: 10, fill: mc.muted }} />
              <Tooltip contentStyle={{ background: mc.card, border: `1px solid ${mc.border}`, borderRadius: 8, color: mc.text }} />
              <Area type="monotone" dataKey="Documentos" stroke={mc.accent} fill="url(#areaBlue)" />
              <Area type="monotone" dataKey="IA" stroke={mc.green} fill="url(#areaGreen)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl p-5 border" style={{ background: mc.card, borderColor: mc.border }}>
          <h3 className="text-sm font-semibold mb-4">Distribuição por Modelo</h3>
          {(modelDist ?? []).length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={modelDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {(modelDist ?? []).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend formatter={(v) => <span style={{ color: mc.text, fontSize: 11 }}>{v}</span>} />
                <Tooltip contentStyle={{ background: mc.card, border: `1px solid ${mc.border}`, borderRadius: 8, color: mc.text }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px]"><p className="text-xs" style={{ color: mc.muted }}>Sem dados</p></div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="rounded-xl border overflow-hidden" style={{ background: mc.card, borderColor: mc.border }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: mc.border }}>
          <Radio className="h-4 w-4" style={{ color: mc.green }} />
          <h3 className="text-sm font-semibold">Feed de Atividade</h3>
          <LiveBadge mc={mc} />
        </div>
        <div className="max-h-[280px] overflow-y-auto font-mono text-[11px] p-3 space-y-1">
          {activityEvents.length > 0 ? activityEvents.map((ev: any, i) => {
            const time = ev.created_at ? new Date(ev.created_at).toLocaleTimeString("pt-BR") : "";
            return (
              <div key={i} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5">
                <span style={{ color: mc.muted }}>[{time}]</span>
                {ev.foi_fallback ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "#F993001A", color: "#F99300" }}>⚠️ FALLBACK</span>
                ) : (
                  <span className="h-2 w-2 rounded-full" style={{ background: getModelColor(ev.modelo_utilizado) }} />
                )}
                <span>{getModelShortName(ev.modelo_utilizado || "")} gerou {(ev.tipo_documento || "doc").toUpperCase()} — {((ev.tokens_input || 0) + (ev.tokens_output || 0)).toLocaleString()} tokens — {formatBrl(Number(ev.custo_usd || 0))}</span>
              </div>
            );
          }) : (
            <div className="flex items-center justify-center py-12" style={{ color: mc.muted }}>
              <p>Aguardando eventos em tempo real...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
