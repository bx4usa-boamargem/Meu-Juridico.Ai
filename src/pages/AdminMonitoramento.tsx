import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Activity, Play, Pause, CheckCircle, Lock } from "lucide-react";
import { toast } from "sonner";

export default function AdminMonitoramento() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);

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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-lg font-semibold">Admin — Monitoramento</h1>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Agente de Monitoramento</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={config.is_active ? "default" : "secondary"} className="text-[10px]">
                {config.is_active ? "● Ativo" : "● Pausado"}
              </Badge>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleToggle}>
                {config.is_active ? <><Pause className="h-3 w-3 mr-1" />Pausar</> : <><Play className="h-3 w-3 mr-1" />Ativar</>}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Button size="sm" className="text-xs gap-1" onClick={handleRunNow} disabled={running}>
              <Play className="h-3 w-3" />
              {running ? "Executando..." : "Executar agora"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monitored Scope */}
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
    </div>
  );
}
