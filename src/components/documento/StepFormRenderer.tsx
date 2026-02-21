import { Info, Sparkles } from "lucide-react";
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
}

export function StepFormRenderer({ section, formData, processoData, inheritedKeys, onChange, onMelhorar }: Props) {
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
        {Object.entries(formData).filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="border-b pb-2">
            <span className="text-[10px] text-muted-foreground uppercase block">{k.replace(/_/g, " ")}</span>
            <span className="text-xs">{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  const hasInheritedFields = section.fields.some((f) => inheritedKeys.has(f.key));

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-medium text-blue-900 dark:text-blue-200">Informação importante</p>
          <p className="text-[11px] text-blue-700 dark:text-blue-300">
            Preencha todos os campos obrigatórios desta seção para avançar para a próxima etapa.
            {section.required && " Esta seção é obrigatória."}
          </p>
        </div>
      </div>

      {/* Inherited callout */}
      {hasInheritedFields && (
        <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3">
          <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
            Alguns campos foram preenchidos automaticamente com dados herdados de documentos anteriores.
            Você pode editar esses valores livremente.
          </p>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-4">
        {section.fields.map((field) => {
          const value = getFieldValue(field);
          const isInherited = inheritedKeys.has(field.key);

          return (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs font-medium">{field.label}</Label>
                  {isInherited && (
                    <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">
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
                    isInherited && "border-emerald-200 bg-emerald-50/30 dark:border-emerald-700 dark:bg-emerald-900/10"
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
                    isInherited && "border-emerald-200 bg-emerald-50/30 dark:border-emerald-700 dark:bg-emerald-900/10"
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
