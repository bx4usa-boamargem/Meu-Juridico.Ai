import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Search,
    BarChart3,
    Sparkles,
    Download,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    AlertCircle
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "../ui/Sheet";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/Select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/Table";
import { Badge } from "../ui/Badge";
import { toast } from "sonner";

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
    const [memoriaCalculo, setMemoriaCalculo] = useState<any>(null);
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
        setUnitGroups(null);

        const t1 = setTimeout(() => setLoadingPhase(1), 1500);
        const t2 = setTimeout(() => setLoadingPhase(2), 3000);

        try {
            const { data, error } = await supabase.functions.invoke("price-research", {
                body: {
                    objeto,
                    estado: estado !== "Nacional" ? estado : null,
                    municipio: municipio || null,
                    periodo,
                    unidade_medida: unidade || null,
                    processo_id: processoId
                },
            });
            if (error) throw error;

            if (data.resultados_por_unidade && Array.isArray(data.resultados_por_unidade)) {
                setUnitGroups(data.resultados_por_unidade.sort((a: any, b: any) => b.total - a.total));
            }

            setAnaliseIa(data.analise_ia ?? "");
            setMemoriaCalculo(data.memoria_calculo ?? null);
        } catch (err: any) {
            console.error(err);
            toast.error("Erro na pesquisa de preços");
        } finally {
            clearTimeout(t1);
            clearTimeout(t2);
            setLoading(false);
        }
    };

    const handleUseValue = (group: UnitGroup) => {
        if (onUseValue) {
            onUseValue(group.mediana, group.unidade);
            toast.success(`Valor ${fmt(group.mediana)} / ${group.unidade} aplicado`);
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
                setTimeout(() => {
                    printWindow.print();
                }, 500);
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
            return `
        <tr>
          <td>${g.unidade}${isRec ? ' <strong>(Recomendada)</strong>' : ''}</td>
          <td>${fmt(g.menor)}</td>
          <td style="background:#f0f7ff; font-weight:bold">${fmt(g.mediana)}</td>
          <td>${fmt(g.maior)}</td>
          <td>${g.total}</td>
          <td>${g.outliers}</td>
        </tr>
      `;
        }).join("");

        const detailSections = unitGroups!.map(g => {
            return `
      <div style="page-break-before: always;">
        <h2>Preços Coletados — ${g.unidade} (${g.total} fontes)</h2>
        <table>
          <thead>
            <tr>
              <th>Órgão</th>
              <th>UF</th>
              <th>Data</th>
              <th>Valor Unit.</th>
              <th>Fonte</th>
            </tr>
          </thead>
          <tbody>
            ${g.itens.map((i: any) => `
              <tr>
                <td>${i.orgao}</td>
                <td>${i.estado}</td>
                <td>${new Date(i.data).toLocaleDateString('pt-BR')}</td>
                <td>${fmt(i.valor_unitario)}</td>
                <td>${i.fonte}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;
        }).join("");

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Pesquisa de Preços</title>
        <style>
          body{font-family:Arial,sans-serif;font-size:11px;margin:40px;color:#333}
          h1{font-size:16px;border-bottom:2px solid #0F6FDE;padding-bottom:8px}
          h2{font-size:13px;margin-top:24px;color:#0F6FDE}
          table{width:100%;border-collapse:collapse;margin:12px 0}
          th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:10px}
          th{background:#f5f5f5;font-weight:bold}
          .ai-box{background:#f0f7ff;border:1px solid #bdd7f5;border-radius:6px;padding:16px;margin:12px 0}
          .memo-box{background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:16px;margin:12px 0;font-size:10px;white-space:pre-line}
          .footer{margin-top:40px;padding-top:12px;border-top:1px solid #ddd;font-size:9px;color:#888}
        </style>
      </head>
      <body>
        <h1>Relatório de Pesquisa de Preços</h1>
        <p><strong>Órgão:</strong> ${orgaoNome ?? "Não informado"}</p>
        <p><strong>Objeto:</strong> ${objeto}</p>
        <p><strong>Data:</strong> ${dateStr}</p>
        <p><strong>Período:</strong> ${periodoLabel}</p>
        ${estado ? `<p><strong>Estado:</strong> ${estado}</p>` : ''}

        <h2>Resumo por Unidade de Medida</h2>
        <table>
          <thead>
            <tr>
              <th>Unidade</th>
              <th>Mínimo</th>
              <th>Mediana (Ref.)</th>
              <th>Máximo</th>
              <th>Fontes</th>
              <th>Outliers</th>
            </tr>
          </thead>
          <tbody>
            ${unitTableRows}
          </tbody>
        </table>

        <h2>Análise de Mercado</h2>
        <div class="ai-box">
          ${analiseIa.replace(/\n/g, "<br>")}
        </div>

        <h2>Memória de Cálculo</h2>
        <div class="memo-box">
          ${memoriaCalculo ? `
            <strong>Metodologia:</strong> ${memoriaCalculo.metodologia}
            <strong>Critério de Saneamento:</strong> ${memoriaCalculo.criterio_exclusao}
            <strong>Fontes Consultadas:</strong> ${memoriaCalculo.fontes_consultadas?.join(", ")}
            <strong>Fundamentação Legal:</strong> ${memoriaCalculo.fundamentacao_legal}
          ` : `
            Fontes consultadas: PNCP (Portal Nacional de Contratações Públicas), Painel de Preços do Governo Federal, ComprasNet
            Metodologia: Mediana saneada conforme IN SEGES/ME nº 65/2021, Art. 5º
            Critério de exclusão: Outliers identificados pelo método de 2 desvios-padrão (2σ) da média aritmética dos valores coletados
            Fundamentação legal: Art. 23, §1º, Lei 14.133/2021 (Nova Lei de Licitações) e IN SEGES/ME nº 65/2021
          `}
        </div>

        ${detailSections}

        <div class="footer">
          Responsável: ${userName ?? "Usuário"} · Gerado por MeuJurídico.ai em ${dateStr}
        </div>
      </body>
      </html>
    `;
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[700px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2 text-2xl">
                        <BarChart3 className="w-6 h-6 text-brand-primary" />
                        Pesquisa de Preços de Mercado
                    </SheetTitle>
                    <SheetDescription>
                        Conforme Art. 23 Lei 14.133/2021 e IN SEGES 65/2021
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Search Form */}
                    {!hasResults && !loading && (
                        <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Objeto da pesquisa</label>
                                <Input
                                    value={objeto}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setObjeto(e.target.value)}
                                    placeholder="Ex: serviços de controle de pragas"
                                    className="bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Estado</label>
                                    <Select value={estado} onValueChange={setEstado}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Nacional" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Nacional">Nacional</SelectItem>
                                            {ESTADOS.map(uf => (
                                                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Município (opcional)</label>
                                    <Input
                                        value={municipio}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMunicipio(e.target.value)}
                                        placeholder="Ex: São Paulo"
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Período</label>
                                    <Select value={periodo} onValueChange={setPeriodo}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3m">Últimos 3 meses</SelectItem>
                                            <SelectItem value="6m">Últimos 6 meses</SelectItem>
                                            <SelectItem value="12m">Último ano</SelectItem>
                                            <SelectItem value="24m">Últimos 2 anos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Unidade de medida</label>
                                    <Input
                                        value={unidade}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnidade(e.target.value)}
                                        placeholder="Ex: mensal, unidade, m²"
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            <Button onClick={handleSearch} className="w-full gap-2">
                                <Search className="w-4 h-4" />
                                Pesquisar
                            </Button>
                        </div>
                    )}

                    {/* Loading States */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
                            <div className="space-y-3 w-full max-w-xs">
                                {LOADING_PHASES.map((phase, i) => {
                                    const PhaseIcon = phase.icon;
                                    const isDone = loadingPhase > i;
                                    const isCurrent = loadingPhase === i;
                                    return (
                                        <div key={i} className={`flex items-center gap-3 transition-opacity ${isCurrent ? "opacity-100" : "opacity-40"}`}>
                                            {isDone ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <PhaseIcon className={`w-5 h-5 ${isCurrent ? "text-brand-primary animate-pulse" : ""}`} />
                                            )}
                                            <span className={`text-sm ${isCurrent ? "font-medium" : ""}`}>{phase.text}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Results View */}
                    {hasResults && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <Button variant="ghost" onClick={() => setUnitGroups(null)} className="gap-2 mb-2">
                                <ArrowLeft className="w-4 h-4" />
                                Nova pesquisa
                            </Button>

                            <div className="space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    Resultados por Unidade de Medida
                                </h3>

                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>Unidade</TableHead>
                                                <TableHead>Mínimo</TableHead>
                                                <TableHead>Mediana</TableHead>
                                                <TableHead>Máximo</TableHead>
                                                <TableHead>Fontes</TableHead>
                                                <TableHead className="text-right">Ação</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {unitGroups!.map((group, i) => {
                                                const isRecommended = i === maxFontesIdx;
                                                return (
                                                    <TableRow key={i} className={isRecommended ? "bg-blue-50/30" : ""}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex flex-col">
                                                                {group.unidade}
                                                                {isRecommended && (
                                                                    <Badge variant="rascunho" className="w-fit text-[10px] h-4 mt-1 bg-blue-100 text-blue-700 border-blue-200">
                                                                        Recomendada
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs">{fmt(group.menor)}</TableCell>
                                                        <TableCell className="font-bold text-brand-primary">{fmt(group.mediana)}</TableCell>
                                                        <TableCell className="text-xs">{fmt(group.maior)}</TableCell>
                                                        <TableCell>{group.total}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" onClick={() => handleUseValue(group)} className="h-8 text-xs">
                                                                Usar este valor
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                                <p className="text-[10px] text-slate-500 italic">
                                    * Preço de referência baseado na mediana saneada. Outliers removidos por desvio acima de 2σ.
                                </p>
                            </div>

                            {analiseIa && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-blue-800 font-bold mb-1">
                                        <Sparkles className="w-4 h-4" />
                                        Análise de Mercado (IA)
                                    </div>
                                    <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">
                                        {analiseIa}
                                    </p>
                                    <div className="pt-2 text-[10px] text-blue-700/70 uppercase tracking-wider font-semibold">
                                        Fundamentação: Art. 23 Lei 14.133/2021 · IN SEGES 65/2021
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty state */}
                    {unitGroups && unitGroups.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <AlertCircle className="w-12 h-12 text-slate-300" />
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-700">Nenhum preço encontrado</h3>
                                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                    Não encontramos contratações similares. Tente ampliar o período ou usar termos mais genéricos.
                                </p>
                            </div>
                            <Button variant="primary" onClick={() => setUnitGroups(null)}>Tentar novamente</Button>
                        </div>
                    )}
                </div>

                <SheetFooter className="mt-8 pt-6 border-t">
                    {hasResults && (
                        <Button onClick={handleDownloadPdf} disabled={generatingPdf} className="w-full gap-2">
                            {generatingPdf ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            Gerar Relatório PDF
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
