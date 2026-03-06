import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DollarSign, Clock, TrendingUp, Shield, FileText, Activity,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

// ── ROI KPIs (Meu Impacto style) ─────────────────────────────────────────────
const ROI_CARDS = [
  {
    icon: DollarSign,
    label: "Economia Total",
    value: "R$ 847.350",
    sub: "Custo de horas + retrabalho + impugnações evitadas",
    gradient: "from-primary to-primary/80",
    textColor: "text-primary-foreground",
  },
  {
    icon: Clock,
    label: "Tempo Recuperado",
    value: "1.248h",
    sub: "= 156 dias úteis devolvidos à equipe",
    gradient: "from-warning to-amber-500",
    textColor: "text-warning-foreground",
  },
  {
    icon: TrendingUp,
    label: "Produtividade",
    value: "3,6x",
    sub: "Multiplicador vs. processo manual",
    gradient: "from-success to-emerald-600",
    textColor: "text-success-foreground",
  },
];

const DETAIL_KPIS = [
  { icon: DollarSign, label: "CUSTO HORAS ECONOMIZADO", value: "R$ 106.080", desc: "1.248h × R$85/h (SIAPE)", color: "bg-success/10 text-success" },
  { icon: Shield, label: "RETRABALHO EVITADO", value: "R$ 382.500", desc: "Redução de 35% → 5%", color: "bg-success/10 text-success" },
  { icon: Shield, label: "IMPUGNAÇÕES EVITADAS", value: "R$ 358.770", desc: "42 impugnações × R$8.542 (TCU)", color: "bg-success/10 text-success" },
  { icon: FileText, label: "DOCUMENTOS GERADOS", value: "312", desc: "Documentos criados com IA", color: "bg-primary/10 text-primary" },
  { icon: Activity, label: "USUÁRIOS ATIVOS", value: "13", desc: "Servidores no período", color: "bg-primary/10 text-primary" },
  { icon: Activity, label: "TOTAL DE ACESSOS", value: "15.711", desc: "Todas as operações", color: "bg-primary/10 text-primary" },
];

// ── Users for chart ──────────────────────────────────────────────────────────
const USERS = [
  { name: "João Henrique S. Rezende", color: "hsl(200, 80%, 50%)" },
  { name: "Murilo A. F. Freitas", color: "hsl(30, 80%, 50%)" },
  { name: "Mariana Neres", color: "hsl(150, 70%, 40%)" },
  { name: "Antônio M. A. Ximenes", color: "hsl(0, 70%, 55%)" },
  { name: "Khauã C. O. Anadras", color: "hsl(280, 60%, 55%)" },
  { name: "Luiz G. A. Silveira", color: "hsl(180, 60%, 40%)" },
  { name: "Eduardo Feitosa", color: "hsl(90, 50%, 40%)" },
  { name: "Gabriele S. Ferreira", color: "hsl(320, 60%, 50%)" },
  { name: "Glauber Honorato", color: "hsl(50, 70%, 40%)" },
  { name: "Ana Clara Santos", color: "hsl(220, 70%, 55%)" },
];

function generateChartData() {
  const data = [];
  const start = new Date(2026, 1, 1);
  for (let d = 0; d < 35; d++) {
    const date = new Date(start);
    date.setDate(date.getDate() + d);
    const label = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
    const entry: any = {
      date: label,
      fullDate: date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }),
    };
    USERS.forEach((u, i) => {
      const base = Math.max(0, (10 - i) * 15);
      const spike = d % 7 === 3 ? base * 3 : 0;
      entry[u.name] = Math.max(0, Math.floor(base + Math.random() * base * 1.5 + spike));
    });
    data.push(entry);
  }
  return data;
}

const CHART_DATA = generateChartData();

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0));
  const dateEntry = CHART_DATA.find((d) => d.date === label);
  return (
    <div className="bg-card border rounded-lg shadow-xl p-3 max-w-sm">
      <p className="text-xs font-semibold mb-2 text-foreground">{dateEntry?.fullDate || label}</p>
      <div className="space-y-1">
        {sorted.map((entry: any, i: number) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground truncate max-w-[140px]">
                {i + 1}º {entry.name}
              </span>
            </div>
            <span className="font-semibold text-foreground tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [topFilter, setTopFilter] = useState("10");
  const visibleUsers = USERS.slice(0, parseInt(topFilter));

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Painel de Impacto</h1>
        <p className="text-sm text-muted-foreground">
          Período: 01/02/2026 – 03/03/2026 · Todos os usuários
        </p>
      </div>

      {/* ROI Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROI_CARDS.map((card) => (
          <div key={card.label} className={cn("rounded-xl bg-gradient-to-br p-6", card.gradient)}>
            <div className={cn("flex items-center gap-2 mb-3", card.textColor)}>
              <card.icon className="h-5 w-5 opacity-80" />
              <span className="text-sm font-medium opacity-80">{card.label}</span>
            </div>
            <p className={cn("text-3xl font-black mb-1", card.textColor)}>{card.value}</p>
            <p className={cn("text-xs opacity-70", card.textColor)}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Detail KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {DETAIL_KPIS.map((kpi) => (
          <Card key={kpi.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-2">
              <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide", kpi.color)}>
                <kpi.icon className="h-3 w-3" />
                {kpi.label}
              </div>
              <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                Evolução de Acessos por Servidor
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {visibleUsers.length} de {USERS.length} usuários · Acessos ao longo do tempo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={topFilter} onValueChange={setTopFilter}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-xs">{USERS.length} usuários</Badge>
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CHART_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false} axisLine={false} interval={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false} axisLine={false}
                  label={{ value: "Acessos", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                />
                <Tooltip content={<CustomTooltip />} />
                {visibleUsers.map((user) => (
                  <Line
                    key={user.name} type="monotone" dataKey={user.name}
                    stroke={user.color} strokeWidth={1.5}
                    dot={{ r: 2, fill: user.color }} activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t">
            {visibleUsers.map((user) => (
              <div key={user.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: user.color }} />
                <span className="truncate max-w-[160px]">{user.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
