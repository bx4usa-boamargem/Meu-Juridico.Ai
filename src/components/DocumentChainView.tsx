import { useNavigate } from "react-router-dom";
import { Check, Circle, Lock, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface PipelineItem {
  tipo: string;
  posicao: number;
  doc_id: string | null;
  status: string | null;
  desbloqueado: boolean;
}

interface Props {
  processoId: string;
  pipeline: PipelineItem[];
}

export function DocumentChainView({ processoId, pipeline }: Props) {
  const navigate = useNavigate();
  const [creatingTipo, setCreatingTipo] = useState<string | null>(null);

  const handleClick = async (item: PipelineItem) => {
    if (item.doc_id) {
      // Navigate to existing doc
      if (item.status === "aprovado") {
        navigate(`/processo/${processoId}/documento/${item.doc_id}/view`);
      } else {
        navigate(`/processo/${processoId}/documento/${item.doc_id}`);
      }
      return;
    }

    // No doc yet but unlocked → create it
    if (!item.desbloqueado) return;

    setCreatingTipo(item.tipo);
    try {
      // Find the parent doc (previous approved doc in chain)
      const prevItem = pipeline.find((p) => p.posicao === item.posicao - 1);
      const parentDocId = prevItem?.doc_id ?? null;

      // Find cadeia_id from an existing doc in this processo
      const existingDoc = pipeline.find((p) => p.doc_id);
      let cadeiaId: string | null = null;
      if (existingDoc?.doc_id) {
        const { data: docData } = await supabase
          .from("documentos")
          .select("cadeia_id")
          .eq("id", existingDoc.doc_id)
          .single();
        cadeiaId = docData?.cadeia_id ?? null;
      }

      const { data: newDoc, error } = await supabase
        .from("documentos")
        .insert({
          processo_id: processoId,
          tipo: item.tipo,
          posicao_cadeia: item.posicao,
          status: "rascunho",
          cadeia_id: cadeiaId,
          parent_doc_id: parentDocId,
        })
        .select("id")
        .single();

      if (error) throw error;

      navigate(`/processo/${processoId}/documento/${newDoc.id}`);
    } catch (err: any) {
      console.error("Erro ao criar documento:", err);
      toast.error("Erro ao criar documento. Tente novamente.");
    } finally {
      setCreatingTipo(null);
    }
  };

  return (
    <div className="flex items-stretch gap-0 overflow-x-auto py-2">
      {pipeline.map((item, i) => {
        const isAprovado = item.status === "aprovado";
        const isRascunho = item.status === "rascunho";
        const exists = !!item.doc_id;
        const isNext = !exists && item.desbloqueado;
        const isLocked = !exists && !item.desbloqueado;
        const isCreating = creatingTipo === item.tipo;

        return (
          <div key={item.tipo} className="flex items-center">
            {i > 0 && (
              <ChevronRight className="h-4 w-4 text-border shrink-0 mx-1" />
            )}
            <button
              onClick={() => handleClick(item)}
              disabled={isLocked || isCreating}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border-2 px-6 py-4 text-xs font-medium transition-all min-w-[100px]",
                isAprovado && "border-success/60 bg-success/5 text-success",
                isRascunho && "border-warning/60 bg-warning/5 text-warning",
                isLocked && "border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50",
                isNext && "border-primary/30 bg-primary/5 text-primary cursor-pointer hover:shadow-md",
                exists && !isAprovado && !isRascunho && "border-border bg-card",
                exists && "hover:shadow-md cursor-pointer"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                isAprovado && "bg-success/10",
                isRascunho && "bg-warning/10",
                isNext && "bg-primary/10",
                isLocked && "bg-muted",
              )}>
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : isAprovado ? (
                  <Check className="h-4 w-4 text-success" />
                ) : isRascunho ? (
                  <Circle className="h-4 w-4 text-warning" />
                ) : isNext ? (
                  <Circle className="h-4 w-4 text-primary/50" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
              </div>
              <span className="font-semibold text-[11px] tracking-wide uppercase">{item.tipo}</span>
              <span className={cn(
                "text-[10px]",
                isAprovado && "text-success",
                isRascunho && "text-warning",
                isNext && "text-primary/60",
                isLocked && "text-muted-foreground/50",
              )}>
                {isCreating ? "Criando..." : isAprovado ? "Aprovado" : isRascunho ? "Rascunho" : isNext ? "Próximo" : "Bloqueado"}
              </span>

              {isNext && !isCreating && (
                <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
