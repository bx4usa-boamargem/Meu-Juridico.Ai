import { FileText, Check, Pencil, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
  onSelectStep: (stepId: string) => void;
  onToggleStep: (stepId: string, enabled: boolean) => void;
}

export function DocumentStepSidebar({
  sections,
  workflow,
  formData,
  documentTitle,
  documentNumber,
  onSelectStep,
  onToggleStep,
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
          const isEnabled = stepState?.enabled !== false;
          const status = stepState?.status ?? "locked";
          const isComplete = status === "complete";

          return (
            <div
              key={section.id}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all cursor-pointer group",
                isActive && "bg-primary/10 border-l-[3px] border-l-primary",
                !isActive && isEnabled && "hover:bg-muted/50",
                !isEnabled && "opacity-40"
              )}
              onClick={() => {
                if (isEnabled && status !== "locked") onSelectStep(section.id);
              }}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {isComplete ? (
                  <div className="h-5 w-5 rounded-full bg-success flex items-center justify-center">
                    <Check className="h-3 w-3 text-success-foreground" />
                  </div>
                ) : isActive ? (
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
                    isActive ? "font-semibold text-primary" : "text-foreground"
                  )}
                >
                  {section.label}
                </span>
              </div>

              {/* Toggle — disabled for required sections */}
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => onToggleStep(section.id, checked)}
                className="shrink-0 scale-75"
                disabled={section.required}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
