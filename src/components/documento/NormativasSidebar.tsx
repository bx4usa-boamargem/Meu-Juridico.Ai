import { AlertTriangle, ExternalLink, Shield, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Alert {
  titulo: string;
  fonte: string;
  impacto: string;
  url: string | null;
  severidade: string;
}

interface FieldMeta {
  confianca: string;
  fontes: string[];
  sugestao: string;
}

interface Props {
  alertas: Alert[];
  camposMeta: Record<string, FieldMeta>;
  currentSectionFields?: string[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-slate-500 text-white",
};

export function NormativasSidebar({ alertas, camposMeta, currentSectionFields }: Props) {
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);

  // Filter relevant sources for current section
  const relevantSources = new Set<string>();
  if (currentSectionFields) {
    for (const fieldId of currentSectionFields) {
      const meta = camposMeta[fieldId];
      if (meta?.fontes) {
        meta.fontes.forEach(f => relevantSources.add(f));
      }
    }
  }

  const hasContent = alertas.length > 0 || relevantSources.size > 0;

  if (!hasContent) {
    return (
      <div className="w-[280px] shrink-0 border-l bg-card/50 flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Normativas Aplicáveis
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">
            Nenhuma normativa específica encontrada para este objeto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[280px] shrink-0 border-l bg-card/50 flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Normativas Aplicáveis
        </h3>
        <p className="text-[10px] text-muted-foreground mt-1">
          Alertas e fontes jurídicas relevantes para este documento.
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Alertas */}
          {alertas.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Alertas ({alertas.length})
              </h4>
              {alertas.map((alerta, i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-background p-2.5 space-y-1.5 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setExpandedAlert(expandedAlert === i ? null : i)}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge className={cn("text-[8px] px-1.5 py-0", SEVERITY_COLORS[alerta.severidade] ?? SEVERITY_COLORS.medium)}>
                          {alerta.severidade}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground">{alerta.fonte}</span>
                      </div>
                      <p className="text-[11px] font-medium text-foreground leading-tight">
                        {alerta.titulo}
                      </p>
                    </div>
                    {expandedAlert === i ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>

                  {expandedAlert === i && (
                    <div className="mt-2 space-y-2">
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {alerta.impacto?.substring(0, 300) || "Sem análise de impacto disponível."}
                      </p>
                      {alerta.url && (
                        <a
                          href={alerta.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" /> Ver fonte
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Fontes jurídicas usadas nesta seção */}
          {relevantSources.size > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Fontes desta seção
              </h4>
              {Array.from(relevantSources).map((source, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/10 p-2">
                  <Info className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  <span className="text-[10px] text-foreground">{source}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
