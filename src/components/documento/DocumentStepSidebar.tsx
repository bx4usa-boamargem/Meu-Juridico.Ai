import { FileText, Check, Lock, Pencil, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { SectionDef, WorkflowState } from "@/lib/document-sections";

interface Props {
  sections: SectionDef[];
  workflow: WorkflowState;
  formData: Record<string, any>;
  documentTitle?: string;
  documentNumber?: string;
  disabledSections?: Set<string>;
  onSelectStep: (stepId: string) => void;
  onToggleSection?: (sectionId: string) => void;
}

function MiniToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn(
        "w-8 h-4 rounded-full transition-colors flex items-center px-0.5 shrink-0",
        enabled ? "bg-[hsl(var(--primary))]" : "bg-muted"
      )}
      title={enabled ? "Desativar seção" : "Ativar seção"}
    >
      <span className={cn(
        "w-3 h-3 bg-white rounded-full transition-transform",
        enabled ? "translate-x-4" : "translate-x-0"
      )} />
    </button>
  );
}

export function DocumentStepSidebar({
  sections,
  workflow,
  formData,
  documentTitle,
  documentNumber,
  disabledSections = new Set(),
  onSelectStep,
  onToggleSection,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredSections = search
    ? sections.filter((s) => s.label.toLowerCase().includes(search.toLowerCase()))
    : sections;

  return (
    <div className="w-[260px] shrink-0 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 space-y-2 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate flex-1">
            {documentTitle ?? "Documento"}
          </h3>
          <button className="text-muted-foreground hover:text-foreground">
            <Pencil className="h-3 w-3" />
          </button>
        </div>
        {documentNumber && (
          <p className="text-[10px] text-muted-foreground">{documentNumber}</p>
        )}
        <p className="text-[10px] text-muted-foreground">
          Todos os objetos do modelo escolhido
        </p>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar objeto..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {filteredSections.map((section) => {
          const stepState = workflow.steps[section.id];
          const isActive = workflow.current_step === section.id;
          const isDisabled = disabledSections.has(section.id);
          const isEnabled = !isDisabled && stepState?.enabled !== false;
          const status = stepState?.status ?? "locked";
          const isComplete = status === "complete";

          return (
            <div
              key={section.id}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all cursor-pointer group",
                isActive && !isDisabled && "bg-primary/10 border-l-[3px] border-l-primary",
                !isActive && isEnabled && "hover:bg-muted/50",
                isDisabled && "opacity-40"
              )}
              onClick={() => {
                if (!isDisabled && isEnabled && status !== "locked") onSelectStep(section.id);
              }}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {isComplete && !isDisabled ? (
                  <div className="h-5 w-5 rounded-full bg-success flex items-center justify-center">
                    <Check className="h-3 w-3 text-success-foreground" />
                  </div>
                ) : isActive && !isDisabled ? (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <FileText className="h-3 w-3 text-primary-foreground" />
                  </div>
                ) : (
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "text-xs block truncate",
                    isActive && !isDisabled ? "font-semibold text-primary" : "text-foreground",
                    isDisabled && "line-through"
                  )}
                >
                  {section.label}
                </span>
              </div>

              {/* Toggle or Lock icon */}
              {section.optional ? (
                <MiniToggle
                  enabled={!isDisabled}
                  onToggle={() => onToggleSection?.(section.id)}
                />
              ) : (
                <span className="text-muted-foreground/50 text-xs shrink-0" title="Seção obrigatória por lei">
                  <Lock className="h-3 w-3" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
