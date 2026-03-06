import { ProcessCard } from "@/components/ProcessCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileEdit, Loader2, CheckCircle2 } from "lucide-react";

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
  icon: React.ElementType;
  bgColor: string;
  headerBg: string;
  dotColor: string;
  borderColor: string;
}

const COLUMNS: KanbanColumnConfig[] = [
  {
    key: "rascunho",
    label: "Planejamento",
    icon: FileEdit,
    bgColor: "bg-amber-50/60",
    headerBg: "bg-amber-100",
    dotColor: "bg-amber-500",
    borderColor: "border-amber-200",
  },
  {
    key: "ativo",
    label: "Em Andamento",
    icon: Loader2,
    bgColor: "bg-blue-50/60",
    headerBg: "bg-blue-100",
    dotColor: "bg-blue-500",
    borderColor: "border-blue-200",
  },
  {
    key: "finalizado",
    label: "Concluído",
    icon: CheckCircle2,
    bgColor: "bg-emerald-50/60",
    headerBg: "bg-emerald-100",
    dotColor: "bg-emerald-500",
    borderColor: "border-emerald-200",
  },
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
      {grouped.map((col) => {
        const Icon = col.icon;
        return (
          <div
            key={col.key}
            className={cn(
              "rounded-xl border flex flex-col",
              col.bgColor,
              col.borderColor
            )}
          >
            {/* Column header */}
            <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-t-xl", col.headerBg)}>
              <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", col.dotColor)} />
              <Icon className="h-3.5 w-3.5 text-foreground/70" />
              <span className="text-sm font-semibold text-foreground">{col.label}</span>
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 bg-background/60">
                {col.items.length}
              </Badge>
            </div>

            {/* Scrollable card list */}
            <ScrollArea className="flex-1 max-h-[calc(100vh-320px)]">
              <div className="space-y-2 p-3">
                {col.items.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground border border-dashed rounded-lg bg-background/40">
                    Nenhum processo nesta etapa
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
        );
      })}
    </div>
  );
}
