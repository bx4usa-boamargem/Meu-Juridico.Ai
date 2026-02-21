import { Clock, Sparkles, Scale, Lightbulb, BookOpen, MessageSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  onMelhorarClick?: () => void;
}

const tools = [
  { id: "historico", label: "Histórico", icon: Clock, active: false },
  { id: "melhorar", label: "Melhorar IA", icon: Sparkles, active: true },
  { id: "validacao", label: "Validação Jurídica", icon: Scale, active: false },
  { id: "sugestoes", label: "Sugestões", icon: Lightbulb, active: false },
  { id: "biblioteca", label: "Biblioteca", icon: BookOpen, active: false },
  { id: "assistente", label: "Assistente IA", icon: MessageSquare, active: false },
];

export function DocumentToolsBar({ onMelhorarClick }: Props) {
  return (
    <div className="w-12 shrink-0 border-l bg-muted/20 flex flex-col items-center py-4 gap-2">
      {tools.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <button
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                tool.active
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground/50 cursor-not-allowed"
              )}
              onClick={() => {
                if (tool.id === "melhorar" && onMelhorarClick) onMelhorarClick();
              }}
              disabled={!tool.active}
            >
              <tool.icon className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-[10px]">
            {tool.active ? tool.label : `${tool.label} — Em breve`}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
