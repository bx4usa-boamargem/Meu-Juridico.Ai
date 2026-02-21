import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentText: string;
  objeto: string;
  contexto: Record<string, any>;
  orgao: string;
  onApply: (text: string) => void;
}

export function GerarJustificativaDialog({ open, onOpenChange, currentText, objeto, contexto, orgao, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setGenerated(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-gerar-justificativa", {
        body: { objeto, contexto_contratacao: contexto, orgao },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.status === 429) {
          toast.error("Limite de requisições excedido. Tente novamente em instantes.");
        } else if (data.status === 402) {
          toast.error("Créditos insuficientes.");
        } else {
          throw new Error(data.error);
        }
        return;
      }
      setGenerated(data?.justificativa_text ?? "");
    } catch (e: any) {
      console.error("Gerar justificativa error:", e);
      toast.error("Erro ao gerar justificativa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !generated && !loading) {
      handleGenerate();
    }
    if (!isOpen) {
      setGenerated(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            Gerar Justificativa com IA
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 min-h-[200px]">
          {/* Current */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Texto Atual</p>
            <div className="rounded-lg border bg-muted/20 p-3 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
              {currentText || <span className="italic text-muted-foreground text-xs">Nenhum texto preenchido</span>}
            </div>
          </div>

          {/* Generated */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Texto Gerado pela IA</p>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground text-center">
                    Gerando justificativa baseada no objeto e contexto...
                  </p>
                </div>
              ) : generated !== null ? (
                generated
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {generated !== null && (
            <Button
              size="sm"
              onClick={() => {
                onApply(generated);
                onOpenChange(false);
              }}
            >
              Inserir como rascunho
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
