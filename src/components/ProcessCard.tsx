import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DocInfo {
  id: string;
  tipo: string | null;
  status: string | null;
  posicao_cadeia: number | null;
}

interface ProcessCardProps {
  id: string;
  numero_processo: string | null;
  orgao: string | null;
  objeto: string | null;
  modalidade: string | null;
  status: string | null;
  created_at: string;
  documentos?: DocInfo[];
  totalChainSteps?: number;
}

const statusVariant: Record<string, string> = {
  rascunho: "secondary",
  ativo: "default",
  finalizado: "outline",
};

export function ProcessCard({
  id,
  numero_processo,
  orgao,
  objeto,
  modalidade,
  status,
  created_at,
  documentos = [],
  totalChainSteps = 5,
}: ProcessCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => navigate(`/processo/${id}`)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">
              {numero_processo || "Sem número"}
            </p>
            {orgao && (
              <p className="text-xs text-muted-foreground truncate">{orgao}</p>
            )}
          </div>
          <Badge variant={statusVariant[status ?? "rascunho"] as any} className="shrink-0 text-[10px]">
            {status ?? "rascunho"}
          </Badge>
        </div>

        {objeto && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {objeto}
          </p>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="bg-muted px-1.5 py-0.5 rounded">{modalidade || "—"}</span>
          <span>{new Date(created_at).toLocaleDateString("pt-BR")}</span>
        </div>

        {/* Chain progress dots */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalChainSteps }).map((_, i) => {
            const doc = documentos.find((d) => d.posicao_cadeia === i);
            return (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  doc?.status === "aprovado"
                    ? "bg-success"
                    : doc?.status === "rascunho"
                    ? "bg-warning"
                    : "bg-border"
                )}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
