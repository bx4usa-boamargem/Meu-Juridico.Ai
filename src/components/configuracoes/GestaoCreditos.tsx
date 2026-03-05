import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FilePlus, User, Briefcase, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PERIODS = ["15 dias", "30 dias", "60 dias", "90 dias"] as const;

function MetricCard({ icon: Icon, label, value, trend, trendPositive, footer }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend: string;
  trendPositive: boolean;
  footer: { left: string; right: string };
}) {
  return (
    <Card className="border border-[hsl(var(--border))]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#0077FE" }}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: trendPositive ? "#06C2701A" : "#FF3B3B1A",
              color: trendPositive ? "#06C270" : "#FF4842",
            }}
          >
            ↗ {trend}
          </span>
        </div>
        <p className="text-3xl font-bold mt-3 tracking-tight">{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</p>
        <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
          <span>📅 {footer.left}</span>
          <span>📊 {footer.right}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function GestaoCreditos() {
  const [period, setPeriod] = useState<string>("30 dias");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  // Fetch documents count
  const { data: docsCount } = useQuery({
    queryKey: ["creditos-docs-count"],
    queryFn: async () => {
      const { count } = await supabase.from("documentos").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  // Fetch usage stats
  const { data: usageStats } = useQuery({
    queryKey: ["creditos-usage-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_usage_log" as any).select("tokens_input, tokens_output, custo_usd, user_id");
      if (!data || !Array.isArray(data)) return { totalTokens: 0, totalCost: 0, uniqueUsers: 0 };
      const totalTokens = data.reduce((s: number, r: any) => s + (r.tokens_input || 0) + (r.tokens_output || 0), 0);
      const totalCost = data.reduce((s: number, r: any) => s + Number(r.custo_usd || 0), 0);
      const uniqueUsers = new Set(data.map((r: any) => r.user_id)).size;
      return { totalTokens, totalCost, uniqueUsers: Math.max(uniqueUsers, 1) };
    },
  });

  // Monthly chart data (mock fallback since table is new)
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    name: format(new Date(2025, i), "MMM", { locale: ptBR }).replace(/^./, c => c.toUpperCase()),
    value: Math.floor(Math.random() * 50000),
  }));

  // Donut data
  const totalCredits = 55000;
  const consumed = usageStats?.totalTokens ?? 20000;
  const remaining = Math.max(totalCredits - consumed, 0);
  const donutData = [
    { name: "Consumido", value: consumed },
    { name: "Restante", value: remaining },
  ];

  // Orgs list (from processos grouped by orgao)
  const { data: orgs } = useQuery({
    queryKey: ["creditos-orgs"],
    queryFn: async () => {
      const { data } = await supabase.from("processos").select("orgao");
      if (!data) return [];
      const map = new Map<string, number>();
      data.forEach((p) => {
        const org = p.orgao || "Sem órgão";
        map.set(org, (map.get(org) || 0) + 1000);
      });
      return Array.from(map.entries()).map(([nome, credito]) => ({ nome, credito }));
    },
  });

  // Documents for selected org
  const { data: orgDocs } = useQuery({
    queryKey: ["creditos-org-docs", selectedOrg],
    queryFn: async () => {
      if (!selectedOrg) return [];
      const { data } = await supabase
        .from("processos")
        .select("id, documentos(id, tipo, created_at, status)")
        .eq("orgao", selectedOrg)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!data) return [];
      return data.flatMap((p: any) =>
        (p.documentos || []).map((d: any) => ({ ...d, processo_id: p.id }))
      );
    },
    enabled: !!selectedOrg,
  });

  const totalOrgCredits = orgs?.reduce((s, o) => s + o.credito, 0) ?? 0;
  const selectedOrgCredits = orgs?.find(o => o.nome === selectedOrg)?.credito ?? 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={FilePlus}
          label="Documentos gerados"
          value={docsCount ?? 0}
          trend="80%"
          trendPositive={false}
          footer={{ left: "Mês Passado: R$ 32.000,00", right: "Total do ano: R$ 32.000,00" }}
        />
        <MetricCard
          icon={FilePlus}
          label="Créditos utilizados"
          value={usageStats?.totalTokens ?? 0}
          trend="80%"
          trendPositive={true}
          footer={{ left: "Mês Passado: 10.000", right: "Total do ano: 100.000" }}
        />
        <MetricCard
          icon={User}
          label="Média de consumo por usuário"
          value={usageStats ? Math.round(usageStats.totalTokens / usageStats.uniqueUsers) : 0}
          trend="80%"
          trendPositive={true}
          footer={{ left: "Mês Passado: 300", right: "Total do ano: 200" }}
        />
      </div>

      {/* Chart + Donut */}
      <div className="grid gap-4 md:grid-cols-[1fr_300px]">
        {/* Bar Chart */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Consumo detalhado</h3>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      period === p
                        ? "bg-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={period === p ? { color: "#0F6FDE" } : {}}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
                <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR")} />
                <Bar dataKey="value" fill="#0077FE" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut */}
        <Card>
          <CardContent className="p-5 flex flex-col items-center">
            <h3 className="text-sm font-semibold mb-4 self-start">Meta geral</h3>
            <div className="relative">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={donutData} innerRadius={60} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
                    <Cell fill="#0077FE" />
                    <Cell fill="hsl(var(--border))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-muted-foreground">Total</span>
                <span className="text-xl font-bold">{totalCredits.toLocaleString("pt-BR")}</span>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs w-full">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#0077FE" }} />
                <span className="text-muted-foreground">Total consumido:</span>
                <span className="font-semibold ml-auto">{consumed.toLocaleString("pt-BR")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="text-muted-foreground">Total Restante:</span>
                <span className="font-semibold ml-auto">{remaining.toLocaleString("pt-BR")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orgs + Documents */}
      <div className="grid gap-4 md:grid-cols-[340px_1fr]">
        {/* Org List */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Lista de Órgãos</h3>
              <span className="text-xs font-medium px-2 py-1 rounded border" style={{ color: "#0F6FDE", borderColor: "#0F6FDE" }}>
                Total consumido: {totalOrgCredits.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {(orgs ?? []).map((org) => (
                <button
                  key={org.nome}
                  onClick={() => setSelectedOrg(org.nome)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    selectedOrg === org.nome
                      ? "border-[#0F6FDE] shadow-md"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded" style={{ background: "#DEEDFF" }}>
                    <Briefcase className="h-4 w-4" style={{ color: "#0077FE" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Nome do órgão</p>
                    <p className="text-xs font-medium truncate">{org.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Crédito utilizado</p>
                    <p className="text-xs font-semibold">{org.credito.toLocaleString("pt-BR")}</p>
                  </div>
                </button>
              ))}
              {(!orgs || orgs.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum órgão encontrado</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents per org */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-3 rounded-t-lg" style={{ background: "#F3F8FF" }}>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded" style={{ background: "#0077FE" }}>
                  <Briefcase className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold">Documentos por órgão</h3>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded border" style={{ color: "#0F6FDE", borderColor: "#0F6FDE" }}>
                Total de crédito utilizado: {selectedOrgCredits.toLocaleString("pt-BR")}
              </span>
            </div>

            {!selectedOrg ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Briefcase className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs">Selecione um órgão para ver documentos</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left px-4 py-2 font-medium">Nome do documento</th>
                      <th className="text-left px-4 py-2 font-medium">Modelo utilizado</th>
                      <th className="text-left px-4 py-2 font-medium">Data de criação</th>
                      <th className="text-right px-4 py-2 font-medium">Crédito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(orgDocs ?? []).map((doc: any) => (
                      <tr
                        key={doc.id}
                        className="border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => window.open(`/processo/${doc.processo_id}/documento/${doc.id}/view`, "_blank")}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" style={{ color: "#0077FE" }} />
                            <span className="font-medium">Documento {(doc.tipo || "").toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="underline cursor-pointer" style={{ color: "#0F6FDE" }}>
                            {doc.tipo ? `${doc.tipo.toUpperCase()} - ${getDocLabel(doc.tipo)}` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {doc.created_at ? format(new Date(doc.created_at), "dd/MM/yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ background: "#F99300" }}>₵</span>
                            <span className="font-semibold" style={{ color: "#F99300" }}>1.000</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!orgDocs || orgDocs.length === 0) && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum documento encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getDocLabel(tipo: string): string {
  const labels: Record<string, string> = {
    dfd: "Documento de Formalização de Demanda",
    etp: "Estudo Técnico Preliminar",
    tr: "Termo de Referência",
  };
  return labels[tipo?.toLowerCase()] || "Documento";
}
