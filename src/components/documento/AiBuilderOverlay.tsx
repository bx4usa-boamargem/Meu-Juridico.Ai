import { useState, useEffect } from "react";
import { Loader2, Search, Scale, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isActive: boolean;
  currentPhase: number; // 0-3
}

const PHASES = [
  { icon: Search, label: "Analisando legislação aplicável...", color: "text-primary" },
  { icon: Scale, label: "Consultando jurisprudência TCU e CGU...", color: "text-amber-500" },
  { icon: FileText, label: "Preparando seu documento...", color: "text-emerald-500" },
];

export function AiBuilderOverlay({ isActive, currentPhase }: Props) {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground">Construindo seu documento</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          A IA está analisando o objeto e preenchendo cada seção com base na legislação vigente e base de conhecimento.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {PHASES.map((phase, i) => {
          const PhaseIcon = phase.icon;
          const isDone = currentPhase > i;
          const isCurrent = currentPhase === i;

          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-500",
                isCurrent && "bg-primary/5 border border-primary/20",
                isDone && "bg-muted/50",
                !isDone && !isCurrent && "opacity-40"
              )}
            >
              <div className="shrink-0">
                {isDone ? (
                  <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                ) : isCurrent ? (
                  <Loader2 className={cn("h-5 w-5 animate-spin", phase.color)} />
                ) : (
                  <PhaseIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <span className={cn(
                "text-sm",
                isCurrent && "font-medium text-foreground",
                isDone && "text-muted-foreground line-through",
                !isDone && !isCurrent && "text-muted-foreground"
              )}>
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
