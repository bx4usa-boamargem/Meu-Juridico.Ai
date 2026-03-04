import { useState } from "react";
import { Lightbulb, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SuggestedSection {
  id: string;
  label: string;
  reason: string;
}

const COMPLEX_KEYWORDS: Record<string, SuggestedSection[]> = {
  "tecnologia|sistema|software|ti |hardware|infraestrutura de ti|cloud|saas": [
    { id: "matriz_riscos", label: "Matriz de Riscos", reason: "Objetos de TI exigem análise de riscos técnicos e de segurança (Art. 18 §3º, Lei 14.133)" },
    { id: "requisitos_seguranca", label: "Requisitos de Segurança da Informação", reason: "LGPD e normas de SI aplicáveis a contratações de TI" },
    { id: "transicao_contratual", label: "Transição Contratual", reason: "Plano de migração/transição necessário para continuidade de serviços de TI" },
  ],
  "obra|engenharia|construção|reforma|edificação|pavimentação": [
    { id: "matriz_riscos", label: "Matriz de Riscos", reason: "Obrigatória para obras e serviços de engenharia (Art. 22 §3º, Lei 14.133)" },
    { id: "cronograma_fisico", label: "Cronograma Físico-Financeiro", reason: "Detalhamento das etapas e desembolso para obras" },
    { id: "bdi", label: "Composição do BDI", reason: "Bonificação e Despesas Indiretas obrigatórias em planilhas de obra" },
  ],
  "consultoria|assessoria|capacitação|treinamento": [
    { id: "matriz_riscos", label: "Matriz de Riscos", reason: "Recomendada pelo TCU para contratações intelectuais" },
    { id: "qualificacao_tecnica", label: "Qualificação Técnica Diferenciada", reason: "Justificativa para exigência de qualificação específica" },
  ],
};

interface Props {
  objeto: string;
  onAddSection: (section: SuggestedSection) => void;
}

export function SectionSuggestionBanner({ objeto, onAddSection }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [addedSections, setAddedSections] = useState<Set<string>>(new Set());

  if (!objeto || objeto.length < 10) return null;

  const objetoLower = objeto.toLowerCase();
  const suggestions: SuggestedSection[] = [];
  const seen = new Set<string>();

  for (const [pattern, sections] of Object.entries(COMPLEX_KEYWORDS)) {
    const keywords = pattern.split("|");
    if (keywords.some((kw) => objetoLower.includes(kw.trim()))) {
      for (const s of sections) {
        if (!seen.has(s.id) && !dismissed.has(s.id) && !addedSections.has(s.id)) {
          suggestions.push(s);
          seen.add(s.id);
        }
      }
    }
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs font-medium text-foreground">
          Seções adicionais sugeridas para este objeto
        </p>
        <Badge variant="secondary" className="text-[8px] ml-auto">
          {suggestions.length} sugestão{suggestions.length > 1 ? "ões" : ""}
        </Badge>
      </div>
      <div className="space-y-1.5">
        {suggestions.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-2 rounded-md bg-background border border-border/50 px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-foreground">{s.label}</p>
              <p className="text-[10px] text-muted-foreground">{s.reason}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] gap-1 px-2 shrink-0 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => {
                onAddSection(s);
                setAddedSections((prev) => new Set(prev).add(s.id));
              }}
            >
              <Plus className="h-3 w-3" /> Adicionar
            </Button>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(s.id))}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
