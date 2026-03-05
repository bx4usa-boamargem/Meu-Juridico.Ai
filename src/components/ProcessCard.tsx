import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  updated_at?: string;
  documentos?: DocInfo[];
  totalChainSteps?: number;
}

const statusVariant: Record<string, string> = {
  rascunho: "secondary",
  ativo: "default",
  finalizado: "outline",
};

const STEP_LABELS: Record<string, string> = {
  dfd: "DFD",
  etp: "ETP",
  pesquisa_precos: "Pesquisa de Preços",
  mapa_riscos: "Mapa de Riscos",
  tr: "Termo de Referência",
  parecer_juridico: "Parecer Jurídico",
  edital: "Edital",
  publicacao: "Publicação",
  contrato: "Contrato",
};

const STATUS_ICONS: Record<string, string> = {
  aprovado: "✅",
  rascunho: "🔄",
  proximo: "⏳",
  bloqueado: "🔒",
};

function getHealthColor(documentos: DocInfo[], createdAt: string): "green" | "yellow" | "red" {
  if (!documentos.length) {
    const daysSinceCreation = (Date.now() - new Date(createdAt).getTime()) / 86400000;
    if (daysSinceCreation > 15) return "red";
    if (daysSinceCreation > 7) return "yellow";
    return "green";
  }
  // Check if any draft doc hasn't been updated in a while
  // We don't have updated_at per doc in the select, so use process-level heuristic
  return "green";
}

export function ProcessCard({
  id,
  numero_processo,
  orgao,
  objeto,
  modalidade,
  status,
  created_at,
  documentos = [],
  totalChainSteps = 7,
}: ProcessCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/processo/${id}`);
  };

  // Build step statuses from documentos
  const stepKeys = Object.keys(STEP_LABELS).slice(0, totalChainSteps);
  const steps = stepKeys.map((key, i) => {
    const doc = documentos.find((d) => d.tipo === key || d.posicao_cadeia === i);
    const docStatus = doc?.status ?? null;
    let stepStatus: "aprovado" | "rascunho" | "proximo" | "bloqueado" = "bloqueado";
    if (docStatus === "aprovado") stepStatus = "aprovado";
    else if (docStatus === "rascunho") stepStatus = "rascunho";
    else {
      // Check if previous step is done
      const prevDoc = i === 0 ? { status: "aprovado" } : documentos.find((d) => d.tipo === stepKeys[i - 1] || d.posicao_cadeia === i - 1);
      if (i === 0 || prevDoc?.status === "aprovado") stepStatus = "proximo";
    }
    return { key, label: STEP_LABELS[key], status: stepStatus };
  });

  const completed = steps.filter((s) => s.status === "aprovado").length;
  const total = steps.length;
  const health = getHealthColor(documentos, created_at);

  const healthColors = {
    green: "bg-emerald-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow group relative"
      onClick={handleClick}
    >
      {/* Health indicator */}
      <div className={cn("absolute top-3 right-3 h-2.5 w-2.5 rounded-full", healthColors[health])} />

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 pr-4">
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

        <p className="text-[10px] text-muted-foreground font-medium">
          {completed} de {total} etapas concluídas
        </p>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="bg-muted px-1.5 py-0.5 rounded">{modalidade || "—"}</span>
          <span>{new Date(created_at).toLocaleDateString("pt-BR")}</span>
        </div>

        {/* Chain progress bars with individual tooltips */}
        <div className="flex items-center gap-0.5">
          {steps.map((step) => (
            <Tooltip key={step.key}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    step.status === "aprovado" && "bg-emerald-500",
                    step.status === "rascunho" && "bg-amber-400",
                    (step.status === "proximo" || step.status === "bloqueado") && "bg-border"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px] px-2 py-1">
                {STATUS_ICONS[step.status]} {step.label} — {
                  step.status === "aprovado" ? "Aprovado" :
                  step.status === "rascunho" ? "Em andamento" :
                  step.status === "proximo" ? "Próximo" : "Bloqueado"
                }
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
