import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, LayoutGrid, List, FolderKanban, CheckCircle2, Clock, Lock, Loader2 } from "lucide-react";
import { NovoProcessoDialog } from "@/components/NovoProcessoDialog";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const MOCK_AVATARS = [
  { initials: "JS", color: "bg-primary" },
  { initials: "MF", color: "bg-success" },
  { initials: "AL", color: "bg-warning" },
  { initials: "RC", color: "bg-destructive" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; borderColor: string }> = {
  ativo: { label: "Em Andamento", color: "bg-primary/10 text-primary", borderColor: "border-t-primary" },
  rascunho: { label: "Rascunho", color: "bg-warning/10 text-warning", borderColor: "border-t-warning" },
  finalizado: { label: "Finalizado", color: "bg-success/10 text-success", borderColor: "border-t-success" },
  arquivado: { label: "Arquivado", color: "bg-muted text-muted-foreground", borderColor: "border-t-muted-foreground" },
};

const PIPELINE_STEPS = ["DFD", "ETP", "TR", "MR", "Edital", "Pesq.", "Parecer", "Contrato", "Ata"];

const STEP_STATUS_ICON: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  aprovado: { icon: CheckCircle2, className: "text-success" },
  rascunho: { icon: Loader2, className: "text-warning" },
  proximo: { icon: Clock, className: "text-muted-foreground" },
  bloqueado: { icon: Lock, className: "text-muted-foreground/50" },
};

function getProgressInfo(documentos: any[]) {
  const completed = documentos?.filter((d: any) => d.status === "aprovado").length ?? 0;
  const total = PIPELINE_STEPS.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  let barColor = "bg-warning";
  if (pct >= 70) barColor = "bg-success";
  else if (pct >= 40) barColor = "bg-primary";
  return { completed, total, pct, barColor };
}

function getHealthIndicator(updatedAt: string) {
  const diff = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (diff > 15) return { color: "bg-destructive", label: "Atrasado" };
  if (diff > 7) return { color: "bg-warning", label: "Inativo" };
  return { color: "bg-success", label: "Em dia" };
}

function getPipelineSteps(documentos: any[]) {
  return PIPELINE_STEPS.map((label, i) => {
    const doc = documentos?.find((d: any) => d.posicao_cadeia === i + 1);
    let status = "bloqueado";
    if (doc?.status === "aprovado") status = "aprovado";
    else if (doc?.status === "rascunho" || doc?.status === "gerando") status = "rascunho";
    else if (doc) status = "proximo";
    return { label, status };
  });
}

