import { useRef, useState, useEffect, useCallback } from "react";
import { Info, Sparkles, Shield, Copy, Loader2, BookOpen, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RichTextEditor } from "@/components/documento/RichTextEditor";
import { TextAreaComIA } from "@/components/documento/TextAreaComIA";
import { TeamListField } from "@/components/documento/TeamListField";
import { PriceResearchDrawer } from "@/components/documento/PriceResearchDrawer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SectionDef, FieldDef } from "@/lib/document-sections";

interface FieldMeta {
  confianca: string;
  fontes: string[];
  sugestao: string;
}

interface Props {
  section: SectionDef;
  formData: Record<string, any>;
  processoData?: Record<string, any>;
  inheritedKeys: Set<string>;
  invalidFields?: Set<string>;
  aiFilledFields?: Set<string>;
  autoPreenchendo?: boolean;
  camposMeta?: Record<string, FieldMeta>;
  onChange: (key: string, value: any) => void;
  onMelhorar: (field: FieldDef) => void;
  onGerarJustificativa?: () => void;
  onValidarObjeto?: () => void;
  documentType?: string;
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

// CORREÇÃO 4: Auto-resize textarea hook
function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);

  useEffect(() => { resize(); }, [value, resize]);

  return { ref, resize };
}

// CORREÇÃO 4: Auto-resizing textarea component
function AutoTextarea({ value, onChange, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) {
  const { ref, resize } = useAutoResize(value);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => { onChange(e); resize(); }}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "resize-none overflow-hidden min-h-[80px]",
        className,
      )}
      {...props}
    />
  );
}

