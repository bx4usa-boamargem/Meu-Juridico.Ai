import { ProcessCard } from "@/components/ProcessCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProcessItem {
  id: string;
  numero_processo: string | null;
  orgao: string | null;
  objeto: string | null;
  modalidade: string | null;
  status: string | null;
  created_at: string;
  documentos: { id: string; tipo: string | null; status: string | null; posicao_cadeia: number | null }[];
}

interface KanbanColumnConfig {
  key: string;
  label: string;
  color: string;
  dotColor: string;
}

const COLUMNS: KanbanColumnConfig[] = [
  { key: "ativo", label: "Ativos", color: "bg-emerald-50 border-emerald-200", dotColor: "bg-emerald-500" },
  { key: "rascunho", label: "Rascunho", color: "bg-amber-50 border-amber-200", dotColor: "bg-amber-500" },
  { key: "finalizado", label: "Finalizados", color: "bg-muted border-border", dotColor: "bg-muted-foreground" },
];

interface KanbanBoardProps {
  processos: ProcessItem[];
}

export function KanbanBoard({ processos }: KanbanBoardProps) {
  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: processos.filter((p) => (p.status ?? "rascunho") === col.key),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[60vh]">
      {grouped.map((col) => (
        <div
          key={col.key}
          className={cn(
            "rounded-xl border p-3 flex flex-col",
            col.color
          )}
        >
          {/* Column header */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className={cn("h-2.5 w-2.5 rounded-full", col.dotColor)} />
            <span className="text-sm font-semibold text-foreground">{col.label}</span>
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
              {col.items.length}
            </Badge>
          </div>

          {/* Scrollable card list */}
          <ScrollArea className="flex-1 max-h-[calc(100vh-320px)]">
            <div className="space-y-2 pr-2">
              {col.items.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Nenhum processo
                </div>
              ) : (
                col.items.map((p) => (
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
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}
