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
import {
  Search, Loader2, BarChart3, Download, Sparkles, AlertTriangle, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UnitGroup {
  unidade: string;
  menor: number;
  mediana: number;
  maior: number;
  total: number;
  outliers: number;
  itens: any[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultObjeto?: string;
  defaultEstado?: string;
  processoId?: string;
  orgaoNome?: string;
  userName?: string;
  onUseValue?: (value: number, unidade?: string) => void;
}

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
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
  const [unitGroups, setUnitGroups] = useState<UnitGroup[] | null>(null);
  const [analiseIa, setAnaliseIa] = useState("");
  const [memoriaCalculo, setMemoriaCalculo] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  // Legacy fallback
  const [legacyResults, setLegacyResults] = useState<any[] | null>(null);
  const [legacyStats, setLegacyStats] = useState<any | null>(null);

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
    setUnitGroups(null);
    setLegacyResults(null);
    setLegacyStats(null);

    const t1 = setTimeout(() => setLoadingPhase(1), 1500);
    const t2 = setTimeout(() => setLoadingPhase(2), 3000);

    try {
      const { data, error } = await supabase.functions.invoke("price-research", {
        body: { objeto, estado: estado || null, municipio: municipio || null, periodo, unidade_medida: unidade || null, processo_id: processoId },
      });
      if (error) throw error;

      // Support new grouped format
      if (data.resultados_por_unidade && Array.isArray(data.resultados_por_unidade)) {
        const groups: UnitGroup[] = data.resultados_por_unidade.map((g: any) => ({
          unidade: g.unidade ?? g.unidade_medida ?? "unidade",
          menor: g.menor ?? g.estatisticas?.menor ?? 0,
          mediana: g.mediana ?? g.estatisticas?.mediana ?? 0,
          maior: g.maior ?? g.estatisticas?.maior ?? 0,
          total: g.total ?? g.estatisticas?.total ?? g.fontes ?? 0,
          outliers: g.outliers ?? g.outliers_removidos ?? g.estatisticas?.outliers ?? 0,
          itens: g.itens ?? g.resultados ?? [],
        }));
        setUnitGroups(groups.sort((a, b) => b.total - a.total));
      } else if (data.resultados && data.estatisticas) {
        // Legacy single-group fallback
        setLegacyResults(data.resultados);
        setLegacyStats(data.estatisticas);
        setUnitGroups([{
          unidade: unidade || "unidade",
          menor: data.estatisticas.menor,
          mediana: data.estatisticas.mediana,
          maior: data.estatisticas.maior,
          total: data.estatisticas.total,
          outliers: data.estatisticas.outliers,
          itens: data.resultados,
        }]);
      }

      setAnaliseIa(data.analise_ia ?? "");
      setMemoriaCalculo(data.memoria_calculo ?? "");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro na pesquisa de preços");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
    }
  };

  const handleToggleSelectItem = (item: any) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id || (i.orgao === item.orgao && i.valor_unitario === item.valor_unitario));
      if (exists) return prev.filter(i => i !== exists);
      return [...prev, item];
    });
  };

  const handleUseValue = (value: number, unidade?: string) => {
    if (onUseValue) {
      onUseValue(value, unidade);
      toast.success(`Valor ${fmt(value)} / ${unidade || "unidade"} aplicado`);
      onOpenChange(false);
    }
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const hasResults = unitGroups && unitGroups.length > 0;
  const maxFontesIdx = hasResults ? unitGroups!.reduce((best, g, i, arr) => g.total > arr[best].total ? i : best, 0) : -1;

  const handleDownloadPdf = async () => {
    if (!hasResults) return;
    setGeneratingPdf(true);
    try {
      const html = buildPdfHtml();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
      toast.success("Relatório de pesquisa de preços gerado!");
    } catch {
      toast.error("Erro ao gerar relatório");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const buildPdfHtml = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR");
    const periodoLabel = periodo === "3m" ? "3 meses" : periodo === "12m" ? "12 meses" : "6 meses";

    const unitTableRows = unitGroups!.map((g, i) => {
      const isRec = i === maxFontesIdx;
      return `<tr${isRec ? ' style="background:#f0f7ff;font-weight:bold"' : ''}>
        <td>${g.unidade}${isRec ? ' <span style="color:#0F6FDE">(Recomendada)</span>' : ''}</td>
        <td>R$ ${g.menor.toFixed(2)}</td>
        <td style="color:#0F6FDE;font-weight:bold">R$ ${g.mediana.toFixed(2)}</td>
        <td>R$ ${g.maior.toFixed(2)}</td>
        <td>${g.total}</td>
        <td>${g.outliers}</td>
      </tr>`;
    }).join("");

    // Detailed items per unit
    const detailSections = unitGroups!.map(g => {
      const valid = g.itens.filter((i: any) => !i.is_outlier);
      const outliers = g.itens.filter((i: any) => i.is_outlier);
      return `
      <h2>Preços Coletados — ${g.unidade} (${g.total} fontes)</h2>
      <table><thead><tr><th>Órgão</th><th>UF</th><th>Data</th><th>Valor Unit.</th><th>Fonte</th></tr></thead><tbody>
      ${valid.map((i: any) => `<tr><td>${i.orgao}</td><td>${i.estado}</td><td>${i.data}</td><td>R$ ${i.valor_unitario?.toFixed(2) ?? '-'}</td><td>${i.fonte}</td></tr>`).join("")}
      </tbody></table>
      ${outliers.length > 0 ? `<p style="font-size:9px;color:#888">Outliers removidos: ${outliers.length} (desvio > 2σ)</p>` : ''}`;
    }).join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório de Pesquisa de Preços</title>
<style>body{font-family:Arial,sans-serif;font-size:11px;margin:40px;color:#333}
h1{font-size:16px;border-bottom:2px solid #0F6FDE;padding-bottom:8px}
h2{font-size:13px;margin-top:24px;color:#0F6FDE}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:10px}
th{background:#f5f5f5;font-weight:bold}
.ai-box{background:#f0f7ff;border:1px solid #bdd7f5;border-radius:6px;padding:16px;margin:12px 0}
.memo-box{background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:16px;margin:12px 0;font-size:10px;white-space:pre-line}
.footer{margin-top:40px;padding-top:12px;border-top:1px solid #ddd;font-size:9px;color:#888}
</style></head><body>
<h1>${orgaoNome ?? "Órgão"} — Relatório de Pesquisa de Preços</h1>
<p><strong>Data:</strong> ${dateStr}</p>
<p><strong>Objeto:</strong> ${objeto}</p>
<p><strong>Período:</strong> ${periodoLabel}</p>
${estado ? `<p><strong>Estado:</strong> ${estado}</p>` : ''}

<h2>Resumo por Unidade de Medida</h2>
<table><thead><tr><th>Unidade</th><th>Mínimo</th><th>Mediana (Ref.)</th><th>Máximo</th><th>Fontes</th><th>Outliers</th></tr></thead><tbody>
${unitTableRows}
</tbody></table>

<h2>Análise de Mercado</h2>
<div class="ai-box">${analiseIa.replace(/\n/g, "<br>")}</div>

${memoriaCalculo ? `<h2>Memória de Cálculo</h2><div class="memo-box">${memoriaCalculo.replace(/\n/g, "<br>")}</div>` : `
<h2>Memória de Cálculo</h2>
<div class="memo-box">
<strong>Fontes consultadas:</strong> PNCP (Portal Nacional de Contratações Públicas), Painel de Preços do Governo Federal, ComprasNet
<br><br><strong>Metodologia:</strong> Mediana saneada conforme IN SEGES/ME nº 65/2021, Art. 5º
<br><br><strong>Critério de exclusão:</strong> Outliers identificados pelo método de 2 desvios-padrão (2σ) da média aritmética dos valores coletados
<br><br><strong>Fundamentação legal:</strong> Art. 23, §1º, Lei 14.133/2021 (Nova Lei de Licitações) e IN SEGES/ME nº 65/2021
</div>`}

${detailSections}

<p><strong>Responsável:</strong> ${userName ?? "Usuário"}</p>
<p><strong>Data:</strong> ${dateStr}</p>
<div class="footer">Gerado por MeuJurídico.ai · ${dateStr}</div>
</body></html>`;
  };

  const resetResults = () => {
    setUnitGroups(null);
    setLegacyResults(null);
    setLegacyStats(null);
    setAnaliseIa("");
    setMemoriaCalculo("");
  };

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
            {!hasResults && !loading && (
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
                            <Check className="h-3 w-3 text-white" />
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
            {hasResults && (
              <div className="space-y-5">
                <Button variant="ghost" size="sm" className="text-xs gap-1 -ml-2" onClick={resetResults}>
                  ← Nova pesquisa
                </Button>

                {/* Grouped Unit Table */}
                <div>
                  <h4 className="text-xs font-semibold mb-2">Resultados por Unidade de Medida</h4>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px]">Unidade</TableHead>
                          <TableHead className="text-[10px]">Mínimo</TableHead>
                          <TableHead className="text-[10px]">Mediana</TableHead>
                          <TableHead className="text-[10px]">Máximo</TableHead>
                          <TableHead className="text-[10px]">Fontes</TableHead>
                          <TableHead className="text-[10px]">Outliers</TableHead>
                          <TableHead className="text-[10px] text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unitGroups!.map((group, i) => {
                          const isRecommended = i === maxFontesIdx;
                          return (
                            <TableRow key={group.unidade} className={cn(isRecommended && "bg-primary/5")}>
                              <TableCell className="text-[11px] font-medium">
                                <div className="flex items-center gap-1.5">
                                  {group.unidade}
                                  {isRecommended && (
                                    <div className="flex gap-1 items-center">
                                      <Badge className="text-[7px] px-1.5 py-0 bg-emerald-500 hover:bg-emerald-600 text-white border-none">
                                        Qualidade Ouro
                                      </Badge>
                                      <Badge variant="outline" className="text-[7px] px-1.5 py-0 border-primary/30 text-primary">
                                        PNCP
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-[11px] text-emerald-600">{fmt(group.menor)}</TableCell>
                              <TableCell className="text-[11px] font-bold text-primary">{fmt(group.mediana)}</TableCell>
                              <TableCell className="text-[11px] text-destructive">{fmt(group.maior)}</TableCell>
                              <TableCell className="text-[11px]">{group.total}</TableCell>
                              <TableCell className="text-[11px] text-muted-foreground">{group.outliers}</TableCell>
                              <TableCell className="text-right">
                                {onUseValue ? (
                                  <Button
                                    size="sm"
                                    variant={isRecommended ? "default" : "outline"}
                                    className="text-[10px] h-7 px-3"
                                    onClick={() => handleUseValue(group.mediana, group.unidade)}
                                  >
                                    Usar Mediana
                                  </Button>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">{fmt(group.mediana)}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Preço de referência baseado na mediana saneada. Outliers removidos por desvio acima de 2σ.
                  </p>
                </div>

                {/* Comparative Section */}
                {selectedItems.length > 0 && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-primary" />
                          Itens Selecionados para Comparativo ({selectedItems.length})
                        </h4>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setSelectedItems([])}>Limpar</Button>
                      </div>
                      <div className="space-y-2">
                        {selectedItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] bg-background p-2 rounded border">
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[300px]">{item.orgao}</span>
                              <span className="text-[9px] text-muted-foreground">{item.data} • {item.fonte}</span>
                            </div>
                            <span className="font-bold">{fmt(item.valor_unitario)}</span>
                          </div>
                        ))}
                      </div>
                      {selectedItems.length >= 3 && (
                        <Button variant="outline" className="w-full h-8 text-xs border-primary/30 text-primary hover:bg-primary/10" onClick={() => {
                          const avg = selectedItems.reduce((acc, i) => acc + i.valor_unitario, 0) / selectedItems.length;
                          handleUseValue(avg, unitGroups?.[0]?.unidade);
                        }}>
                          Usar Média dos Selecionados ({fmt(selectedItems.reduce((acc, i) => acc + i.valor_unitario, 0) / selectedItems.length)})
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Individual Items Scroll */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold">Fontes Detalhadas do PNCP</h4>
                  <div className="space-y-2">
                    {unitGroups!.flatMap(g => g.itens).map((item, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-3 rounded-lg border transition-all cursor-pointer hover:border-primary/50",
                          selectedItems.find(i => i.id === item.id || (i.orgao === item.orgao && i.valor_unitario === item.valor_unitario))
                            ? "bg-primary/5 border-primary shadow-sm"
                            : "bg-card hover:bg-muted/30"
                        )}
                        onClick={() => handleToggleSelectItem(item)}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold">{item.orgao}</span>
                              <Badge variant="secondary" className="text-[8px] px-1 py-0">{item.estado}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                              <span>Data: {item.data}</span>
                              <span>Fonte: {item.fonte}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-primary">{fmt(item.valor_unitario)}</p>
                            {selectedItems.find(i => i.id === item.id || (i.orgao === item.orgao && i.valor_unitario === item.valor_unitario)) ? (
                              <div className="h-4 w-4 bg-primary text-white rounded-full flex items-center justify-center ml-auto">
                                <Check className="h-2.5 w-2.5" />
                              </div>
                            ) : (
                              <div className="h-4 w-4 border rounded-full ml-auto opacity-30" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
              </div>
            )}

            {/* Empty state */}
            {unitGroups && unitGroups.length === 0 && !loading && (
              <div className="flex flex-col items-center gap-4 py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/40" />
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Nenhum preço encontrado</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Não encontramos contratações similares. Tente ampliar o período ou usar termos mais genéricos.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {hasResults && (
          <SheetFooter className="border-t px-6 py-3 shrink-0 flex-row gap-2">
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
