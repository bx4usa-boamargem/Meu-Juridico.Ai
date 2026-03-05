import { useNavigate } from "react-router-dom";
import { Check, Circle, Lock, ChevronRight, Loader2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
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
  const [riskMapStatus, setRiskMapStatus] = useState<"none" | "approved" | "locked">("locked");

  // Check if risk map exists for this process
  useEffect(() => {
    const trItem = pipeline.find(p => p.tipo === "tr");
    if (trItem?.status === "aprovado") {
      supabase
        .from("risk_maps" as any)
        .select("id, aprovado_em")
        .eq("processo_id", processoId)
        .order("created_at", { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0 && (data[0] as any).aprovado_em) {
            setRiskMapStatus("approved");
          } else {
            setRiskMapStatus("none");
          }
        });
    } else {
      setRiskMapStatus("locked");
    }
  }, [processoId, pipeline]);

  const handleClick = async (item: PipelineItem) => {
    if (item.doc_id) {
      if (item.status === "aprovado") {
        navigate(`/processo/${processoId}/documento/${item.doc_id}/view`);
      } else {
        navigate(`/processo/${processoId}/documento/${item.doc_id}`);
      }
      return;
    }

    if (!item.desbloqueado) return;

    setCreatingTipo(item.tipo);
    try {
      const prevItem = pipeline.find((p) => p.posicao === item.posicao - 1);
      const parentDocId = prevItem?.doc_id ?? null;

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

  // Find TR and EDITAL positions to inject risk map card
  const trIndex = pipeline.findIndex(p => p.tipo === "tr");
  const editalIndex = pipeline.findIndex(p => p.tipo === "edital");
  const shouldShowRiskMap = trIndex >= 0 && editalIndex > trIndex;

  // Build display items: pipeline items + injected risk map
  const displayItems: Array<PipelineItem | { isRiskMap: true }> = [];
  pipeline.forEach((item, i) => {
    displayItems.push(item);
    if (shouldShowRiskMap && i === trIndex) {
      displayItems.push({ isRiskMap: true });
    }
  });

  return (
    <div className="flex items-stretch gap-0 overflow-x-auto py-2">
      {displayItems.map((item, i) => {
        // Risk Map card
        if ("isRiskMap" in item) {
          const isApproved = riskMapStatus === "approved";
          const isLocked = riskMapStatus === "locked";
          const isNext = riskMapStatus === "none";

          return (
            <div key="risk-map" className="flex items-center">
              <ChevronRight className="h-4 w-4 text-border shrink-0 mx-1" />
              <button
                onClick={() => !isLocked && navigate(`/mapa-de-riscos?processo=${processoId}`)}
                disabled={isLocked}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-lg border-2 px-6 py-4 text-xs font-medium transition-all min-w-[100px]",
                  isApproved && "border-success/60 bg-success/5 text-success",
                  isLocked && "border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50",
                  isNext && "border-destructive/30 bg-destructive/5 text-destructive cursor-pointer hover:shadow-md",
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  isApproved && "bg-success/10",
                  isNext && "bg-destructive/10",
                  isLocked && "bg-muted",
                )}>
                  {isApproved ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : isNext ? (
                    <Shield className="h-4 w-4 text-destructive/50" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                  )}
                </div>
                <span className="font-semibold text-[11px] tracking-wide uppercase">Mapa de Riscos</span>
                <span className={cn(
                  "text-[10px]",
                  isApproved && "text-success",
                  isNext && "text-destructive/60",
                  isLocked && "text-muted-foreground/50",
                )}>
                  {isApproved ? "Aprovado" : isNext ? "Criar" : "Bloqueado"}
                </span>
                {isNext && (
                  <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                )}
              </button>
            </div>
          );
        }

        // Regular pipeline item
        const pipelineItem = item as PipelineItem;
        const isAprovado = pipelineItem.status === "aprovado";
        const isRascunho = pipelineItem.status === "rascunho";
        const exists = !!pipelineItem.doc_id;
        const isNext = !exists && pipelineItem.desbloqueado;
        const isLocked = !exists && !pipelineItem.desbloqueado;
        const isCreating = creatingTipo === pipelineItem.tipo;

        return (
          <div key={pipelineItem.tipo} className="flex items-center">
            {i > 0 && (
              <ChevronRight className="h-4 w-4 text-border shrink-0 mx-1" />
            )}
            <button
              onClick={() => handleClick(pipelineItem)}
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
              <span className="font-semibold text-[11px] tracking-wide uppercase">{pipelineItem.tipo}</span>
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
