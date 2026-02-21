import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, FileText, AlertTriangle, Clock } from "lucide-react";
import { NovoProcessoDialog } from "@/components/NovoProcessoDialog";
import { KpiCard } from "@/components/KpiCard";
import { ProcessCard } from "@/components/ProcessCard";
import { useState } from "react";

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
      const [processosRes, docsRascunhoRes, alertasRes] = await Promise.all([
        supabase.from("processos").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("documentos").select("id", { count: "exact", head: true }).eq("status", "rascunho"),
        supabase.from("alertas_cascata").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      ]);
      return {
        ativos: processosRes.count ?? 0,
        emRevisao: docsRascunhoRes.count ?? 0,
        alertas: alertasRes.count ?? 0,
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

      {/* Process Grid */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Processos Recentes</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : !processos?.length ? (
          <div className="border border-dashed rounded-lg p-12 text-center">
            <FolderKanban className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Nenhum processo encontrado.</p>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Criar primeiro processo
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {processos.map((p) => (
              <ProcessCard
                key={p.id}
                id={p.id}
                numero_processo={p.numero_processo}
                orgao={p.orgao}
                objeto={p.objeto}
                modalidade={p.modalidade}
                status={p.status}
                created_at={p.created_at}
                documentos={p.documentos ?? []}
              />
            ))}
          </div>
        )}
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
