import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Shield, Loader2, RefreshCw, Plus, Check, Download, AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RiskItem {
  id: number;
  categoria: string;
  descricao: string;
  probabilidade: string;
  impacto: string;
  nivel: string;
  responsavel: string;
  mitigacao: string;
  base_legal: string;
}

const LOADING_MESSAGES = [
  "Analisando o objeto da contratação...",
  "Identificando riscos jurídicos e operacionais...",
  "Consultando jurisprudência TCU...",
  "Montando matriz de riscos...",
];

const NIVEL_COLORS: Record<string, string> = {
  "Crítico": "bg-red-50 text-red-700 border-red-200",
  "Alto": "bg-orange-50 text-orange-700 border-orange-200",
  "Médio": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Baixo": "bg-green-50 text-green-700 border-green-200",
};

interface Props {
  processoId?: string;
  objeto?: string;
  modalidade?: string;
  valorEstimado?: string;
  onApproved?: () => void;
}

export default function MapaDeRiscos({ processoId, objeto, modalidade, valorEstimado, onApproved }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [riscos, setRiscos] = useState<RiskItem[] | null>(null);
  const [resumo, setResumo] = useState("");
  const [approving, setApproving] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [existingMap, setExistingMap] = useState<any>(null);

  // Load existing risk map if processoId
  useEffect(() => {
    if (!processoId) return;
    supabase
      .from("risk_maps" as any)
      .select("*")
      .eq("processo_id", processoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const map = data[0] as any;
          setExistingMap(map);
          setRiscos(map.riscos as RiskItem[]);
          setResumo(map.resumo_executivo ?? "");
        }
      });
  }, [processoId]);

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingStep(0);
    setRiscos(null);

    const intervals = LOADING_MESSAGES.map((_, i) =>
      setTimeout(() => setLoadingStep(i), i * 2000)
    );

    try {
      const { data, error } = await supabase.functions.invoke("risk-map", {
        body: {
          objeto: objeto ?? "Contratação pública",
          doc_type: "tr",
          valor_estimado: valorEstimado,
          modalidade: modalidade ?? "Pregão Eletrônico",
          processo_id: processoId,
        },
      });
      if (error) throw error;
      setRiscos(data.riscos);
      setResumo(data.resumo_executivo);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar mapa de riscos");
    } finally {
      intervals.forEach(clearTimeout);
      setLoading(false);
    }
  };

  const handleRegenerateOne = async (index: number) => {
    // Simple: just regenerate all for now
    toast.info("Regenerando risco...");
    handleGenerate();
  };

  const handleAddRisk = () => {
    const newRisk: RiskItem = {
      id: (riscos?.length ?? 0) + 1,
      categoria: "Operacional",
      descricao: "",
      probabilidade: "Média",
      impacto: "Médio",
      nivel: "Médio",
      responsavel: "",
      mitigacao: "",
      base_legal: "",
    };
    setRiscos([...(riscos ?? []), newRisk]);
  };

  const updateRisk = (index: number, field: string, value: string) => {
    if (!riscos) return;
    const updated = [...riscos];
    (updated[index] as any)[field] = value;
    setRiscos(updated);
  };

  const handleApprove = async () => {
    if (!processoId || !riscos) return;
    setApproving(true);
    try {
      const { error } = await supabase.from("risk_maps" as any).insert({
        processo_id: processoId,
        riscos: riscos as any,
        resumo_executivo: resumo,
        aprovado_em: new Date().toISOString(),
        aprovado_por: user?.email ?? "Usuário",
        created_by: user?.id,
      } as any);

      if (error) throw error;

      // Generate PDF
      handleDownloadPdf();

      toast.success("Mapa de Riscos aprovado e salvo no processo");
      onApproved?.();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao aprovar mapa de riscos");
    } finally {
      setApproving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!riscos) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Mapa de Riscos</title>
<style>body{font-family:Arial,sans-serif;font-size:11px;margin:40px;color:#333}
h1{font-size:16px;border-bottom:2px solid #dc2626;padding-bottom:8px}
h2{font-size:13px;margin-top:24px;color:#dc2626}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:9px}
th{background:#f5f5f5;font-weight:bold}
.critico{background:#fef2f2;color:#991b1b}
.alto{background:#fff7ed;color:#9a3412}
.medio{background:#fefce8;color:#854d0e}
.baixo{background:#f0fdf4;color:#166534}
.ai-box{background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:16px;margin:12px 0}
.footer{margin-top:40px;padding-top:12px;border-top:1px solid #ddd;font-size:9px;color:#888}
</style></head><body>
<h1>Mapa de Riscos — ${objeto ?? "Contratação"}</h1>
<p><strong>Processo:</strong> ${processoId ?? "N/A"}</p>
<p><strong>Data:</strong> ${dateStr}</p>

<h2>Metodologia</h2>
<p>Matriz de probabilidade × impacto (3×3) conforme Art. 22 §3º da Lei 14.133/2021.</p>

<h2>Matriz de Riscos</h2>
<table><thead><tr><th>ID</th><th>Categoria</th><th>Descrição</th><th>Prob.</th><th>Impacto</th><th>Nível</th><th>Responsável</th><th>Mitigação</th><th>Base Legal</th></tr></thead><tbody>
${riscos.map(r => `<tr class="${r.nivel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}"><td>${r.id}</td><td>${r.categoria}</td><td>${r.descricao}</td><td>${r.probabilidade}</td><td>${r.impacto}</td><td>${r.nivel}</td><td>${r.responsavel}</td><td>${r.mitigacao}</td><td>${r.base_legal}</td></tr>`).join("")}
</tbody></table>

<h2>Resumo Executivo</h2>
<div class="ai-box">${resumo.replace(/\n/g, "<br>")}</div>

<h2>Fundamentação</h2>
<p>Art. 22 §3º da Lei 14.133/2021 — Gestão de Riscos em Contratações Públicas</p>

<p><strong>Responsável:</strong> ${user?.email ?? "Usuário"}</p>
<p><strong>Data de aprovação:</strong> ${dateStr}</p>

<div class="footer">Gerado por MeuJurídico.ai · ${dateStr}</div>
</body></html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const counts = riscos ? {
    critico: riscos.filter(r => r.nivel === "Crítico").length,
    alto: riscos.filter(r => r.nivel === "Alto").length,
    medio: riscos.filter(r => r.nivel === "Médio").length,
    baixo: riscos.filter(r => r.nivel === "Baixo").length,
  } : null;

  // Initial state — no risks generated yet
  if (!riscos && !loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-8 flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold">Mapa de Riscos</h2>
            <p className="text-xs text-muted-foreground max-w-md">
              Gere automaticamente uma matriz de riscos baseada no objeto da contratação,
              com análise de probabilidade × impacto conforme Art. 22 §3º da Lei 14.133/2021.
            </p>
          </div>
          <Button onClick={handleGenerate} className="gap-2">
            <Sparkles className="h-4 w-4" /> Criar Mapa de Riscos
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        <Loader2 className="h-12 w-12 animate-spin text-destructive" />
        <div className="space-y-3 w-full max-w-xs">
          {LOADING_MESSAGES.map((msg, i) => {
            const isDone = loadingStep > i;
            const isCurrent = loadingStep === i;
            return (
              <div key={i} className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all",
                isCurrent && "bg-destructive/5 border border-destructive/20",
                isDone && "bg-muted/50",
                !isDone && !isCurrent && "opacity-30"
              )}>
                {isDone ? (
                  <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-[10px]">✓</span>
                  </div>
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                )}
                <span className={cn("text-xs", isCurrent && "font-medium", isDone && "line-through text-muted-foreground")}>
                  {msg}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Results — editable matrix
  return (
    <div className="space-y-5">
      {/* Actions bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleGenerate}>
          <RefreshCw className="h-3.5 w-3.5" /> Regenerar todos
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleAddRisk}>
          <Plus className="h-3.5 w-3.5" /> Adicionar risco
        </Button>
        <div className="flex-1" />
        {counts && (
          <div className="flex gap-2 text-[10px]">
            {counts.critico > 0 && <Badge variant="destructive" className="text-[9px]">{counts.critico} Crítico{counts.critico > 1 ? "s" : ""}</Badge>}
            {counts.alto > 0 && <Badge className="text-[9px] bg-orange-500">{counts.alto} Alto{counts.alto > 1 ? "s" : ""}</Badge>}
            {counts.medio > 0 && <Badge className="text-[9px] bg-yellow-500 text-yellow-900">{counts.medio} Médio{counts.medio > 1 ? "s" : ""}</Badge>}
            {counts.baixo > 0 && <Badge className="text-[9px] bg-green-500">{counts.baixo} Baixo{counts.baixo > 1 ? "s" : ""}</Badge>}
          </div>
        )}
      </div>

      {/* Risk Matrix Table */}
      <div className="rounded-lg border overflow-hidden">
        <ScrollArea className="max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] w-8">ID</TableHead>
                <TableHead className="text-[10px]">Categoria</TableHead>
                <TableHead className="text-[10px]">Descrição</TableHead>
                <TableHead className="text-[10px] w-20">Prob.</TableHead>
                <TableHead className="text-[10px] w-20">Impacto</TableHead>
                <TableHead className="text-[10px] w-20">Nível</TableHead>
                <TableHead className="text-[10px]">Responsável</TableHead>
                <TableHead className="text-[10px]">Mitigação</TableHead>
                <TableHead className="text-[10px]">Base Legal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riscos!.map((risk, i) => {
                const nivelClass = NIVEL_COLORS[risk.nivel] ?? "";
                return (
                  <TableRow key={risk.id} className={cn(nivelClass)}>
                    {["id", "categoria", "descricao", "probabilidade", "impacto", "nivel", "responsavel", "mitigacao", "base_legal"].map(col => {
                      const isEditing = editingCell?.row === i && editingCell?.col === col;
                      const val = (risk as any)[col];
                      return (
                        <TableCell
                          key={col}
                          className="text-[10px] p-1.5 cursor-pointer"
                          onClick={() => col !== "id" && setEditingCell({ row: i, col })}
                        >
                          {isEditing ? (
                            <Input
                              autoFocus
                              value={val}
                              onChange={e => updateRisk(i, col, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={e => e.key === "Enter" && setEditingCell(null)}
                              className="h-6 text-[10px] px-1"
                            />
                          ) : (
                            <span className="block min-h-[20px]">{String(val)}</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* AI Summary */}
      {resumo && (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-destructive" />
              <h4 className="text-xs font-semibold">Resumo Executivo</h4>
            </div>
            <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-line">{resumo}</p>
            <p className="text-[9px] text-muted-foreground pt-1 border-t border-destructive/10">
              Baseado em jurisprudência TCU e Lei 14.133/2021
            </p>
          </CardContent>
        </Card>
      )}

      {/* Approval Actions */}
      <div className="flex gap-2 pt-2">
        {processoId && (
          <Button onClick={handleApprove} disabled={approving} className="gap-1.5 text-xs">
            {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Aprovar e salvar no processo
          </Button>
        )}
        <Button variant="outline" onClick={handleDownloadPdf} className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" /> Gerar PDF
        </Button>
      </div>
    </div>
  );
}
