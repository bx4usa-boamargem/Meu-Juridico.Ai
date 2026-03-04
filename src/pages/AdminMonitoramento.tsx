import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Activity, Play, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { BrazilStateMap } from "@/components/configuracoes/BrazilStateMap";

const FEDERAL_SOURCES = ["TCU", "CGU", "PNCP"];

export default function AdminMonitoramento() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [activeStates, setActiveStates] = useState<Set<string>>(new Set(["SP", "RJ", "MG"]));

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

  // Sync activeStates from DB scope
  useEffect(() => {
    if (config?.scope) {
      const scope = config.scope as any;
      if (scope?.estados && Array.isArray(scope.estados)) {
        setActiveStates(new Set(scope.estados));
      }
    }
  }, [config?.scope]);

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

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

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

  const handleToggleState = async (uf: string) => {
    if (!config) return;
    const next = new Set(activeStates);
    if (next.has(uf)) next.delete(uf);
    else next.add(uf);
    setActiveStates(next);

    const currentScope = (config.scope as any) ?? {};
    const newScope = { ...currentScope, estados: Array.from(next) };
    await supabase
      .from("monitoring_config")
      .update({ scope: newScope })
      .eq("id", config.id);
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

  if (!config) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-16 gap-4">
        <Activity className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Monitoramento ainda não configurado.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-lg font-semibold">Admin — Monitoramento Normativo</h1>

      {/* Master Switch + Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Agente de Monitoramento</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Master Switch</span>
                <Switch checked={config.is_active} onCheckedChange={handleToggle} />
              </div>
              <Badge
                variant={config.is_active ? "default" : "secondary"}
                className={cn(
                  "text-[10px]",
                  config.is_active ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-muted text-muted-foreground"
                )}
              >
                {config.is_active ? "● Ativo" : "● Pausado"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!config.is_active && (
            <p className="text-[11px] text-muted-foreground bg-muted/50 rounded px-3 py-2">
              Quando desligado, nenhuma execução automática ocorre. Você continua podendo usar o botão <strong>Monitorar Agora</strong>.
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Frequência:</span>
              <Select value={config.frequency ?? "daily"} onValueChange={handleFrequency}>
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
              <span className="font-medium">{formatDate(config.next_run_at)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Última execução: </span>
              <span className="font-medium">{formatDate(config.last_run_at)}</span>
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
            <Button
              size="sm"
              className="text-xs gap-1"
              onClick={handleRunNow}
              disabled={running || !config.is_active}
            >
              <Play className="h-3 w-3" />
              {running ? "Executando..." : "Monitorar Agora"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scope: Map + Federal Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* State Map */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estados Monitorados</CardTitle>
            <p className="text-[10px] text-muted-foreground">Clique nos estados para ativar/desativar o monitoramento</p>
          </CardHeader>
          <CardContent>
            <BrazilStateMap
              activeStates={activeStates}
              onToggleState={handleToggleState}
            />
          </CardContent>
        </Card>

        {/* Federal Sources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fontes Federais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {FEDERAL_SOURCES.map((source) => (
                <div key={source} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-success" />
                    <span className="text-xs font-medium">{source}</span>
                  </div>
                  <Badge variant="default" className="text-[9px]">Ativo</Badge>
                </div>
              ))}
            </div>

            <div className="rounded-lg border px-3 py-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-success" />
                <div>
                  <span className="text-xs font-medium">DOE + TRJ + TCE Estaduais</span>
                  <p className="text-[10px] text-muted-foreground">27 estados com Diários Oficiais, Tribunais de Justiça e Tribunais de Contas</p>
                </div>
              </div>
            </div>

            {/* Active states summary */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Estados ativos</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(activeStates).sort().map((uf) => (
                  <Badge key={uf} variant="default" className="text-[9px]">{uf}</Badge>
                ))}
                {activeStates.size === 0 && (
                  <span className="text-[10px] text-muted-foreground">Nenhum estado selecionado</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
