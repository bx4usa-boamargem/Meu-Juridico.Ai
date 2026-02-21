import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objeto: string;
  orgao: string;
}

interface ValidationResult {
  status: string;
  alertas: string[];
  recomendacao: string;
}

export function ValidarObjetoDialog({ open, onOpenChange, objeto, orgao }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-validar-objeto", {
        body: { objeto, orgao },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.status === 429) toast.error("Limite de requisições excedido.");
        else if (data.status === 402) toast.error("Créditos insuficientes.");
        else throw new Error(data.error);
        return;
      }
      setResult(data);
    } catch (e: any) {
      console.error("Validar objeto error:", e);
      toast.error("Erro ao validar objeto.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !result && !loading) handleValidate();
    if (!isOpen) setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            Validação do Objeto
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[120px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground text-center">Analisando objeto da contratação...</p>
            </div>
          ) : result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {result.status === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                )}
                <span className="text-sm font-medium">
                  {result.status === "ok" ? "Objeto adequado" : "Atenção necessária"}
                </span>
              </div>

              {result.alertas?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Alertas</p>
                  {result.alertas.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/20 p-2">
                      <AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" />
                      <span className="text-xs">{a}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.recomendacao && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Recomendação</p>
                  <p className="text-xs text-foreground">{result.recomendacao}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
