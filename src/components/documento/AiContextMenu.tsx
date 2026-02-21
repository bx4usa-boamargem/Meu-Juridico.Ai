import { Sparkles, Scale, Building2, BookOpen, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AiAction = "melhorar" | "fundamentar" | "adequar_orgao" | "base_legal" | "diferenciar";

interface AiContextMenuProps {
  position: { top: number; left: number };
  onAction: (action: AiAction) => void;
  onClose: () => void;
}

const ACTIONS: { action: AiAction; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { action: "melhorar", label: "Melhorar redação", icon: Sparkles },
  { action: "fundamentar", label: "Fundamentar juridicamente", icon: Scale },
  { action: "adequar_orgao", label: "Adequar ao órgão", icon: Building2 },
  { action: "base_legal", label: "Inserir base legal", icon: BookOpen },
  { action: "diferenciar", label: "Diferenciar da seção anterior", icon: GitCompareArrows },
];

export function AiContextMenu({ position, onAction, onClose }: AiContextMenuProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Menu */}
      <div
        className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[220px] animate-in fade-in-0 zoom-in-95"
        style={{ top: position.top, left: position.left }}
      >
        <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          IA Contextual
        </div>
        {ACTIONS.map(({ action, label, icon: Icon }) => (
          <Button
            key={action}
            variant="ghost"
            size="sm"
            className="w-full justify-start h-8 text-xs gap-2 font-normal"
            onClick={() => { onAction(action); onClose(); }}
          >
            <Icon className="h-3.5 w-3.5 text-primary" />
            {label}
          </Button>
        ))}
      </div>
    </>
  );
}
