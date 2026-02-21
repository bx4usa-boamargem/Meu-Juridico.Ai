import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Link2 } from "lucide-react";

interface Props {
  processoId: string;
  tipoDocumento: string;
  parentDocId?: string | null;
  onApply: (key: string, value: string) => void;
}

export function InheritedDataPanel({ processoId, tipoDocumento, parentDocId, onApply }: Props) {
  const { data: inherited, isLoading } = useQuery({
    queryKey: ["heranca", processoId, tipoDocumento],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("resolver_heranca", {
        p_processo_id: processoId,
        p_tipo_documento: tipoDocumento,
        p_parent_doc_id: parentDocId ?? undefined,
      });
      if (error) throw error;
      return data as Record<string, any> | null;
    },
    enabled: !!processoId && !!tipoDocumento,
  });

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
      </div>
    );
  }

  if (!inherited || Object.keys(inherited).length === 0) {
    return (
      <div className="p-4">
        <p className="text-xs text-muted-foreground italic">
          Nenhum dado herdado disponível para este documento.
        </p>
      </div>
    );
  }

  const entries = Object.entries(inherited).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Dados Herdados
        </span>
      </div>

      {entries.map(([key, value]) => (
        <div key={key} className="border rounded-md p-2.5 space-y-1 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium uppercase">
              {key.replace(/_/g, " ")}
            </span>
            <Badge variant="outline" className="text-[8px] px-1 py-0">
              herdado
            </Badge>
          </div>
          <p className="text-xs truncate">{String(value)}</p>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px] px-2 text-primary"
            onClick={() => onApply(key, String(value))}
          >
            <ArrowRight className="h-3 w-3 mr-1" /> Aplicar
          </Button>
        </div>
      ))}
    </div>
  );
}
