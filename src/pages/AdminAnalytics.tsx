import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText, MessageSquare, ClipboardList, Users, Activity, Search as SearchIcon,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// ── Mock KPI data ────────────────────────────────────────────────────────────
const KPI_DATA = [
  { icon: FileText, label: "DOCUMENTOS GERADOS", value: 85, desc: "Total de documentos criados", color: "bg-primary/10 text-primary" },
  { icon: MessageSquare, label: "TOTAL DE MENSAGENS", value: 2047, desc: "Mensagens enviadas em todos os chats", color: "bg-success/10 text-success" },
  { icon: ClipboardList, label: "ITENS DO PCA", value: 27, desc: "Itens planejados no período", color: "bg-warning/10 text-warning" },
  { icon: Users, label: "USUÁRIOS ATIVOS", value: 13, desc: "Usuários ativos no período", color: "bg-destructive/10 text-destructive" },
  { icon: SearchIcon, label: "BUSCA DE PREÇOS", value: 2, desc: "Total de consultas de preços do período", color: "bg-secondary/10 text-secondary" },
  { icon: Activity, label: "TOTAL DE ACESSOS", value: 15711, desc: "Todas as operações realizadas", color: "bg-primary/10 text-primary" },
];

// ── Mock user usage data ─────────────────────────────────────────────────────
const USERS_MOCK = [
  { name: "João Henrique Schweitzer Rezende", color: "hsl(200, 80%, 50%)" },
  { name: "Murilo Antonio Ferreira Freitas", color: "hsl(30, 80%, 50%)" },
  { name: "Mariana Neres", color: "hsl(150, 70%, 40%)" },
  { name: "Antônio Marcos Almeida Ximenes", color: "hsl(0, 70%, 55%)" },
  { name: "Khauã Cristhian Oliveira Anadras", color: "hsl(280, 60%, 55%)" },
  { name: "Luiz Guilherme Arruda Da Fonseca Silveira", color: "hsl(180, 60%, 40%)" },
  { name: "Eduardo Feitosa", color: "hsl(90, 50%, 40%)" },
  { name: "Gabriele Saraiva Ferreira", color: "hsl(320, 60%, 50%)" },
  { name: "Glauber Honorato", color: "hsl(50, 70%, 40%)" },
  { name: "Ana Clara Santos", color: "hsl(220, 70%, 55%)" },
];

function generateChartData() {
  const data = [];
  const startDate = new Date(2026, 1, 1); // Feb 1, 2026
  for (let d = 0; d < 35; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    const label = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
    const entry: any = { date: label, fullDate: date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }) };
    USERS_MOCK.forEach((u, i) => {
      const base = Math.max(0, (10 - i) * 15);
      const spike = d % 7 === 3 ? base * 3 : 0;
      entry[u.name] = Math.max(0, Math.floor(base + Math.random() * base * 1.5 + spike));
    });
    data.push(entry);
  }
  return data;
}

const CHART_DATA = generateChartData();

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const sorted = [...payload].sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0));
  const dateEntry = CHART_DATA.find((d) => d.date === label);

  return (
    <div className="bg-card border rounded-lg shadow-xl p-3 max-w-sm">
      <p className="text-xs font-semibold mb-2 text-foreground">
        {dateEntry?.fullDate || label}
      </p>
      <div className="space-y-1">
        {sorted.map((entry: any, i: number) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground truncate max-w-[180px]">{entry.name}</span>
            </div>
            <span className="font-semibold text-foreground tabular-nums">{entry.value} acessos</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [topFilter, setTopFilter] = useState("10");
  const visibleUsers = USERS_MOCK.slice(0, parseInt(topFilter));

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Painel de Impacto</h1>
          <p className="text-sm text-muted-foreground">
            Período: 01/02/2026 - 03/03/2026 • Usuários: Todos os usuários
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPI_DATA.map((kpi) => (
          <Card key={kpi.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-2">
              <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide", kpi.color)}>
                <kpi.icon className="h-3 w-3" />
                {kpi.label}
              </div>
              <p className="text-3xl font-bold tracking-tight">
                {kpi.value.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">{kpi.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                Comparação de Uso por Usuário
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exibindo {visibleUsers.length} de {USERS_MOCK.length} usuários • Acessos ao longo do tempo
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
              <Badge variant="outline" className="text-xs">
                {USERS_MOCK.length} usuários
              </Badge>
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CHART_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Acessos", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                />
                <Tooltip content={<CustomTooltip />} />
                {visibleUsers.map((user) => (
                  <Line
                    key={user.name}
                    type="monotone"
                    dataKey={user.name}
                    stroke={user.color}
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: user.color }}
                    activeDot={{ r: 4 }}
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
