import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewAlert {
  id: string;
  title: string;
  severity: string;
  source: string;
}

interface Props {
  docType: string;
  onViewImpact: (alert: NewAlert) => void;
}

export function AlertBanner({ docType, onViewImpact }: Props) {
  const [newAlerts, setNewAlerts] = useState<NewAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase
      .channel("doc-alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "monitoring_alerts",
        },
        (payload) => {
          const row = payload.new as any;
          // Check if alert affects this doc type
          const affected = row.affected_doc_types as string[] | null;
          if (affected && affected.length > 0 && !affected.includes(docType)) return;
          if (!row.is_relevant) return;

          setNewAlerts((prev) => [
            ...prev,
            {
              id: row.id,
              title: row.title,
              severity: row.severity,
              source: row.source,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [docType]);

  const visibleAlerts = newAlerts.filter((a) => !dismissed.has(a.id));
  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-2.5 animate-in slide-in-from-top-2",
            alert.severity === "critical"
              ? "bg-destructive/5 border-destructive/30"
              : "bg-amber-500/5 border-amber-500/30"
          )}
        >
          <AlertTriangle
            className={cn(
              "h-4 w-4 shrink-0",
              alert.severity === "critical" ? "text-destructive" : "text-amber-500"
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              Nova orientação {alert.source} sobre este tema
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{alert.title}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[10px] gap-1 text-primary shrink-0"
            onClick={() => onViewImpact(alert)}
          >
            Ver impacto <ArrowRight className="h-3 w-3" />
          </Button>
          <button
            onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