export default function ProcessosKanban() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();

  const { data: processos, isLoading, refetch } = useQuery({
    queryKey: ["processos-kanban"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos")
        .select(`*, documentos (id, tipo, status, posicao_cadeia)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = processos?.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.numero_processo?.toLowerCase().includes(q) ||
      p.orgao?.toLowerCase().includes(q) ||
      p.objeto?.toLowerCase().includes(q)
    );
  });

  const columns = ["ativo", "rascunho", "finalizado"];
  const grouped = columns.map((status) => ({
    status,
    config: STATUS_CONFIG[status] ?? STATUS_CONFIG.rascunho,
    items: filtered?.filter((p) => (p.status ?? "rascunho") === status) ?? [],
  }));

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Processos</h1>
          <p className="text-sm text-muted-foreground">
            {filtered?.length ?? 0} processos encontrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-3 py-2 text-sm flex items-center gap-1.5 transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent"
              )}
            >
              <LayoutGrid className="h-4 w-4" /> Grade
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-2 text-sm flex items-center gap-1.5 transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent"
              )}
            >
              <List className="h-4 w-4" /> Lista
            </button>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Processo
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número, órgão ou objeto..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {grouped.map((col) => (
            <div key={col.status} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={cn("font-medium", col.config.color)}>
                  {col.config.label}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">{col.items.length}</span>
              </div>

              <div className="space-y-3">
                {col.items.length === 0 ? (
                  <div className="border border-dashed rounded-lg p-8 text-center">
                    <p className="text-xs text-muted-foreground">Nenhum processo</p>
                  </div>
                ) : (
                  col.items.map((p) => {
                    const { completed, total, pct, barColor } = getProgressInfo(p.documentos ?? []);
                    const health = getHealthIndicator(p.updated_at || p.created_at);
                    const pipeline = getPipelineSteps(p.documentos ?? []);
                    const avatars = MOCK_AVATARS.slice(0, Math.max(1, Math.floor(Math.random() * 4) + 1));

                    return (
                      <Tooltip key={p.id}>
                        <TooltipTrigger asChild>
                          <Card
                            className={cn(
                              "cursor-pointer hover:shadow-md transition-all border-t-[3px]",
                              col.config.borderColor
                            )}
                            onClick={() => navigate(`/processo/${p.id}`)}
                          >
                            <CardContent className="p-4 space-y-3">
                              {/* Tags + Health */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {p.modalidade && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">
                                      {p.modalidade}
                                    </span>
                                  )}
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                    {p.numero_processo || "S/N"}
                                  </span>
                                </div>
                                <div className={cn("h-2.5 w-2.5 rounded-full", health.color)} title={health.label} />
                              </div>

                              {/* Title */}
                              <p className="text-sm font-semibold leading-snug line-clamp-2">
                                {p.objeto || "Objeto não informado"}
                              </p>

                              {p.orgao && (
                                <p className="text-xs text-muted-foreground truncate">{p.orgao}</p>
                              )}

                              {/* Segmented progress bar */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{completed}/{total} documentos</span>
                                  <span className="font-semibold">{pct}%</span>
                                </div>
                                <div className="flex gap-0.5">
                                  {pipeline.map((step, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        "h-2 flex-1 rounded-sm transition-all",
                                        step.status === "aprovado" ? "bg-success" :
                                        step.status === "rascunho" ? "bg-warning" :
                                        step.status === "proximo" ? "bg-primary/30" :
                                        "bg-muted"
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(p.updated_at || p.created_at).toLocaleDateString("pt-BR")}
                                </span>
                                <div className="flex -space-x-2">
                                  {avatars.map((a, i) => (
                                    <Avatar key={i} className="h-6 w-6 border-2 border-card">
                                      <AvatarFallback className={cn("text-[9px] text-primary-foreground", a.color)}>
                                        {a.initials}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="p-3 max-w-xs">
                          <p className="font-semibold text-sm mb-2">Pipeline do Processo</p>
                          <div className="space-y-1">
                            {pipeline.map((step, i) => {
                              const cfg = STEP_STATUS_ICON[step.status] || STEP_STATUS_ICON.bloqueado;
                              const Icon = cfg.icon;
                              return (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <Icon className={cn("h-3.5 w-3.5", cfg.className)} />
                                  <span className={step.status === "bloqueado" ? "text-muted-foreground/50" : ""}>{step.label}</span>
                                  <span className="text-muted-foreground ml-auto capitalize text-[10px]">
                                    {step.status === "aprovado" ? "✅ Aprovado" :
                                     step.status === "rascunho" ? "🔄 Rascunho" :
                                     step.status === "proximo" ? "⏳ Próximo" : "🔒 Bloqueado"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Processo</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Objeto</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Órgão</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progresso</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Saúde</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((p) => {
                const { completed, total, pct, barColor } = getProgressInfo(p.documentos ?? []);
                const cfg = STATUS_CONFIG[p.status ?? "rascunho"] ?? STATUS_CONFIG.rascunho;
                const health = getHealthIndicator(p.updated_at || p.created_at);
                return (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/processo/${p.id}`)}
                  >
                    <td className="py-3 px-4 font-medium">{p.numero_processo || "S/N"}</td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{p.objeto || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.orgao || "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", barColor)} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("h-2 w-2 rounded-full", health.color)} />
                        <span className="text-xs text-muted-foreground">{health.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={cn("text-[10px]", cfg.color)}>{cfg.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <NovoProcessoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => { refetch(); setDialogOpen(false); }}
      />
    </div>
  );
}
