import { Info, Sparkles, Shield, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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

// Dynamic tokens for the Visualização step
const DYNAMIC_TOKENS = [
  { key: "numero_processo", label: "Número do Processo" },
  { key: "orgao", label: "Órgão" },
  { key: "objeto_contratacao", label: "Objeto da Contratação" },
  { key: "categoria", label: "Categoria" },
  { key: "setor_demandante", label: "Setor Demandante" },
  { key: "responsavel", label: "Responsável" },
  { key: "valor_estimado", label: "Valor Estimado" },
];

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

  // Preview / Visualização step
  if (section.fields.length === 0) {
    return (
      <div className="flex gap-6">
        {/* Editor placeholder */}
        <div className="flex-1 space-y-4">
          <Card className="border-dashed">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Editor de Texto Rico</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  O editor de texto rico estará disponível em breve. Aqui você poderá
                  visualizar e editar o documento final com formatação completa.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary of filled fields */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Resumo dos dados preenchidos
            </h4>
            {Object.entries(formData)
              .filter(([k, v]) => v && k !== "meta")
              .slice(0, 10)
              .map(([k, v]) => (
                <div key={k} className="border-b border-border/50 pb-2">
                  <span className="text-[10px] text-muted-foreground uppercase block">
                    {k.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-foreground">{String(v).slice(0, 120)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Dynamic tokens sidebar */}
        <div className="w-48 shrink-0 space-y-3">
          <h4 className="text-xs font-semibold text-foreground">Dados dinâmicos</h4>
          <p className="text-[10px] text-muted-foreground">
            Copie os tokens para inserir dados dinâmicos no documento.
          </p>
          <div className="space-y-1.5">
            {DYNAMIC_TOKENS.map((token) => (
              <button
                key={token.key}
                className="w-full flex items-center gap-2 rounded-md border border-border/50 px-2.5 py-1.5 text-left hover:bg-muted/50 transition-colors group"
                onClick={() => {
                  navigator.clipboard.writeText(`{{${token.key}}}`);
                  toast.success(`Token {{${token.key}}} copiado!`);
                }}
              >
                <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-foreground block truncate">{token.label}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">{`{{${token.key}}}`}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Separate grouped (inherited/readOnly) fields vs editable fields
  const groupedFields = section.fields.filter((f) => f.group);
  const editableFields = section.fields.filter((f) => !f.group);
  const hasGroupedFields = groupedFields.length > 0;

  const isJustificativa = section.id === "justificativa";
  const isBuscarObjeto = section.id === "buscar_objeto";

  const renderField = (field: FieldDef) => {
    const value = getFieldValue(field);
    const isInherited = inheritedKeys.has(field.key);
    const isRequired = field.required === true;
    const colSpan = field.colspan ?? (field.type === "textarea" ? 2 : 1);

    return (
      <div
        key={field.key}
        className={cn("space-y-1.5", colSpan === 2 ? "col-span-2" : "col-span-1")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-medium">
              {field.label}
              {isRequired && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {isInherited && (
              <Badge
                variant="secondary"
                className="text-[8px] px-1.5 py-0 bg-success/10 text-success border-success/20"
              >
                automático
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
          <div className="space-y-1">
            <Textarea
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              readOnly={field.readOnly}
              placeholder={`Digite ${field.label.toLowerCase()}...`}
              maxLength={field.maxLength}
              className={cn(
                "text-sm min-h-[100px]",
                field.readOnly && "bg-muted cursor-not-allowed",
                isInherited && "border-success/20 bg-success/5"
              )}
            />
            {field.maxLength && (
              <p className="text-[10px] text-muted-foreground text-right">
                {String(value).length}/{field.maxLength}
              </p>
            )}
          </div>
        ) : field.type === "date" ? (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            readOnly={field.readOnly}
            className={cn(
              "text-sm",
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
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
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
  };

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-medium text-foreground">Informação importante</p>
          <p className="text-[11px] text-muted-foreground">
            Antes de editar o documento, confira todas as informações abaixo e certifique-se
            que está editando o documento correto, pois as alterações serão salvas automaticamente.
          </p>
        </div>
      </div>

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

      {/* Grouped fields card (inherited / readOnly) */}
      {hasGroupedFields && (
        <Card className="border-border/60">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-xs font-semibold">Informações básicas</CardTitle>
            <div className="flex items-start gap-2 rounded-md bg-success/5 border border-success/20 p-2.5 mt-2">
              <Info className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground">
                <span className="font-medium text-success">Preenchimento automático</span> — Dados
                obtidos durante a construção do ETP
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
              {groupedFields.map(renderField)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editable fields in 2-column grid */}
      <div className="grid grid-cols-2 gap-4">
        {editableFields.map(renderField)}
      </div>
    </div>
  );
}
