import { useNavigate } from "react-router-dom";
import { Check, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocInfo {
  id: string;
  tipo: string | null;
  status: string | null;
  posicao_cadeia: number | null;
}

interface Props {
  processoId: string;
  cadeia: string[];
  documentos: DocInfo[];
}

export function DocumentChainView({ processoId, cadeia, documentos }: Props) {
  const navigate = useNavigate();

  const getDocForTipo = (tipo: string) =>
    documentos.find((d) => d.tipo === tipo);

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-4">
      {cadeia.map((tipo, i) => {
        const doc = getDocForTipo(tipo);
        const isAprovado = doc?.status === "aprovado";
        const isRascunho = doc?.status === "rascunho";
        const exists = !!doc;

        return (
          <div key={tipo} className="flex items-center">
            {i > 0 && (
              <div className="w-6 h-px bg-border mx-1 shrink-0" />
            )}
            <button
              onClick={() => {
                if (doc) navigate(`/processo/${processoId}/documento/${doc.id}`);
              }}
              disabled={!exists}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-4 py-3 text-xs font-medium transition-colors min-w-[80px]",
                isAprovado && "border-green-500 bg-green-50 text-green-700",
                isRascunho && "border-yellow-500 bg-yellow-50 text-yellow-700",
                !exists && "border-muted bg-muted/50 text-muted-foreground cursor-not-allowed",
                exists && !isAprovado && !isRascunho && "border-border"
              )}
            >
              {isAprovado ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : isRascunho ? (
                <Circle className="h-4 w-4 text-yellow-500" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              {tipo}
            </button>
          </div>
        );
      })}
    </div>
  );
}
