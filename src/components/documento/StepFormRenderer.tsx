import { Info, Sparkles, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SectionDef, FieldDef } from "@/lib/document-sections";

interface Props {
  section: SectionDef;
  formData: Record<string, any>;
  processoData?: Record<string, any>;
  inheritedKeys: Set<string>;
  onChange: (key: string, value: string) => void;
  onMelhorar: (field: FieldDef) => void;
  onGerarJustificativa?: () => void;
  onValidarObjeto?: () => void;
}

export function StepFormRenderer({
  section,
  formData,
  processoData,
  inheritedKeys,
  onChange,
  onMelhorar,
  onGerarJustificativa,
  onValidarObjeto,
}: Props) {
  const getFieldValue = (field: FieldDef) => {
    if (field.source === "processo" && processoData) {
      return processoData[field.key] ?? "";
    }
    return formData[field.key] ?? "";
  };

  // Preview step – render read-only summary
  if (section.fields.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground italic">
            Visualização do documento será disponibilizada em breve. Revise as etapas anteriores para garantir que todos os campos estão preenchidos.
          </p>
        </div>
        {Object.entries(formData)
          .filter(([k, v]) => v && k !== "meta")
          .map(([k, v]) => (
            <div key={k} className="border-b pb-2">
              <span className="text-[10px] text-muted-foreground uppercase block">{k.replace(/_/g, " ")}</span>
              <span className="text-xs">{String(v)}</span>
            </div>
          ))}
      </div>
    );
  }

  const hasInheritedFields = section.fields.some((f) => inheritedKeys.has(f.key));
  const isJustificativa = section.id === "justificativa";
  const isBuscarObjeto = section.id === "buscar_objeto";

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-medium text-foreground">Informação importante</p>
          <p className="text-[11px] text-muted-foreground">
            Preencha todos os campos obrigatórios desta seção para avançar para a próxima etapa.
            {section.required && " Esta seção é obrigatória."}
          </p>
        </div>
      </div>

      {/* Inherited callout */}
      {hasInheritedFields && (
        <div className="flex items-start gap-2 rounded-lg bg-success/5 border border-success/20 p-3">
          <Info className="h-4 w-4 text-success mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Alguns campos foram preenchidos automaticamente com dados herdados de documentos anteriores.
          </p>
        </div>
      )}

      {/* AI action buttons */}
      {isBuscarObjeto && onValidarObjeto && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5"
          onClick={onValidarObjeto}
          disabled={!formData.objeto_contratacao?.trim()}
        >
          <Shield className="h-3.5 w-3.5" /> Validar Objeto com IA
        </Button>
      )}

      {isJustificativa && onGerarJustificativa && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5"
          onClick={onGerarJustificativa}
        >
          <Sparkles className="h-3.5 w-3.5" /> Gerar com IA
        </Button>
      )}

      {/* Fields */}
      <div className="space-y-4">
        {section.fields.map((field) => {
          const value = getFieldValue(field);
          const isInherited = inheritedKeys.has(field.key);
          const isRequired = field.required === true;

          return (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs font-medium">
                    {field.label}
                    {isRequired && <span className="text-destructive ml-0.5">*</span>}
                  </Label>
                  {isInherited && (
                    <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-success/10 text-success border-success/20">
                      preenchimento automático
                    </Badge>
                  )}
                </div>
                {field.type === "textarea" && !field.readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 gap-1 text-primary hover:text-primary"
                    onClick={() => onMelhorar(field)}
                  >
                    <Sparkles className="h-3 w-3" /> Melhorar
                  </Button>
                )}
              </div>

              {field.type === "textarea" ? (
                <Textarea
                  value={value}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  readOnly={field.readOnly}
                  placeholder={`Digite ${field.label.toLowerCase()}...`}
                  className={cn(
                    "text-sm min-h-[100px]",
                    field.readOnly && "bg-muted cursor-not-allowed",
                    isInherited && "border-success/20 bg-success/5"
                  )}
                />
              ) : field.type === "select" ? (
                <Select
                  value={value}
                  onValueChange={(v) => onChange(field.key, v)}
                  disabled={field.readOnly}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={value}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  readOnly={field.readOnly}
                  placeholder={`Digite ${field.label.toLowerCase()}...`}
                  className={cn(
                    "text-sm",
                    field.readOnly && "bg-muted cursor-not-allowed",
                    isInherited && "border-success/20 bg-success/5"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
