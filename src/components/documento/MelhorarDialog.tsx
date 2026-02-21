import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldLabel: string;
  fieldValue: string;
  documentType: string;
  sectionLabel: string;
  dadosEstruturados: Record<string, any>;
  processoContext?: Record<string, any>;
  onApply: (improved: string) => void;
}

export function MelhorarDialog({
  open,
  onOpenChange,
  fieldLabel,
  fieldValue,
  documentType,
  sectionLabel,
  dadosEstruturados,
  processoContext,
  onApply,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleImprove = async () => {
    setLoading(true);
    setSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-melhorar", {
        body: {
          field_label: fieldLabel,
          field_value: fieldValue,
          document_type: documentType,
          section_label: sectionLabel,
          dados_estruturados: dadosEstruturados,
          processo_context: processoContext,
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
      setSuggestion(data?.improved_text ?? "");
    } catch (e: any) {
      console.error("Melhorar error:", e);
      toast.error("Erro ao melhorar texto. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger AI call when dialog opens
  useEffect(() => {
    if (open && !suggestion && !loading) {
      handleImprove();
    }
    if (!open) {
      setSuggestion(null);
    }
  }, [open]);

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            Meu Jurídico — Especialista em {documentType}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[120px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground text-center">
                Um minuto, estou avaliando o campo <strong>"{fieldLabel}"</strong> para te dar sugestões de melhoria...
              </p>
            </div>
          ) : suggestion !== null ? (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Sugestão de melhoria</p>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {suggestion}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {suggestion !== null && (
            <Button
              size="sm"
              onClick={() => {
                onApply(suggestion);
                onOpenChange(false);
              }}
            >
              Aplicar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
