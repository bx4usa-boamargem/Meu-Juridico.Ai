import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderKanban, LayoutGrid, List } from "lucide-react";
import { NovoProcessoDialog } from "@/components/NovoProcessoDialog";
import { ProcessCard } from "@/components/ProcessCard";
import { KanbanBoard } from "@/components/KanbanBoard";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "list";

export default function Processos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const { user, loading: authLoading } = useAuth();

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
          <p className="text-sm text-muted-foreground">
            Gerencie seus processos licitatórios
            {user && <span className="ml-1">— {user.email}</span>}
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novo Processo
        </Button>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
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
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
