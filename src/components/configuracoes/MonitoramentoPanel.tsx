import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Eye, Activity, Shield } from "lucide-react";

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
  const [drawerAlert, setDrawerAlert] = useState<any>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

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

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Monitoramento Normativo</h2>
      </div>

      {/* Filters */}
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

      {/* Alerts Table */}
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
