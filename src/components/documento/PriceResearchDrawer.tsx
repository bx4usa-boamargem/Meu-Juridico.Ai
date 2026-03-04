import { useState, useEffect } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Search, Loader2, TrendingDown, BarChart3, TrendingUp, Database,
  ExternalLink, Download, ArrowRight, Sparkles, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PriceItem {
  orgao: string;
  estado: string;
  data: string;
  valor_unitario: number;
  unidade: string;
  fonte: string;
  url: string | null;
  is_outlier: boolean;
}

interface Stats {
  menor: number;
  mediana: number;
  maior: number;
  total: number;
  outliers: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultObjeto?: string;
  defaultEstado?: string;
  processoId?: string;
  orgaoNome?: string;
  userName?: string;
  onUseValue?: (value: number) => void;
}

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const LOADING_PHASES = [
  { icon: Search, text: "Consultando PNCP..." },
  { icon: BarChart3, text: "Consultando Painel de Preços..." },
  { icon: Sparkles, text: "Calculando referência de mercado..." },
];

export function PriceResearchDrawer({
  open, onOpenChange, defaultObjeto, defaultEstado, processoId, orgaoNome, userName, onUseValue,
}: Props) {
  const [objeto, setObjeto] = useState(defaultObjeto ?? "");
  const [estado, setEstado] = useState(defaultEstado ?? "");
  const [municipio, setMunicipio] = useState("");
  const [periodo, setPeriodo] = useState("6m");
  const [unidade, setUnidade] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [results, setResults] = useState<PriceItem[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [analiseIa, setAnaliseIa] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (open) {
      setObjeto(defaultObjeto ?? "");
      setEstado(defaultEstado ?? "");
    }
  }, [open, defaultObjeto, defaultEstado]);

  const handleSearch = async () => {
    if (!objeto.trim()) { toast.error("Digite o objeto da pesquisa"); return; }
    setLoading(true);
    setLoadingPhase(0);
    setResults(null);

    const t1 = setTimeout(() => setLoadingPhase(1), 1500);
    const t2 = setTimeout(() => setLoadingPhase(2), 3000);

    try {
      const { data, error } = await supabase.functions.invoke("price-research", {
        body: { objeto, estado: estado || null, municipio: municipio || null, periodo, unidade_medida: unidade || null, processo_id: processoId },
      });
      if (error) throw error;
      setResults(data.resultados);
      setStats(data.estatisticas);
      setAnaliseIa(data.analise_ia);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro na pesquisa de preços");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
    }
  };

  const handleUseValue = () => {
    if (stats && onUseValue) {
      onUseValue(stats.mediana);
      toast.success(`Valor R$ ${stats.mediana.toFixed(2)} aplicado ao campo`);
      onOpenChange(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!stats || !results) return;
    setGeneratingPdf(true);
    try {
      // Build HTML for print/PDF
      const html = buildPdfHtml();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
      toast.success("Relatório de pesquisa de preços gerado!");
    } catch (err: any) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const buildPdfHtml = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR");
    const validItems = results!.filter(i => !i.is_outlier);
    const outlierItems = results!.filter(i => i.is_outlier);

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório de Pesquisa de Preços</title>
<style>body{font-family:Arial,sans-serif;font-size:11px;margin:40px;color:#333}
h1{font-size:16px;border-bottom:2px solid #0F6FDE;padding-bottom:8px}
h2{font-size:13px;margin-top:24px;color:#0F6FDE}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:10px}
th{background:#f5f5f5;font-weight:bold}
.stats{display:flex;gap:16px;margin:12px 0}
.stat{flex:1;border:1px solid #ddd;border-radius:6px;padding:12px;text-align:center}
.stat-value{font-size:18px;font-weight:bold;color:#0F6FDE}
.stat-label{font-size:9px;color:#666;margin-top:4px}
.footer{margin-top:40px;padding-top:12px;border-top:1px solid #ddd;font-size:9px;color:#888}
.outlier{text-decoration:line-through;opacity:0.5}
.ai-box{background:#f0f7ff;border:1px solid #bdd7f5;border-radius:6px;padding:16px;margin:12px 0}
</style></head><body>
<h1>${orgaoNome ?? "Órgão"} — Relatório de Pesquisa de Preços</h1>
<p><strong>Data:</strong> ${dateStr}</p>
<p><strong>Objeto:</strong> ${objeto}</p>
<p><strong>Período:</strong> ${periodo === "3m" ? "3 meses" : periodo === "12m" ? "12 meses" : "6 meses"}</p>

<h2>Resumo Estatístico</h2>
<div class="stats">
<div class="stat"><div class="stat-value" style="color:#16a34a">R$ ${stats!.menor.toFixed(2)}</div><div class="stat-label">Menor Preço</div></div>
<div class="stat"><div class="stat-value">R$ ${stats!.mediana.toFixed(2)}</div><div class="stat-label">Mediana (Referência)</div></div>
<div class="stat"><div class="stat-value" style="color:#dc2626">R$ ${stats!.maior.toFixed(2)}</div><div class="stat-label">Maior Preço</div></div>
<div class="stat"><div class="stat-value" style="color:#333">${stats!.total}</div><div class="stat-label">Fontes</div></div>
</div>

<h2>Análise de Mercado</h2>
<div class="ai-box">${analiseIa.replace(/\n/g, "<br>")}</div>

<h2>Preços Coletados</h2>
<table><thead><tr><th>Órgão</th><th>UF</th><th>Data</th><th>Valor Unit.</th><th>Unidade</th><th>Fonte</th><th>URL</th></tr></thead><tbody>
${validItems.map(i => `<tr><td>${i.orgao}</td><td>${i.estado}</td><td>${i.data}</td><td>R$ ${i.valor_unitario.toFixed(2)}</td><td>${i.unidade}</td><td>${i.fonte}</td><td>${i.url ?? "-"}</td></tr>`).join("")}
</tbody></table>

${outlierItems.length > 0 ? `
<h2>Preços Descartados (Outliers)</h2>
<p>Removidos por desvio superior a 2σ da média.</p>
<table><thead><tr><th>Órgão</th><th>UF</th><th>Data</th><th>Valor Unit.</th><th>Fonte</th></tr></thead><tbody>
${outlierItems.map(i => `<tr class="outlier"><td>${i.orgao}</td><td>${i.estado}</td><td>${i.data}</td><td>R$ ${i.valor_unitario.toFixed(2)}</td><td>${i.fonte}</td></tr>`).join("")}
</tbody></table>` : ""}

<h2>Metodologia</h2>
<p>Mediana saneada conforme IN SEGES/ME nº 65/2021, Art. 5º. Outliers identificados pelo método de 2 desvios-padrão (2σ).</p>

<h2>Preço de Referência Final</h2>
<p style="font-size:16px;font-weight:bold;color:#0F6FDE">R$ ${stats!.mediana.toFixed(2)}</p>

<p><strong>Responsável:</strong> ${userName ?? "Usuário"}</p>
<p><strong>Data:</strong> ${dateStr}</p>

<div class="footer">Gerado por MeuJurídico.ai · ${dateStr}</div>
</body></html>`;
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[680px] max-w-full sm:max-w-[680px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-base">Pesquisa de Preços de Mercado</SheetTitle>
          <SheetDescription className="text-[11px]">
            Conforme Art. 23 Lei 14.133/2021 e IN SEGES 65/2021
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Search Form */}
            {!results && !loading && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Objeto da pesquisa</Label>
                  <Input value={objeto} onChange={e => setObjeto(e.target.value)} placeholder="Ex: serviços de controle de pragas" className="text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Estado</Label>
                    <Select value={estado} onValueChange={setEstado}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Nacional" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Nacional</SelectItem>
                        {ESTADOS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Município (opcional)</Label>
                    <Input value={municipio} onChange={e => setMunicipio(e.target.value)} placeholder="Ex: São Paulo" className="text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Período</Label>
                    <Select value={periodo} onValueChange={setPeriodo}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3m">Últimos 3 meses</SelectItem>
                        <SelectItem value="6m">Últimos 6 meses</SelectItem>
                        <SelectItem value="12m">Último ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Unidade de medida</Label>
                    <Input value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="Ex: mensal, unidade, m²" className="text-sm" />
                  </div>
                </div>
                <Button onClick={handleSearch} className="w-full gap-2">
                  <Search className="h-4 w-4" /> Pesquisar
                </Button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center gap-6 py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="space-y-3 w-full max-w-xs">
                  {LOADING_PHASES.map((phase, i) => {
                    const PhaseIcon = phase.icon;
                    const isDone = loadingPhase > i;
                    const isCurrent = loadingPhase === i;
                    return (
                      <div key={i} className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all",
                        isCurrent && "bg-primary/5 border border-primary/20",
                        isDone && "bg-muted/50",
                        !isDone && !isCurrent && "opacity-30"
                      )}>
                        {isDone ? (
                          <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <span className="text-white text-[10px]">✓</span>
                          </div>
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <PhaseIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={cn("text-xs", isCurrent && "font-medium", isDone && "line-through text-muted-foreground")}>
                          {phase.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Results */}
            {results && stats && (
              <div className="space-y-5">
                {/* Back button */}
                <Button variant="ghost" size="sm" className="text-xs gap-1 -ml-2" onClick={() => setResults(null)}>
                  ← Nova pesquisa
                </Button>

                {/* Stats Cards */}
                {stats.total > 0 ? (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      <Card className="border-emerald-200">
                        <CardContent className="p-3 text-center">
                          <TrendingDown className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                          <p className="text-lg font-bold text-emerald-600">{fmt(stats.menor)}</p>
                          <p className="text-[9px] text-muted-foreground">Menor preço{unidade ? ` / ${unidade}` : ""}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="p-3 text-center">
                          <BarChart3 className="h-4 w-4 text-primary mx-auto mb-1" />
                          <p className="text-lg font-bold text-primary">{fmt(stats.mediana)}</p>
                          <p className="text-[9px] text-muted-foreground">Mediana{unidade ? ` / ${unidade}` : ""}</p>
                          <Badge className="text-[7px] px-1 py-0 bg-primary/10 text-primary mt-1">Recomendado</Badge>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 text-center">
                          <TrendingUp className="h-4 w-4 text-destructive mx-auto mb-1" />
                          <p className="text-lg font-bold">{fmt(stats.maior)}</p>
                          <p className="text-[9px] text-muted-foreground">Maior preço{unidade ? ` / ${unidade}` : ""}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 text-center">
                          <Database className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                          <p className="text-lg font-bold">{stats.total}</p>
                          <p className="text-[9px] text-muted-foreground">Fontes</p>
                        </CardContent>
                      </Card>
                    </div>

                    <p className="text-[10px] text-muted-foreground">
                      Preço de referência baseado na mediana saneada. {stats.outliers} outlier{stats.outliers !== 1 ? "s" : ""} removido{stats.outliers !== 1 ? "s" : ""} por desvio acima de 2σ.
                    </p>

                    {/* AI Analysis */}
                    {analiseIa && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <h4 className="text-xs font-semibold">Análise de Mercado</h4>
                          </div>
                          <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-line">
                            {analiseIa}
                          </p>
                          <p className="text-[9px] text-muted-foreground pt-1 border-t border-primary/10">
                            Fundamentação: Art. 23 Lei 14.133/2021 · IN SEGES 65/2021
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Price Table */}
                    <div>
                      <h4 className="text-xs font-semibold mb-2">Preços Coletados</h4>
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-[10px]">Órgão</TableHead>
                              <TableHead className="text-[10px]">UF</TableHead>
                              <TableHead className="text-[10px]">Data</TableHead>
                              <TableHead className="text-[10px]">Valor Unit.</TableHead>
                              <TableHead className="text-[10px]">Fonte</TableHead>
                              <TableHead className="text-[10px] w-8"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.map((item, i) => (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <TableRow className={cn(item.is_outlier && "opacity-40")}>
                                    <TableCell className={cn("text-[10px]", item.is_outlier && "line-through")}>{item.orgao}</TableCell>
                                    <TableCell className={cn("text-[10px]", item.is_outlier && "line-through")}>{item.estado}</TableCell>
                                    <TableCell className={cn("text-[10px]", item.is_outlier && "line-through")}>{item.data}</TableCell>
                                    <TableCell className={cn("text-[10px] font-medium", item.is_outlier && "line-through")}>{fmt(item.valor_unitario)}</TableCell>
                                    <TableCell className="text-[10px]">
                                      <Badge variant="secondary" className="text-[8px]">{item.fonte}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      {item.url && (
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                </TooltipTrigger>
                                {item.is_outlier && (
                                  <TooltipContent><p className="text-xs">Removido por ser outlier estatístico</p></TooltipContent>
                                )}
                              </Tooltip>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Empty state */
                  <div className="flex flex-col items-center gap-4 py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground/40" />
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium">Nenhum preço encontrado</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Não encontramos contratações similares nas fontes públicas para este objeto no período selecionado.
                        Sugestões: ampliar o período, usar termos mais genéricos ou consultar diretamente o Painel de Preços.
                      </p>
                    </div>
                    <a
                      href="https://paineldeprecos.planejamento.gov.br"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <ExternalLink className="h-3 w-3" /> Abrir Painel de Preços
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        {results && stats && stats.total > 0 && (
          <SheetFooter className="border-t px-6 py-3 shrink-0 flex-row gap-2">
            {onUseValue && (
              <Button onClick={handleUseValue} className="flex-1 gap-1.5 text-xs">
                <ArrowRight className="h-3.5 w-3.5" /> Usar este valor no ETP
              </Button>
            )}
            <Button variant="outline" onClick={handleDownloadPdf} disabled={generatingPdf} className="flex-1 gap-1.5 text-xs">
              {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Gerar Relatório PDF
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
