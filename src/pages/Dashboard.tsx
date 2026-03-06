import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, FileText, AlertTriangle, Clock } from "lucide-react";
import { NovoProcessoDialog } from "@/components/NovoProcessoDialog";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const barChartData = [
  { month: "Jan", processos: 12 },
  { month: "Fev", processos: 19 },
  { month: "Mar", processos: 15 },
  { month: "Abr", processos: 22 },
  { month: "Mai", processos: 30 },
  { month: "Jun", processos: 28 },
];

const lineChartData = [
  { month: "Jan", economia: 2.4 },
  { month: "Fev", economia: 3.1 },
  { month: "Mar", economia: 4.8 },
  { month: "Abr", economia: 5.2 },
  { month: "Mai", economia: 7.9 },
  { month: "Jun", economia: 8.5 },
];

export default function Dashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: processos, isLoading, refetch } = useQuery({
    queryKey: ["processos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos")
        .select(`*, documentos (id, tipo, status, posicao_cadeia)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from("processos").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("documentos").select("id", { count: "exact", head: true }).eq("status", "rascunho"),
        supabase.from("alertas_cascata").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      ].map((q) => (q as any).then((r: any) => r).catch(() => ({ count: 0 }))));
      const [processosRes, docsRascunhoRes, alertasRes] = results;
      return {
        ativos: (processosRes as any).count ?? 0,
        emRevisao: (docsRascunhoRes as any).count ?? 0,
        alertas: (alertasRes as any).count ?? 0,
        total: processos?.length ?? 0,
      };
    },
    enabled: !!processos,
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Central Operacional</h1>
          <p className="text-sm text-muted-foreground">Visão geral dos processos licitatórios</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novo Processo
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={FolderKanban} label="Processos Ativos" value={stats?.ativos ?? 0} />
        <KpiCard icon={FileText} label="Docs em Revisão" value={stats?.emRevisao ?? 0} />
        <KpiCard icon={AlertTriangle} label="Alertas Cascata" value={stats?.alertas ?? 0} />
        <KpiCard icon={Clock} label="Total Processos" value={stats?.total ?? 0} />
      </div>

      {/* Graphs Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Processos por Mês</CardTitle>
            <p className="text-sm text-muted-foreground">Volume de processos iniciados no ano</p>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="processos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Economia Estimada</CardTitle>
            <p className="text-sm text-muted-foreground">Evolução do savings gerado (em milhões R$)</p>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="economia" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status + Produtividade */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 shadow-sm md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Status Geral da Operação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium">Concluídos com Sucesso</span>
                </div>
                <span className="text-sm font-bold">45%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium">Em Andamento (Dentro do Prazo)</span>
                </div>
                <span className="text-sm font-bold">35%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium">Atrasados / Com Alertas</span>
                </div>
                <span className="text-sm font-bold">20%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '20%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-primary">Produtividade IA</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center h-[200px] text-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">120h</p>
              <p className="text-sm text-muted-foreground mt-1">Tempo economizado essa semana<br /> na geração de ETPs e TRs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <NovoProcessoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
