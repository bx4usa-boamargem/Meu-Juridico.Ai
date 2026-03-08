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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="processos" fill="#1A56DB" radius={[4, 4, 0, 0]} />
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="economia" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Graphs / Metrics Row */}
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


// --- src/pages/Processos.tsx ---

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderKanban, LayoutGrid, List } from "lucide-react";
import { NovoProcessoDialog } from "@/components/NovoProcessoDialog";
import { ProcessCard } from "@/components/ProcessCard";
import { KanbanBoard } from "@/components/KanbanBoard";

type ViewMode = "kanban" | "list";

export default function Processos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

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

  const filtered = processos?.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.numero_processo?.toLowerCase().includes(q) ||
      p.orgao?.toLowerCase().includes(q) ||
      p.objeto?.toLowerCase().includes(q)
    );
  });

  const processItems = (filtered ?? []).map((p) => ({
    ...p,
    documentos: (p.documentos ?? []) as { id: string; tipo: string | null; status: string | null; posicao_cadeia: number | null }[],
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Processos</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus processos licitatórios</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novo Processo
        </Button>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, órgão ou objeto..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center border rounded-md p-0.5 bg-muted/50">
          <Button
            variant={viewMode === "kanban" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2.5"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1" />
            Kanban
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2.5"
            onClick={() => setViewMode("list")}
          >
            <List className="h-3.5 w-3.5 mr-1" />
            Lista
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !processItems.length ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <FolderKanban className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            {search ? "Nenhum processo encontrado para esta busca." : "Nenhum processo encontrado."}
          </p>
          {!search && (
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Criar primeiro processo
            </Button>
          )}
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard processos={processItems} />
      ) : (
        <div className="flex flex-col gap-3 pb-8">
          {processItems.map((p) => (
            <ProcessCard
              key={p.id}
              id={p.id}
              numero_processo={p.numero_processo}
              orgao={p.orgao}
              objeto={p.objeto}
              modalidade={p.modalidade}
              status={p.status}
              created_at={p.created_at}
              documentos={p.documentos}
            />
          ))}
        </div>
      )}

      <NovoProcessoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => { refetch(); setDialogOpen(false); }}
      />
    </div>
  );
}


// --- src/components/ProcessCard.tsx ---

import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DocInfo {
  id: string;
  tipo: string | null;
  status: string | null;
  posicao_cadeia: number | null;
}

interface ProcessCardProps {
  id: string;
  numero_processo: string | null;
  orgao: string | null;
  objeto: string | null;
  modalidade: string | null;
  status: string | null;
  created_at: string;
  documentos?: DocInfo[];
}

const statusVariant: Record<string, string> = {
  rascunho: "secondary",
  ativo: "default",
  finalizado: "outline",
};

// Nova ordem técnica da cadeia
const CHAIN_STEPS = [
  { key: "pca", label: "PCA" },
  { key: "dfd", label: "DFD" },
  { key: "etp", label: "ETP" },
  { key: "tr", label: "TR" },
  { key: "pesquisa_precos", label: "Pesquisa" },
  { key: "mapa_riscos", label: "Riscos" },
  { key: "parecer_juridico", label: "Parecer" },
  { key: "edital", label: "Edital" },
  { key: "contrato", label: "Contrato" },
];

const STEP_STATUS_COLORS: Record<string, string> = {
  aprovado: "bg-emerald-500",
  rascunho: "bg-amber-400",
  proximo: "bg-border",
  bloqueado: "bg-border",
};

const STEP_STATUS_LABELS: Record<string, string> = {
  aprovado: "Aprovado",
  rascunho: "Em andamento",
  proximo: "Próximo",
  bloqueado: "Bloqueado",
};

function getHealthColor(documentos: DocInfo[], createdAt: string): "green" | "yellow" | "red" {
  if (!documentos.length) {
    const days = (Date.now() - new Date(createdAt).getTime()) / 86400000;
    if (days > 15) return "red";
    if (days > 7) return "yellow";
    return "green";
  }
  return "green";
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function ProcessCard({
  id,
  numero_processo,
  orgao,
  objeto,
  modalidade,
  status,
  created_at,
  documentos = [],
}: ProcessCardProps) {
  const navigate = useNavigate();

  const steps = CHAIN_STEPS.map((step, i) => {
    const doc = documentos.find((d) => d.tipo === step.key || d.posicao_cadeia === i);
    const docStatus = doc?.status ?? null;
    let stepStatus: "aprovado" | "rascunho" | "proximo" | "bloqueado" = "bloqueado";
    if (docStatus === "aprovado") stepStatus = "aprovado";
    else if (docStatus === "rascunho") stepStatus = "rascunho";
    else {
      const prevKey = i > 0 ? CHAIN_STEPS[i - 1].key : null;
      const prevDoc = prevKey ? documentos.find((d) => d.tipo === prevKey || d.posicao_cadeia === i - 1) : { status: "aprovado" };
      if (i === 0 || prevDoc?.status === "aprovado") stepStatus = "proximo";
    }
    return { ...step, status: stepStatus };
  });

  const completed = steps.filter((s) => s.status === "aprovado").length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);
  const health = getHealthColor(documentos, created_at);

  const healthColors = {
    green: "bg-emerald-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all group relative bg-card"
      onClick={() => navigate(`/processo/${id}`)}
    >
      {/* Health dot */}
      <div className={cn("absolute top-3 right-3 h-2.5 w-2.5 rounded-full", healthColors[health])} />

      <CardContent className="p-4 space-y-3">
        {/* Header: número + badge */}
        <div className="flex items-start justify-between gap-2 pr-4">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{numero_processo || "Sem número"}</p>
            {orgao && <p className="text-xs text-muted-foreground truncate">{orgao}</p>}
          </div>
          <Badge variant={statusVariant[status ?? "rascunho"] as any} className="shrink-0 text-[10px]">
            {status ?? "rascunho"}
          </Badge>
        </div>

        {/* Objeto */}
        {objeto && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{objeto}</p>
        )}

        {/* Avatar do responsável */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
            {getInitials(orgao)}
          </div>
          <span className="text-[11px] text-muted-foreground truncate">{orgao || "Sem responsável"}</span>
        </div>

        {/* Progress text */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground font-medium">
            {completed}/{total} etapas — {pct}%
          </p>
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{modalidade || "—"}</span>
        </div>

        {/* Chain pipeline bars */}
        <div className="flex items-center gap-0.5">
          {steps.map((step) => (
            <Tooltip key={step.key}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    STEP_STATUS_COLORS[step.status]
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px] px-2 py-1">
                {step.label} — {STEP_STATUS_LABELS[step.status]}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Date */}
        <p className="text-[10px] text-muted-foreground text-right">
          {new Date(created_at).toLocaleDateString("pt-BR")}
        </p>
      </CardContent>
    </Card>
  );
}
