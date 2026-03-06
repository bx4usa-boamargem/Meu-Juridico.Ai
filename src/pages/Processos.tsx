import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderKanban, Clock, PlayCircle, CheckCircle2, LayoutGrid, List } from "lucide-react";
import { NovoProcessoDialog } from "@/components/NovoProcessoDialog";
import { ProcessCard } from "@/components/ProcessCard";
import { ScrollArea } from "@/components/ui/scroll-area";

type ViewMode = "kanban" | "list";

const KANBAN_COLUMNS = [
  { id: "rascunho", label: "Planejamento (Rascunho)", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
  { id: "ativo", label: "Em Andamento (Ativo)", icon: PlayCircle, color: "text-blue-600", bg: "bg-blue-100" },
  { id: "finalizado", label: "Concluído", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
];

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

  const getProcessosByStatus = (status: string) => {
    return filtered?.filter((p) => (p.status || "rascunho") === status) || [];
  };

  return (
    <div className="h-screen flex flex-col p-6 space-y-4 max-w-[1600px] mx-auto overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fluxo de Compras</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus processos de contratação em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, órgão..."
              className="pl-9 bg-background"
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

          <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Novo Processo
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !filtered?.length && !search ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30">
          <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">Crie seu primeiro processo</h3>
          <p className="text-sm text-muted-foreground mb-4">Seu fluxo de compras está vazio no momento.</p>
          <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Iniciar Contratação
          </Button>
        </div>
      ) : viewMode === "kanban" ? (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const columnProcessos = getProcessosByStatus(col.id);
            const Icon = col.icon;

            return (
              <div key={col.id} className="flex flex-col flex-1 min-w-[320px] max-w-[400px] bg-muted/30 rounded-xl border h-full">
                {/* Column Header */}
                <div className="flex items-center justify-between p-4 border-b shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${col.bg}`}>
                      <Icon className={`h-4 w-4 ${col.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground/80">{col.label}</h3>
                  </div>
                  <span className="bg-muted text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                    {columnProcessos.length}
                  </span>
                </div>

                {/* Column Content/Cards */}
                <ScrollArea className="flex-1 p-3">
                  <div className="flex flex-col gap-3 pb-4">
                    {columnProcessos.length > 0 ? (
                      columnProcessos.map((p) => (
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
                      ))
                    ) : (
                      <div className="p-6 text-center border-2 border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground">Nenhum processo nesta fase</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 pb-4">
            {filtered?.map((p) => (
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
