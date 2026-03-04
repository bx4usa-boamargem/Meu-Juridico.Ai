import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Eye, Play, Pause, Activity, Shield, CheckCircle, Lock } from "lucide-react";
import { toast } from "sonner";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-gray-400 text-white",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
};

export function MonitoramentoPanel() {
  const queryClient = useQueryClient();
  const [drawerAlert, setDrawerAlert] = useState<any>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [running, setRunning] = useState(false);

  // Config
  const { data: config } = useQuery({
    queryKey: ["monitoring_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monitoring_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Alerts
  const { data: alerts } = useQuery({
    queryKey: ["monitoring_alerts", severityFilter, sourceFilter],
    queryFn: async () => {
      let q = supabase
        .from("monitoring_alerts")
        .select("*")
        .eq("is_relevant", true)
        .order("detected_at", { ascending: false })
        .limit(50);

      if (severityFilter !== "all") q = q.eq("severity", severityFilter);
      if (sourceFilter !== "all") q = q.eq("source", sourceFilter);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  // Monthly cost
  const { data: monthlyCost } = useQuery({
    queryKey: ["monitoring_cost"],
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data, error } = await supabase
        .from("monitoring_runs")
        .select("estimated_cost_usd")
        .gte("started_at", startOfMonth);
      if (error) throw error;
      return data?.reduce((sum, r) => sum + (Number(r.estimated_cost_usd) ?? 0), 0) ?? 0;
    },
  });

  const costLimit = config?.cost_limit_usd ?? 5;
  const costPct = Math.min(100, ((monthlyCost ?? 0) / costLimit) * 100);

  const handleToggle = async () => {
    if (!config) return;
    const { error } = await supabase
      .from("monitoring_config")
      .update({ is_active: !config.is_active })
      .eq("id", config.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    queryClient.invalidateQueries({ queryKey: ["monitoring_config"] });
    toast.success(config.is_active ? "Monitoramento pausado" : "Monitoramento ativado");
  };

  const handleFrequency = async (freq: string) => {
    if (!config) return;
    const { error } = await supabase
      .from("monitoring_config")
      .update({ frequency: freq })
      .eq("id", config.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    queryClient.invalidateQueries({ queryKey: ["monitoring_config"] });
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      const { error } = await supabase.functions.invoke("monitoring_agent");
      if (error) throw error;
      toast.success("Execução iniciada!");
      queryClient.invalidateQueries({ queryKey: ["monitoring_alerts"] });
      queryClient.invalidateQueries({ queryKey: ["monitoring_cost"] });
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Falha ao executar"));
    } finally {
      setRunning(false);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="space-y-6">
      {/* 5a — Control Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Agente de Monitoramento</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={config?.is_active ? "default" : "secondary"} className="text-[10px]">
                {config?.is_active ? "● Ativo" : "● Pausado"}
              </Badge>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleToggle}>
                {config?.is_active ? <><Pause className="h-3 w-3 mr-1" />Pausar</> : <><Play className="h-3 w-3 mr-1" />Ativar</>}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Frequência:</span>
              <Select value={config?.frequency ?? "daily"} onValueChange={handleFrequency}>
                <SelectTrigger className="h-7 text-xs w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="text-muted-foreground">Próxima execução: </span>
              <span className="font-medium">{formatDate(config?.next_run_at)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Última execução: </span>
              <span className="font-medium">{formatDate(config?.last_run_at)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Custo este mês:</span>
              <span className="font-medium">${(monthlyCost ?? 0).toFixed(2)} / ${costLimit.toFixed(2)} USD</span>
            </div>
            <Progress value={costPct} className="h-2" />
            <span className="text-[10px] text-muted-foreground">{costPct.toFixed(0)}% do limite</span>
          </div>

          <div className="flex justify-end">
            <Button size="sm" className="text-xs gap-1" onClick={handleRunNow} disabled={running}>
              <Play className="h-3 w-3" />
              {running ? "Executando..." : "Executar agora"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5c — Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {["all", "critical", "high", "medium", "low"].map((sev) => (
          <Button
            key={sev}
            variant={severityFilter === sev ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setSeverityFilter(sev)}
          >
            {sev === "all" ? "Todos" : SEVERITY_LABELS[sev]}
          </Button>
        ))}
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="h-7 text-xs w-36">
            <SelectValue placeholder="Todas as fontes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fontes</SelectItem>
            {["TCU", "CGU", "PNCP", "TJSP", "TJRJ", "TJMG", "DOESP", "DOERJ", "DOEMG"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 5b — Alerts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Severidade</th>
                  <th className="text-left p-3 font-medium">Fonte</th>
                  <th className="text-left p-3 font-medium">Docs. Afetados</th>
                  <th className="text-left p-3 font-medium">Título</th>
                  <th className="text-left p-3 font-medium">Data</th>
                  <th className="text-left p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {!alerts?.length ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Nenhum alerta encontrado
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert: any) => (
                    <tr key={alert.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <Badge className={`text-[9px] ${SEVERITY_COLORS[alert.severity] ?? "bg-gray-400 text-white"}`}>
                          {SEVERITY_LABELS[alert.severity] ?? alert.severity}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium">{alert.source}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(alert.affected_doc_types ?? []).map((t: string) => (
                            <Badge key={t} variant="outline" className="text-[9px]">{t}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 max-w-[300px] truncate">{alert.title}</td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(alert.detected_at)}
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1" onClick={() => setDrawerAlert(alert)}>
                          <Eye className="h-3 w-3" /> Ver análise
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 5d — Monitored Scope */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Escopo Monitorado — Fase 1</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block mb-1">Fontes federais ativas:</span>
              <div className="flex gap-1.5">
                {["TCU", "CGU", "PNCP"].map((s) => (
                  <Badge key={s} variant="default" className="text-[10px] gap-1">
                    <CheckCircle className="h-3 w-3" /> {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Estados ativos:</span>
              <div className="flex gap-1.5">
                {["SP", "RJ", "MG"].map((s) => (
                  <Badge key={s} variant="default" className="text-[10px] gap-1">
                    <CheckCircle className="h-3 w-3" /> {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Em breve (Fase 2):</span>
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Lock className="h-3 w-3" /> Demais estados e capitais
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Detail Drawer */}
      <Sheet open={!!drawerAlert} onOpenChange={(open) => !open && setDrawerAlert(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-sm">Análise de Impacto</SheetTitle>
          </SheetHeader>
          {drawerAlert && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge className={`text-[10px] ${SEVERITY_COLORS[drawerAlert.severity]}`}>
                  {SEVERITY_LABELS[drawerAlert.severity]}
                </Badge>
                <span className="text-xs font-medium">{drawerAlert.source}</span>
                <span className="text-[10px] text-muted-foreground">{formatDate(drawerAlert.detected_at)}</span>
              </div>

              <h3 className="text-sm font-semibold">{drawerAlert.title}</h3>

              {drawerAlert.summary && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Resumo</p>
                  <p className="text-xs leading-relaxed">{drawerAlert.summary}</p>
                </div>
              )}

              {drawerAlert.impact_analysis && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Análise de Impacto</p>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{drawerAlert.impact_analysis}</p>
                </div>
              )}

              {drawerAlert.affected_doc_types?.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Documentos Afetados</p>
                  <div className="flex flex-wrap gap-1">
                    {drawerAlert.affected_doc_types.map((t: string) => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {drawerAlert.source_url && (
                <a href={drawerAlert.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                  Ver fonte original →
                </a>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
