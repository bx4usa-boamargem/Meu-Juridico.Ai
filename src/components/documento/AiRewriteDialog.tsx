import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AiAction } from "./AiContextMenu";

const ACTION_LABELS: Record<AiAction, string> = {
  melhorar: "Melhorar Redação",
  fundamentar: "Fundamentar Juridicamente",
  adequar_orgao: "Adequar ao Órgão",
  base_legal: "Inserir Base Legal",
  diferenciar: "Diferenciar Seção",
};

interface AiRewriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: AiAction;
  selectedText: string;
  sectionType?: string;
  documentType?: string;
  processoContext?: Record<string, any>;
  dadosEstruturados?: Record<string, any>;
  otherSections?: { field: string; value: string }[];
  documentoId?: string;
  onApply: (rewrittenText: string) => void;
}

export function AiRewriteDialog({
  open,
  onOpenChange,
  action,
  selectedText,
  sectionType,
  documentType,
  processoContext,
  dadosEstruturados,
  otherSections,
  documentoId,
  onApply,
}: AiRewriteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  const callRewrite = useCallback(async () => {
    setLoading(true);
    setSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-rewrite-contextual", {
        body: {
          selected_text: selectedText,
          action,
          section_type: sectionType ?? "geral",
          document_type: documentType ?? "DFD",
          processo_context: processoContext,
          dados_estruturados: dadosEstruturados,
          other_sections: otherSections ?? [],
          documento_id: documentoId,
        },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.status === 429) {
          toast.error("Limite de requisições excedido. Tente novamente em instantes.");
        } else if (data.status === 402) {
          toast.error("Créditos insuficientes. Adicione créditos em Configurações > Workspace.");
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setSuggestion(data?.rewritten_text ?? "");
      setModelUsed(data?.model ?? null);
    } catch (e: any) {
      console.error("ai-rewrite-contextual error:", e);
      toast.error("Erro ao processar IA. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [selectedText, action, sectionType, documentType, processoContext, dadosEstruturados, otherSections, documentoId]);

  useEffect(() => {
    if (open && !suggestion && !loading) {
      callRewrite();
    }
    if (!open) {
      setSuggestion(null);
      setModelUsed(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            {ACTION_LABELS[action]}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 min-h-[200px]">
          {/* Original */}
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
              Texto Original
            </p>
            <ScrollArea className="h-[300px]">
              <div className="rounded-lg border bg-muted/20 p-3 text-sm whitespace-pre-wrap">
                {selectedText}
              </div>
            </ScrollArea>
          </div>

          {/* Suggestion */}
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
              Sugestão da IA
              {modelUsed && (
                <span className="ml-2 text-[9px] font-normal text-muted-foreground/70">
                  ({modelUsed.split("/").pop()})
                </span>
              )}
            </p>
            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground text-center">
                    Processando com IA especializada...
                  </p>
                </div>
              ) : suggestion !== null ? (
                <div className="rounded-lg border bg-primary/5 p-3 text-sm whitespace-pre-wrap">
                  {suggestion}
                </div>
              ) : null}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {suggestion !== null && (
            <>
              <Button variant="outline" size="sm" className="gap-1" onClick={callRewrite} disabled={loading}>
                <RefreshCw className="h-3 w-3" />
                Regenerar
              </Button>
              <Button
                size="sm"
                className="gap-1"
                onClick={() => {
                  onApply(suggestion);
                  onOpenChange(false);
                }}
              >
                <Sparkles className="h-3 w-3" />
                Aplicar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
