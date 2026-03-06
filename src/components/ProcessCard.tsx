import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  status?: string | null;
  created_at: string;
  documentos?: DocInfo[];
  totalChainSteps?: number;
  responsavel_nome?: string;
  responsavel_avatar?: string;
}

const statusVariant: Record<string, string> = {
  rascunho: "secondary",
  ativo: "default",
  finalizado: "outline",
};

// Nova ordem técnica da cadeia
const CHAIN_STEPS = [
  { key: "pca", label: "PCA" },
  { key: "dfd", label: "DFD" },
  { key: "etp", label: "ETP" },
  { key: "tr", label: "TR" },
  { key: "pesquisa_precos", label: "Pesquisa" },
  { key: "mapa_riscos", label: "Riscos" },
  { key: "parecer_juridico", label: "Parecer" },
  { key: "edital", label: "Edital" },
  { key: "contrato", label: "Contrato" },
];

const STEP_STATUS_COLORS: Record<string, string> = {
  aprovado: "bg-emerald-500",
  rascunho: "bg-amber-400",
  proximo: "bg-border",
  bloqueado: "bg-border",
};

const STEP_STATUS_LABELS: Record<string, string> = {
  aprovado: "Aprovado",
  rascunho: "Em andamento",
  proximo: "Próximo",
  bloqueado: "Bloqueado",
};

function getHealthColor(documentos: DocInfo[], createdAt: string): "green" | "yellow" | "red" {
  if (!documentos.length) {
    const days = (Date.now() - new Date(createdAt).getTime()) / 86400000;
    if (days > 15) return "red";
    if (days > 7) return "yellow";
    return "green";
  }
  return "green";
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
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
  responsavel_nome,
  responsavel_avatar,
}: ProcessCardProps) {
  const navigate = useNavigate();

  const steps = CHAIN_STEPS.map((step, i) => {
    const doc = documentos.find((d) => d.tipo === step.key || d.posicao_cadeia === i);
    const docStatus = doc?.status ?? null;
    let stepStatus: "aprovado" | "rascunho" | "proximo" | "bloqueado" = "bloqueado";
    if (docStatus === "aprovado") stepStatus = "aprovado";
    else if (docStatus === "rascunho") stepStatus = "rascunho";
    else {
      const prevKey = i > 0 ? CHAIN_STEPS[i - 1].key : null;
      const prevDoc = prevKey ? documentos.find((d) => d.tipo === prevKey || d.posicao_cadeia === i - 1) : { status: "aprovado" };
      if (i === 0 || prevDoc?.status === "aprovado") stepStatus = "proximo";
    }
    return { ...step, status: stepStatus };
  });

  const completed = steps.filter((s) => s.status === "aprovado").length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);
  const health = getHealthColor(documentos, created_at);

  const healthColors = {
    green: "bg-emerald-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all group relative bg-card"
      onClick={() => navigate(`/processo/${id}`)}
    >
      {/* Health dot */}
      <div className={cn("absolute top-3 right-3 h-2.5 w-2.5 rounded-full", healthColors[health])} />

      <CardContent className="p-4 space-y-3">
        {/* Header: número + badge */}
        <div className="flex items-start justify-between gap-2 pr-4">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{numero_processo || "Sem número"}</p>
            {orgao && <p className="text-xs text-muted-foreground truncate">{orgao}</p>}
          </div>
          {status && (
            <Badge variant={(statusVariant[status] || "rascunho") as "default" | "secondary" | "destructive" | "outline"} className="shrink-0 text-[10px]">
              {status}
            </Badge>
          )}
        </div>

        {/* Objeto */}
        {objeto && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{objeto}</p>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm font-medium border border-slate-200">
            {modalidade || "—"}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="opacity-75">{new Date(created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}</span>
            <Avatar className="h-5 w-5 border border-white shrink-0 shadow-sm">
              <AvatarImage src={responsavel_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${numero_processo}&backgroundColor=1A56DB`} />
              <AvatarFallback className="text-[10px]">{getInitials(orgao)}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground font-medium">
            {completed}/{total} etapas — {pct}%
          </p>
        </div>

        {/* Chain pipeline bars */}
        <div className="flex items-center gap-[2px] pt-1">
          {steps.map((step) => (
            <Tooltip key={step.key}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "h-1.5 flex-1 rounded-sm transition-colors",
                    STEP_STATUS_COLORS[step.status]
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px] px-2 py-1">
                {step.label} — {STEP_STATUS_LABELS[step.status]}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
