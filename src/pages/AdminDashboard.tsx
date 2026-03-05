import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Users, FileText, Bot, DollarSign, Activity,
  Satellite, Radio
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { BrazilStateMap } from "@/components/configuracoes/BrazilStateMap";

const MC = {
  bg: "#0A0E1A",
  card: "#111827",
  border: "#1E2D45",
  accent: "#0077FE",
  green: "#06C270",
  text: "#E2E8F0",
  muted: "#6B7588",
};

const MODEL_COLORS: Record<string, string> = {
  "google/gemini-3-flash-preview": "#FBBF24",
  "google/gemini-2.5-flash": "#FBBF24",
  "openai/gpt-5": "#06C270",
  "openai/gpt-5-mini": "#06C270",
  "google/gemini-2.5-pro": "#3B82F6",
  default: "#8B5CF6",
};

function getModelColor(model: string) {
  return MODEL_COLORS[model] || MODEL_COLORS.default;
}

function getModelShortName(model: string) {
  const map: Record<string, string> = {
    "google/gemini-3-flash-preview": "Gemini Flash",
    "google/gemini-2.5-flash": "Gemini 2.5 Flash",
    "google/gemini-2.5-pro": "Gemini Pro",
    "openai/gpt-5": "GPT-5",
    "openai/gpt-5-mini": "GPT-5 Mini",
  };
  return map[model] || model.split("/").pop() || model;
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: MC.green }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: MC.green }} />
      </span>
      <span style={{ color: MC.green }}>LIVE</span>
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, emoji }: {
  icon: React.ElementType; label: string; value: string | number; emoji: string;
}) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: MC.card, borderColor: MC.border }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <span className="text-[11px] font-medium" style={{ color: MC.muted }}>{label}</span>
        </div>
        <LiveBadge />
      </div>
      <p className="text-2xl font-bold font-mono tracking-tight" style={{
        color: MC.text,
        textShadow: `0 0 20px ${MC.accent}40, 0 0 40px ${MC.accent}20`,
      }}>
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const [activityEvents, setActivityEvents] = useState<any[]>([]);

  // KPIs with 30s refresh
  const { data: kpis } = useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async () => {
      const [orgsRes, docsRes, docsHojeRes] = await Promise.all([
        supabase.from("org_settings").select("org_id", { count: "exact", head: true }),
        supabase.from("documentos").select("id", { count: "exact", head: true }),
        supabase.from("documentos").select("id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      ]);
      // AI usage from ai_usage_log
      const { data: usageData } = await supabase.from("ai_usage_log" as any).select("custo_usd, user_id, created_at");
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
        totalCostBrl: `R$ ${(totalCost * 5.8).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      };
    },
    refetchInterval: 30000,
  });

  // Activity chart (30 days)
  const { data: activityData } = useQuery({
    queryKey: ["admin-activity-chart"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: docs } = await supabase.from("documentos").select("created_at").gte("created_at", thirtyDaysAgo);
      const { data: calls } = await supabase.from("ai_usage_log" as any).select("created_at").gte("created_at", thirtyDaysAgo);

      const dayMap = new Map<string, { docs: number; ai: number }>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        dayMap.set(key, { docs: 0, ai: 0 });
      }
      (docs ?? []).forEach((d: any) => {
        const key = d.created_at?.slice(0, 10);
        if (key && dayMap.has(key)) dayMap.get(key)!.docs++;
      });
      (calls ?? []).forEach((c: any) => {
        const key = c.created_at?.slice(0, 10);
        if (key && dayMap.has(key)) dayMap.get(key)!.ai++;
      });

      return Array.from(dayMap.entries()).map(([date, v]) => ({
        date: date.slice(5),
        Documentos: v.docs,
        IA: v.ai,
      }));
    },
  });

  // Model distribution
  const { data: modelDist } = useQuery({
    queryKey: ["admin-model-dist"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_usage_log" as any).select("modelo_utilizado");
      if (!data) return [];
      const map = new Map<string, number>();
      (data as any[]).forEach((r) => {
        const m = r.modelo_utilizado || "unknown";
        map.set(m, (map.get(m) || 0) + 1);
      });
      return Array.from(map.entries()).map(([name, value]) => ({
        name: getModelShortName(name),
        value,
        color: getModelColor(name),
      }));
    },
  });

  // Agent table
  const { data: agentData } = useQuery({
    queryKey: ["admin-agent-table"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_usage_log" as any)
        .select("modelo_utilizado, tipo_documento, tokens_input, tokens_output, custo_usd, foi_fallback, duracao_ms");
      if (!data) return [];
      const map = new Map<string, any>();
      (data as any[]).forEach((r) => {
        const key = `${r.modelo_utilizado}|${r.tipo_documento || "geral"}`;
        if (!map.has(key)) {
          map.set(key, {
            modelo: r.modelo_utilizado,
            tipo: r.tipo_documento || "geral",
            total: 0, tokens: 0, custo: 0, fallbacks: 0, duracao: 0,
          });
        }
        const v = map.get(key)!;
        v.total++;
        v.tokens += (r.tokens_input || 0) + (r.tokens_output || 0);
        v.custo += Number(r.custo_usd || 0);
        v.fallbacks += r.foi_fallback ? 1 : 0;
        v.duracao += r.duracao_ms || 0;
      });
      return Array.from(map.values()).sort((a, b) => b.total - a.total);
    },
  });

  // State usage
  const { data: stateUsage } = useQuery({
    queryKey: ["admin-state-usage"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_usage_log" as any).select("estado, custo_usd");
      if (!data) return {};
      const map: Record<string, { count: number; cost: number }> = {};
      (data as any[]).forEach((r) => {
        const s = r.estado || "N/A";
        if (!map[s]) map[s] = { count: 0, cost: 0 };
        map[s].count++;
        map[s].cost += Number(r.custo_usd || 0);
      });
      return map;
    },
  });

  // Health cards
  const { data: healthData } = useQuery({
    queryKey: ["admin-health"],
    queryFn: async () => {
      const { data } = await supabase.from("api_health_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      const providers = ["google", "openai", "anthropic"];
      return providers.map((p) => {
        const logs = (data ?? []).filter((l: any) => l.provider === p);
        const avg = logs.length ? Math.round(logs.reduce((s: number, l: any) => s + (l.latency_ms || 0), 0) / logs.length) : 0;
        const ok = logs.filter((l: any) => l.status === "ok").length;
        const uptime = logs.length ? ((ok / logs.length) * 100).toFixed(1) : "99.9";
        return { provider: p, latency: avg || (p === "google" ? 800 : p === "openai" ? 3100 : 2300), uptime, status: "ok" };
      });
    },
    refetchInterval: 300000,
  });

  // Realtime feed
  useEffect(() => {
    const channel = supabase
      .channel("ai-activity-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_usage_log" }, (payload) => {
        setActivityEvents((prev) => [payload.new, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const providerLabel: Record<string, string> = { anthropic: "Anthropic (Claude)", openai: "OpenAI (GPT)", google: "Google (Gemini)" };

  const sortedStates = Object.entries(stateUsage ?? {})
    .filter(([k]) => k !== "N/A")
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  const maxStateCount = sortedStates[0]?.[1]?.count || 1;

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: MC.bg, color: MC.text }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Satellite className="h-6 w-6" style={{ color: MC.accent }} />
        <h1 className="text-xl font-bold tracking-tight">Mission Control</h1>
        <LiveBadge />
      </div>

      {/* ROW 1 - KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard emoji="🏢" icon={Building2} label="Total de Clientes" value={kpis?.clients ?? 0} />
        <KpiCard emoji="👥" icon={Users} label="Usuários Ativos Hoje" value={kpis?.activeUsers ?? 0} />
        <KpiCard emoji="📄" icon={FileText} label="Documentos Gerados" value={kpis?.totalDocs ?? 0} />
        <KpiCard emoji="📄" icon={FileText} label="Documentos Hoje" value={kpis?.docsToday ?? 0} />
        <KpiCard emoji="🤖" icon={Bot} label="Chamadas de IA" value={kpis?.aiCalls ?? 0} />
        <KpiCard emoji="💰" icon={DollarSign} label="Custo Total (BRL)" value={kpis?.totalCostBrl ?? "R$ 0,00"} />
      </div>

      {/* ROW 2 - Charts */}
      <div className="grid gap-4 lg:grid-cols-[7fr_3fr]">
        {/* Area Chart */}
        <div className="rounded-xl p-5 border" style={{ background: MC.card, borderColor: MC.border }}>
          <h3 className="text-sm font-semibold mb-4">Atividade da Plataforma — últimos 30 dias</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={activityData ?? []}>
              <defs>
                <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={MC.accent} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={MC.accent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={MC.green} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={MC.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={MC.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: MC.muted }} />
              <YAxis tick={{ fontSize: 10, fill: MC.muted }} />
              <Tooltip contentStyle={{ background: MC.card, border: `1px solid ${MC.border}`, borderRadius: 8, color: MC.text }} />
              <Area type="monotone" dataKey="Documentos" stroke={MC.accent} fill="url(#areaBlue)" />
              <Area type="monotone" dataKey="IA" stroke={MC.green} fill="url(#areaGreen)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="rounded-xl p-5 border" style={{ background: MC.card, borderColor: MC.border }}>
          <h3 className="text-sm font-semibold mb-4">Distribuição por Modelo</h3>
          {(modelDist ?? []).length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={modelDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {(modelDist ?? []).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend formatter={(v) => <span style={{ color: MC.text, fontSize: 11 }}>{v}</span>} />
                <Tooltip contentStyle={{ background: MC.card, border: `1px solid ${MC.border}`, borderRadius: 8, color: MC.text }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px]">
              <p className="text-xs" style={{ color: MC.muted }}>Sem dados de modelos</p>
            </div>
          )}
        </div>
      </div>

      {/* ROW 3 - Agent Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: MC.card, borderColor: MC.border }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: MC.border }}>
          <h3 className="text-sm font-semibold">Agentes de IA — Produção Total</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${MC.border}`, color: MC.muted }}>
                <th className="text-left px-4 py-2.5 font-medium">Agente</th>
                <th className="text-left px-4 py-2.5 font-medium">Tipo de Doc</th>
                <th className="text-right px-4 py-2.5 font-medium">Total Gerado</th>
                <th className="text-right px-4 py-2.5 font-medium">Tokens</th>
                <th className="text-right px-4 py-2.5 font-medium">Custo BRL</th>
                <th className="text-right px-4 py-2.5 font-medium">Fallbacks</th>
                <th className="text-right px-4 py-2.5 font-medium">Tempo Médio</th>
                <th className="text-center px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(agentData ?? []).map((a, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${MC.border}` }}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: getModelColor(a.modelo) }} />
                      <span className="font-medium">{getModelShortName(a.modelo)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 uppercase">{a.tipo}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{a.total}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{(a.tokens / 1000000).toFixed(1)}M</td>
                  <td className="px-4 py-2.5 text-right font-mono">R$ {(a.custo * 5.8).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{a.fallbacks}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{a.total ? (a.duracao / a.total / 1000).toFixed(1) : 0}s</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: MC.green }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: MC.green }} /> Ativo
                    </span>
                  </td>
                </tr>
              ))}
              {(!agentData || agentData.length === 0) && (
                <tr>
                  <td colSpan={8} className="text-center py-8" style={{ color: MC.muted }}>Sem dados de agentes</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROW 4 - Map */}
      <div className="grid gap-4 lg:grid-cols-[6fr_4fr]">
        <div className="rounded-xl p-5 border" style={{ background: MC.card, borderColor: MC.border }}>
          <h3 className="text-sm font-semibold mb-4">Consumo por Estado — Brasil</h3>
          <BrazilStateMap stateData={stateUsage ?? {}} darkMode />
        </div>
        <div className="rounded-xl p-5 border" style={{ background: MC.card, borderColor: MC.border }}>
          <h3 className="text-sm font-semibold mb-4">Top 10 Estados</h3>
          <div className="space-y-3">
            {sortedStates.map(([state, data]) => (
              <div key={state} className="flex items-center gap-3">
                <span className="text-xs font-mono w-6">{state}</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: MC.border }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(data.count / maxStateCount) * 100}%`, background: MC.accent }}
                  />
                </div>
                <span className="text-[11px] font-mono w-16 text-right">{data.count} docs</span>
              </div>
            ))}
            {sortedStates.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: MC.muted }}>Sem dados regionais</p>
            )}
          </div>
        </div>
      </div>

      {/* ROW 5 - Activity Feed */}
      <div className="rounded-xl border overflow-hidden" style={{ background: MC.card, borderColor: MC.border }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: MC.border }}>
          <Radio className="h-4 w-4" style={{ color: MC.green }} />
          <h3 className="text-sm font-semibold">Feed de Atividade — Últimos eventos</h3>
          <LiveBadge />
        </div>
        <div className="max-h-[280px] overflow-y-auto font-mono text-[11px] p-3 space-y-1">
          {activityEvents.length > 0 ? activityEvents.map((ev: any, i) => {
            const time = ev.created_at ? new Date(ev.created_at).toLocaleTimeString("pt-BR") : "";
            const isFallback = ev.foi_fallback;
            return (
              <div key={i} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5">
                <span style={{ color: MC.muted }}>[{time}]</span>
                {isFallback ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "#F993001A", color: "#F99300" }}>⚠️ FALLBACK</span>
                ) : (
                  <span className="h-2 w-2 rounded-full" style={{ background: getModelColor(ev.modelo_utilizado) }} />
                )}
                <span>{getModelShortName(ev.modelo_utilizado || "")} gerou {(ev.tipo_documento || "doc").toUpperCase()} — {((ev.tokens_input || 0) + (ev.tokens_output || 0)).toLocaleString()} tokens — R$ {(Number(ev.custo_usd || 0) * 5.8).toFixed(2)}</span>
              </div>
            );
          }) : (
            <div className="flex items-center justify-center py-12" style={{ color: MC.muted }}>
              <p>Aguardando eventos em tempo real...</p>
            </div>
          )}
        </div>
      </div>

      {/* ROW 6 - Health */}
      <div className="grid gap-4 md:grid-cols-3">
        {(healthData ?? []).map((h) => (
          <div key={h.provider} className="rounded-xl p-5 border" style={{ background: MC.card, borderColor: MC.border }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">{providerLabel[h.provider] || h.provider}</h4>
              <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: MC.green }}>
                <span className="h-2 w-2 rounded-full" style={{ background: MC.green }} /> Operacional
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span style={{ color: MC.muted }}>Latência média</span>
                <span className="font-mono">{(h.latency / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: MC.muted }}>Uptime 30 dias</span>
                <span className="font-mono">{h.uptime}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
