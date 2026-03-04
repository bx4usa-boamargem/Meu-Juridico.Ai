import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TextAreaComIAProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  required?: boolean;
  showMelhorar?: boolean;
  showGerarTexto?: boolean;
  contextoSecao?: string;
  disabled?: boolean;
  documentType?: string;
  formData?: Record<string, any>;
  isInvalid?: boolean;
}

export function TextAreaComIA({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 200,
  required,
  showMelhorar = true,
  showGerarTexto = false,
  contextoSecao,
  disabled,
  documentType,
  formData,
  isInvalid,
}: TextAreaComIAProps) {
  const [loading, setLoading] = useState(false);
  const [melhorarOpen, setMelhorarOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [melhorarLoading, setMelhorarLoading] = useState(false);

  const handleMelhorar = async () => {
    if (!value?.trim()) {
      toast.error("Digite algum texto antes de melhorar.");
      return;
    }
    setMelhorarOpen(true);
    setMelhorarLoading(true);
    setSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-melhorar", {
        body: {
          field_label: label,
          field_value: value,
          document_type: documentType ?? "etp",
          section_label: contextoSecao ?? label,
          dados_estruturados: formData ?? {},
          processo_context: {},
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error("Erro ao melhorar texto.");
        setMelhorarOpen(false);
        return;
      }
      setSuggestion(data?.improved_text ?? "");
    } catch {
      toast.error("Erro ao melhorar texto. Tente novamente.");
      setMelhorarOpen(false);
    } finally {
      setMelhorarLoading(false);
    }
  };

  const handleGerarTexto = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-gerar-justificativa", {
        body: {
          contexto: contextoSecao ?? label,
          dados_processo: formData ?? {},
          objeto: formData?.objeto_contratacao ?? "",
          orgao: formData?.orgao ?? "",
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error("Erro ao gerar texto.");
        return;
      }
      const generated = data?.justificativa ?? data?.texto ?? "";
      if (generated) {
        onChange(generated);
        toast.success("Texto gerado com sucesso!");
      }
    } catch {
      toast.error("Erro ao gerar texto. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? `Digite ${label.toLowerCase()}...`}
          disabled={disabled || loading}
          className={cn(
            "text-sm resize-none",
            isInvalid && "border-destructive",
            "bg-[#F8FAFC] border-[#E2E8F0]"
          )}
          style={{ minHeight }}
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {showMelhorar && !loading && (
          <button
            type="button"
            onClick={handleMelhorar}
            disabled={disabled || !value?.trim()}
            className="absolute bottom-2 right-2 text-[11px] font-medium text-[#0F6FDE] hover:underline disabled:opacity-40 disabled:no-underline"
          >
            Melhorar
          </button>
        )}
      </div>

      {showGerarTexto && (
        <button
          type="button"
          onClick={handleGerarTexto}
          disabled={disabled || loading}
          className="text-[11px] font-medium text-[#0F6FDE] hover:underline disabled:opacity-40"
        >
          Gerar texto
        </button>
      )}

      {isInvalid && (
        <p className="text-[10px] text-destructive">Campo obrigatório</p>
      )}

      {/* Melhorar Dialog */}
      <Dialog open={melhorarOpen} onOpenChange={setMelhorarOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Sugestão de melhoria</DialogTitle>
          </DialogHeader>
          <div className="min-h-[120px]">
            {melhorarLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground text-center">
                  Avaliando o campo <strong>"{label}"</strong>...
                </p>
              </div>
            ) : suggestion !== null ? (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {suggestion}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMelhorarOpen(false)}>
              Cancelar
            </Button>
            {suggestion !== null && (
              <Button
                size="sm"
                onClick={() => {
                  onChange(suggestion);
                  setMelhorarOpen(false);
                  toast.success("Texto aplicado!");
                }}
              >
                Aplicar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}