import { FileText, Check, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { SectionDef, WorkflowState } from "@/lib/document-sections";
import { calculateSectionCompletion } from "@/lib/document-sections";

interface Props {
  sections: SectionDef[];
  workflow: WorkflowState;
  formData: Record<string, any>;
  onSelectStep: (stepId: string) => void;
  onToggleStep: (stepId: string, enabled: boolean) => void;
}

export function DocumentStepSidebar({ sections, workflow, formData, onSelectStep, onToggleStep }: Props) {
  return (
    <div className="w-[260px] shrink-0 border-r bg-muted/30 flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Etapas do documento
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {sections.map((section) => {
          const stepState = workflow.steps[section.id];
          const isActive = workflow.current_step === section.id;
          const isEnabled = stepState?.enabled !== false;
          const status = stepState?.status ?? "locked";
          const { filled, total } = calculateSectionCompletion(section, formData);
          const isComplete = status === "complete";
          const isLocked = status === "locked";

          return (
            <div
              key={section.id}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2.5 transition-all cursor-pointer group",
                isActive && "bg-primary/8 border-l-2 border-primary",
                !isActive && "border-l-2 border-transparent",
                !isEnabled && "opacity-40",
                isLocked && isEnabled && "opacity-60"
              )}
              onClick={() => {
                if (isEnabled && !isLocked) onSelectStep(section.id);
              }}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {isLocked ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                ) : isComplete ? (
                  <div className="h-4 w-4 rounded-full bg-success flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-success-foreground" />
                  </div>
                ) : (
                  <FileText className="h-3.5 w-3.5 text-primary" />
                )}
              </div>

              {/* Label + progress */}
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-xs block truncate",
                  isActive ? "font-semibold text-primary" : "text-foreground"
                )}>
                  {section.label}
                </span>
                {total > 0 && isEnabled && (
                  <span className="text-[9px] text-muted-foreground">
                    {filled}/{total} campos
                  </span>
                )}
              </div>

              {/* Toggle */}
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => onToggleStep(section.id, checked)}
                className="shrink-0 scale-75"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