export function StepFormRenderer({
  section,
  formData,
  processoData,
  inheritedKeys,
  invalidFields,
  aiFilledFields,
  autoPreenchendo,
  camposMeta,
  onChange,
  onMelhorar,
  onGerarJustificativa,
  onValidarObjeto,
  documentType,
}: Props) {
  const editorRef = useRef<{ insertToken: (token: string) => void } | null>(null);
  const [priceDrawerOpen, setPriceDrawerOpen] = useState(false);

  const hasValorField = section.fields.some(f => f.key === "valor_estimado" || f.key === "valor_global");
  const isEtpOrTr = documentType === "etp" || documentType === "tr";

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
        <div className="flex-1 space-y-4">
          <RichTextEditor
            value={formData.conteudo_final ?? ""}
            onChange={(html) => onChange("conteudo_final", html)}
          />
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Resumo dos dados preenchidos
            </h4>
            {Object.entries(formData)
              .filter(([k, v]) => v && k !== "meta" && k !== "conteudo_final")
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
        <div className="w-48 shrink-0 space-y-3">
          <h4 className="text-xs font-semibold text-foreground">Dados dinâmicos</h4>
          <p className="text-[10px] text-muted-foreground">
            Clique para inserir tokens dinâmicos no documento.
          </p>
          <div className="space-y-1.5">
            {DYNAMIC_TOKENS.map((token) => (
              <button
                key={token.key}
                className="w-full flex items-center gap-2 rounded-md border border-border/50 px-2.5 py-1.5 text-left hover:bg-muted/50 transition-colors group"
                onClick={() => {
                  const editor = document.querySelector('[contenteditable="true"]') as HTMLDivElement | null;
                  if (editor) {
                    editor.focus();
                    document.execCommand("insertText", false, `{{${token.key}}}`);
                    onChange("conteudo_final", editor.innerHTML);
                  } else {
                    navigator.clipboard.writeText(`{{${token.key}}}`);
                    toast.success(`Token {{${token.key}}} copiado!`);
                  }
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
    const isAiFilled = aiFilledFields?.has(field.key) ?? false;
    const fieldMeta = camposMeta?.[field.key];
    const isLowConfidence = fieldMeta?.confianca === "baixa";
    const hasSources = fieldMeta?.fontes && fieldMeta.fontes.length > 0;
    const isRequired = field.required === true;
    const isInvalid = invalidFields?.has(field.key) ?? false;
    const colSpan = field.colspan ?? (field.type === "textarea" ? 2 : 1);
    const isObjetoField = field.key === "objeto_contratacao" || field.key === "objeto";

    // CORREÇÃO 2: Objeto field never shows "automático" badge
    const showInheritedBadge = isInherited && !isObjetoField;

    // Radio cards
    if (field.type === "radio_cards" && field.radioOptions) {
      return (
        <div key={field.key} className={cn("space-y-2", colSpan === 2 ? "col-span-2" : "col-span-1")}>
          <Label className="text-xs font-medium">
            {field.label}
            {isRequired && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <div className="flex gap-3">
            {field.radioOptions.map((opt) => {
              const isActive = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(field.key, opt.value)}
                  className={cn(
                    "flex-1 rounded-lg border-2 px-4 py-3 text-left transition-all",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-border/80"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                        isActive ? "border-primary" : "border-muted-foreground/40"
                      )}
                    >
                      {isActive && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <span className={cn("text-xs font-medium", isActive ? "text-primary" : "text-foreground")}>
                      {opt.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {isInvalid && <p className="text-[10px] text-destructive">Selecione uma opção</p>}
        </div>
      );
    }

    // Team list
    if (field.type === "team_list") {
      return (
        <div key={field.key} className={cn("space-y-1.5", colSpan === 2 ? "col-span-2" : "col-span-1")}>
          <Label className="text-xs font-medium">{field.label}</Label>
          <TeamListField
            value={formData[field.key] ?? []}
            onChange={(members) => onChange(field.key, members)}
          />
        </div>
      );
    }

    // Textarea with AI (for fields that have showMelhorar or showGerarTexto)
    if (field.type === "textarea" && (field.showMelhorar || field.showGerarTexto)) {
      return (
        <div key={field.key} className={cn(colSpan === 2 ? "col-span-2" : "col-span-1")}>
          <TextAreaComIA
            label={field.label}
            value={value}
            onChange={(v) => onChange(field.key, v)}
            required={isRequired}
            showMelhorar={field.showMelhorar}
            showGerarTexto={field.showGerarTexto}
            contextoSecao={field.contextoSecao}
            documentType={documentType}
            formData={formData}
            isInvalid={isInvalid}
            placeholder={`Digite ${field.label.toLowerCase()}...`}
          />
        </div>
      );
    }

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
            {/* CORREÇÃO 2: No "automático" badge on objeto field */}
            {showInheritedBadge && (
              <Badge
                variant="secondary"
                className="text-[8px] px-1.5 py-0 bg-success/10 text-success border-success/20"
              >
                automático
              </Badge>
            )}
            {/* CORREÇÃO 5: AI badge only when AI filled */}
            {isAiFilled && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[8px] px-1.5 py-0",
                  isLowConfidence
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    : "bg-primary/10 text-primary border-primary/20"
                )}
              >
                ✦ IA {fieldMeta?.confianca === "alta" ? "✓" : fieldMeta?.confianca === "baixa" ? "⚠" : ""}
              </Badge>
            )}
            {hasSources && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-primary/60 hover:text-primary">
                    <BookOpen className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px] max-w-xs">
                  <p className="font-medium mb-1">Baseado em:</p>
                  {fieldMeta!.fontes.map((f, i) => (
                    <p key={i}>• {f}</p>
                  ))}
                </TooltipContent>
              </Tooltip>
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

        {/* CORREÇÃO 4: All textareas auto-resize */}
        {field.type === "textarea" ? (
          <div className="space-y-1">
            <AutosizeTextarea
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              readOnly={field.readOnly}
              placeholder={`Digite ${field.label.toLowerCase()}...`}
              maxLength={field.maxLength}
              minRows={3}
              className={cn(
                "text-sm",
                field.readOnly && "bg-muted cursor-not-allowed",
                isInherited && "border-success/20 bg-success/5",
                isAiFilled && !isLowConfidence && "border-primary/20 bg-primary/5",
                isAiFilled && isLowConfidence && "border-amber-500/30 bg-amber-50",
                isInvalid && "border-destructive"
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
              isInherited && "border-success/20 bg-success/5",
              isInvalid && "border-destructive"
            )}
          />
        ) : field.type === "select" ? (
          <Select
            value={value}
            onValueChange={(v) => onChange(field.key, v)}
            disabled={field.readOnly}
          >
            <SelectTrigger className={cn("text-sm", isInvalid && "border-destructive")}>
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
          <AutosizeTextarea
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            readOnly={field.readOnly}
            placeholder={`Digite ${field.label.toLowerCase()}...`}
            className={cn(
              "text-sm",
              field.readOnly && "bg-muted cursor-not-allowed",
              isInherited && "border-success/20 bg-success/5",
              isInvalid && "border-destructive"
            )}
          />
        )}

        {isInvalid && (
          <p className="text-[10px] text-destructive">Campo obrigatório</p>
        )}
        {isAiFilled && isLowConfidence && fieldMeta?.sugestao && (
          <p className="text-[10px] text-amber-600 flex items-center gap-1">
            ⚠ Sugerimos revisar — {fieldMeta.sugestao}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* AI auto-fill loading banner */}
      {autoPreenchendo && (
        <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 border border-primary/20 px-4 py-2.5 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          Preenchendo campos com IA...
        </div>
      )}

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
                herdados do processo
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

      {/* Price research button for valor fields */}
      {hasValorField && isEtpOrTr && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => setPriceDrawerOpen(true)}
          >
            <Search className="h-3.5 w-3.5" /> Pesquisar preços de mercado
          </Button>
          <PriceResearchDrawer
            open={priceDrawerOpen}
            onOpenChange={setPriceDrawerOpen}
            defaultObjeto={formData.objeto_contratacao ?? processoData?.objeto ?? ""}
            defaultEstado={processoData?.orgao ? undefined : undefined}
            orgaoNome={processoData?.orgao}
            onUseValue={(value) => {
              const key = formData.valor_estimado !== undefined ? "valor_estimado" : "valor_global";
              onChange(key, `R$ ${value.toFixed(2)}`);
            }}
          />
        </>
      )}
    </div>
  );
}
