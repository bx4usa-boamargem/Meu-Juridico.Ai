import { useNavigate } from "react-router-dom";
import { Check, Circle, Lock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocInfo {
  id: string;
  tipo: string | null;
  status: string | null;
  posicao_cadeia: number | null;
}

interface Props {
  processoId: string;
  cadeia: string[];
  documentos: DocInfo[];
}

export function DocumentChainView({ processoId, cadeia, documentos }: Props) {
  const navigate = useNavigate();

  const getDocForTipo = (tipo: string) =>
    documentos.find((d) => d.tipo === tipo);

  const nextAvailableIndex = cadeia.findIndex((tipo) => !getDocForTipo(tipo));

  return (
    <div className="flex items-stretch gap-0 overflow-x-auto py-2">
      {cadeia.map((tipo, i) => {
        const doc = getDocForTipo(tipo);
        const isAprovado = doc?.status === "aprovado";
        const isRascunho = doc?.status === "rascunho";
        const exists = !!doc;
        const isNext = i === nextAvailableIndex;

        return (
          <div key={tipo} className="flex items-center">
            {i > 0 && (
              <ChevronRight className="h-4 w-4 text-border shrink-0 mx-1" />
            )}
            <button
              onClick={() => {
                if (doc) {
                  if (isAprovado) {
                    navigate(`/processo/${processoId}/documento/${doc.id}/view`);
                  } else {
                    navigate(`/processo/${processoId}/documento/${doc.id}`);
                  }
                }
              }}
              disabled={!exists}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border-2 px-6 py-4 text-xs font-medium transition-all min-w-[100px]",
                isAprovado && "border-success/60 bg-success/5 text-success",
                isRascunho && "border-warning/60 bg-warning/5 text-warning",
                !exists && !isNext && "border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50",
                !exists && isNext && "border-primary/30 bg-primary/5 text-primary cursor-default",
                exists && !isAprovado && !isRascunho && "border-border bg-card",
                exists && "hover:shadow-md cursor-pointer"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                isAprovado && "bg-success/10",
                isRascunho && "bg-warning/10",
                !exists && isNext && "bg-primary/10",
                !exists && !isNext && "bg-muted",
              )}>
                {isAprovado ? (
                  <Check className="h-4 w-4 text-success" />
                ) : isRascunho ? (
                  <Circle className="h-4 w-4 text-warning" />
                ) : isNext ? (
                  <Circle className="h-4 w-4 text-primary/50" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
              </div>
              <span className="font-semibold text-[11px] tracking-wide uppercase">{tipo}</span>
              <span className={cn(
                "text-[10px]",
                isAprovado && "text-success",
                isRascunho && "text-warning",
                !exists && isNext && "text-primary/60",
                !exists && !isNext && "text-muted-foreground/50",
              )}>
                {isAprovado ? "Aprovado" : isRascunho ? "Rascunho" : isNext ? "Próximo" : "Bloqueado"}
              </span>

              {isNext && (
                <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
