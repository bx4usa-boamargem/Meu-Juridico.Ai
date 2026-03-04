import { Check, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SectionAction = "keep" | "improve" | "edit";

interface Props {
  currentAction: SectionAction | null;
  onAction: (action: SectionAction) => void;
  hasAiContent: boolean;
}

export function SectionActionBar({ currentAction, onAction, hasAiContent }: Props) {
  if (!hasAiContent) return null;

  return (
    <div className="flex items-center gap-2 py-2">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mr-1">
        Decisão:
      </span>
      <Button
        variant={currentAction === "keep" ? "default" : "outline"}
        size="sm"
        className={cn(
          "h-7 text-[11px] gap-1.5 px-3",
          currentAction === "keep" && "bg-emerald-600 hover:bg-emerald-700"
        )}
        onClick={() => onAction("keep")}
      >
        <Check className="h-3 w-3" /> Manter
      </Button>
      <Button
        variant={currentAction === "improve" ? "default" : "outline"}
        size="sm"
        className={cn(
          "h-7 text-[11px] gap-1.5 px-3",
          currentAction === "improve" && "bg-primary hover:bg-primary/90"
        )}
        onClick={() => onAction("improve")}
      >
        <Sparkles className="h-3 w-3" /> Melhorar
      </Button>
      <Button
        variant={currentAction === "edit" ? "default" : "outline"}
        size="sm"
        className={cn(
          "h-7 text-[11px] gap-1.5 px-3",
          currentAction === "edit" && "bg-amber-600 hover:bg-amber-700"
        )}
        onClick={() => onAction("edit")}
      >
        <Pencil className="h-3 w-3" /> Editar
      </Button>
    </div>
  );
}
