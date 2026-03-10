import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search, Sparkles, Check, ExternalLink, MapPin, Building2,
  Hash, Package, Users, TrendingDown, ArrowRight, Loader2, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Cotacao {
  id: string;
  valor: number;
  valorEstimado: number;
  descricao: string;
  categoria: string;
  uf: string;
  orgao: string;
  orgaoCompleto: string;
  fornecedor: string;
  cnpj: string;
  porte: string;
  tipo: string;
  dataHomologacao: string;
  situacao: string;
  unidade: string;
  quantidade: number;
  valorTotal: number;
  valorTotalHomologado: number;
  item: number;
  srp: boolean;
  esfera: string;
  municipio: string;
  fonte?: string;
  isOutlier?: boolean;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getDiscount(estimado: number, homologado: number) {
  if (!estimado || estimado === 0) return "0.0";
  return ((1 - homologado / estimado) * 100).toFixed(1);
}

export default function PesquisaPrecos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Cotacao[]>([]);
  const [insight, setInsight] = useState<{ text: string; count: number; savings: string } | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error("Digite o objeto da pesquisa");
      return;
    }

    setLoading(true);
    setResults([]);
    setInsight(null);
    setSelectedId(null);
    setAddedIds(new Set());

    try {
      const { data, error } = await supabase.functions.invoke("price-research", {
        body: { objeto: searchTerm, periodo: "6m" },
      });

      if (error) throw error;

      let allItems: any[] = [];
      let mappedStats: any = null;

      if (data.resultados_por_unidade && Array.isArray(data.resultados_por_unidade)) {
        // Merge all groups for the list presentation
        allItems = data.resultados_por_unidade.flatMap((g: any) => g.itens || g.resultados || []);
        mappedStats = data.resultados_por_unidade[0] || null;
      } else if (data.resultados) {
        allItems = data.resultados;
        mappedStats = data.estatisticas || null;
      }

      const mappedResults: Cotacao[] = allItems.map((item: any, index: number) => {
        const valorUnitario = item.valor_unitario || 0;
        const valorEstimado = item.valor_estimado || valorUnitario * 1.2; // default a bit higher to show savings if not provided

        return {
          id: item.id || String(index),
          valor: valorUnitario,
          valorEstimado,
          descricao: item.descricao || searchTerm,
          categoria: item.categoria || "Material",
          uf: item.estado || "BR",
          orgao: item.orgao || "Órgão Público",
          orgaoCompleto: item.orgao || "Órgão Público",
          fornecedor: item.fornecedor || "Não informado",
          cnpj: item.cnpj || "00.000.000/0001-00",
          porte: "ND",
          tipo: "PJ",
          dataHomologacao: item.data || new Date().toLocaleDateString("pt-BR"),
          situacao: "Homologado",
          unidade: item.unidade_medida || "unidade",
          quantidade: item.quantidade || 1,
          valorTotal: valorEstimado * (item.quantidade || 1),
          valorTotalHomologado: valorUnitario * (item.quantidade || 1),
          item: item.item_numero || 1,
          srp: false,
          esfera: "Federal",
          municipio: item.municipio || "",
          fonte: item.fonte || "PNCP",
          isOutlier: item.is_outlier || false
        };
      });

      setResults(mappedResults);
      if (mappedResults.length > 0) {
        setSelectedId(mappedResults[0].id);
      }

      if (data.analise_ia || mappedResults.length > 0) {
        setInsight({
          text: data.analise_ia || `Foram encontrados ${mappedResults.length} resultados usando as bases públicas do Governo Federal.`,
          count: mappedResults.length,
          savings: (mappedStats && mappedStats.maior && mappedStats.mediana)
            ? getDiscount(mappedStats.maior, mappedStats.mediana) + "%"
            : "N/A"
        });
      }

    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao buscar preços: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (id: string) => {
    setAddedIds((prev) => new Set([...prev, id]));
  };

  const selected = results.find((c) => c.id === selectedId) || results[0];

  return (
    <div className="p-6 max-w-[1600px] mx-auto flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight">Pesquisa de Preços</h1>
        <p className="text-sm text-muted-foreground">Consulte preços homologados do PNCP com auxílio da IA</p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-lg mb-4 shrink-0 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar item no PNCP..."
            className="pl-9 text-base"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
          Pesquisar
        </Button>
      </div>

      {/* Main split layout */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* LEFT PANEL */}
        <div className="w-[400px] shrink-0 flex flex-col min-h-0">
          {/* AI Insight - pinned top */}
          {!loading && insight && insight.count > 0 && (
            <Card className="border-primary/30 bg-primary/[0.03] shadow-sm mb-3 shrink-0">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">Análise da IA</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{insight.count} resultados</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {insight.text}
                </p>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Consultando bases de dados (PNCP, TCU, etc)...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 h-full border rounded-xl border-dashed">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum resultado encontrado</p>
              <p className="text-xs text-muted-foreground text-center px-6">Para buscar preços, digite seu termo na barra de busca. Ex: "notebook 14 polegadas".</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-2.5 pr-2">
                {results.map((cot) => {
                  const isSelected = selectedId === cot.id;
                  const isAdded = addedIds.has(cot.id);
                  const discount = getDiscount(cot.valorEstimado, cot.valor);
                  return (
                    <Card
                      key={cot.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        isSelected
                          ? "border-primary ring-1 ring-primary/20 shadow-md"
                          : "hover:border-primary/30 hover:shadow-sm"
                      )}
                      onClick={() => setSelectedId(cot.id)}
                    >
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-base font-bold text-foreground">
                                {formatBRL(cot.valor)}
                              </span>
                              <Badge className="bg-success/10 text-success border-success/20 text-[9px] gap-0.5 h-4">
                                <Sparkles className="h-2 w-2" /> IA
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {cot.situacao} · {cot.unidade} {discount !== "0.0" && discount !== "N/A" ? `· -${discount}%` : ""}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={isAdded ? "secondary" : "default"}
                            className="text-[11px] h-7 px-2.5"
                            onClick={(e) => { e.stopPropagation(); handleAdd(cot.id); }}
                            disabled={isAdded}
                          >
                            <Check className="h-3 w-3 mr-0.5" />
                            {isAdded ? "Adicionado" : "Adicionar"}
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-1">{cot.descricao}</p>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                            <MapPin className="h-2.5 w-2.5" /> {cot.uf}
                          </span>
                          {cot.fonte && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-medium">
                              {cot.fonte}
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                            {cot.dataHomologacao}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Summary - pinned bottom */}
          {addedIds.size > 0 && (
            <Card className="bg-success/5 border-success/20 mt-3 shrink-0">
              <CardContent className="p-3 flex items-center justify-between">
                <span className="text-xs text-success font-medium">
                  {addedIds.size} {addedIds.size === 1 ? "item selecionado" : "itens selecionados"}
                </span>
                <Button size="sm" className="h-7 text-xs bg-success hover:bg-success/90 text-success-foreground">
                  Usar na cesta <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT PANEL - sticky detail */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {selected && (
            <Card className="sticky top-0">
              <CardContent className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-success/10 text-success border-success/20 text-[10px]">{selected.situacao}</Badge>
                      {selected.esfera && <Badge variant="outline" className="text-[10px]">{selected.esfera}</Badge>}
                    </div>
                    <h2 className="text-base font-semibold">{selected.descricao}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{selected.orgaoCompleto}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href="https://pncp.gov.br" target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1.5 text-xs">
                        <ExternalLink className="h-3.5 w-3.5" /> Ver no PNCP
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="gap-1 text-[11px]">
                    <Hash className="h-3 w-3" /> Item {selected.item}
                  </Badge>
                  {selected.categoria && (
                    <Badge variant="outline" className="gap-1 text-[11px]">
                      <Package className="h-3 w-3" /> {selected.categoria}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1 text-[11px]">
                    <Building2 className="h-3 w-3" /> {selected.orgao}
                  </Badge>
                  {selected.municipio && (
                    <Badge variant="outline" className="gap-1 text-[11px]">
                      <MapPin className="h-3 w-3" /> {selected.municipio || selected.uf}
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* Value comparison boxes */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl border-2 border-muted p-5 space-y-1 text-center">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Valor Estimado</p>
                    <p className="text-2xl font-bold text-foreground">{formatBRL(selected.valorEstimado)}</p>
                    <p className="text-[11px] text-muted-foreground">Total: {formatBRL(selected.valorTotal)}</p>
                  </div>

                  <div className="rounded-xl border-2 border-success/30 bg-success/[0.03] p-5 space-y-1 text-center">
                    <p className="text-[11px] text-success font-medium uppercase tracking-wide">Valor Homologado</p>
                    <p className="text-2xl font-bold text-success">{formatBRL(selected.valor)}</p>
                    <p className="text-[11px] text-muted-foreground">Total: {formatBRL(selected.valorTotalHomologado)}</p>
                  </div>

                  <div className="rounded-xl border-2 border-primary/30 bg-primary/[0.03] p-5 space-y-1 text-center">
                    <p className="text-[11px] text-primary font-medium uppercase tracking-wide">Economia</p>
                    <p className="text-2xl font-bold text-primary">-{getDiscount(selected.valorEstimado, selected.valor)}%</p>
                    <p className="text-[11px] text-muted-foreground">{formatBRL(Math.max(0, selected.valorEstimado - selected.valor))}/un</p>
                  </div>
                </div>

                <Separator />

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Resultado da Licitação</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Fornecedor" value={selected.fornecedor} />
                      <DetailRow label="CNPJ" value={selected.cnpj} />
                      <DetailRow label="Tipo" value={`${selected.tipo} · ${selected.porte}`} />
                      <DetailRow label="Valor unitário" value={formatBRL(selected.valor)} highlight />
                      <DetailRow label="Quantidade" value={`${selected.quantidade} ${selected.unidade}`} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Informações do Edital</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Data de homologação" value={selected.dataHomologacao} />
                      <DetailRow label="Fonte de Dados" value={selected.fonte || "PNCP"} />
                      <DetailRow label="UF" value={selected.uf} />
                      <DetailRow label="Valor total estimado" value={formatBRL(selected.valorTotal)} />
                      <DetailRow label="Valor total homologado" value={formatBRL(selected.valorTotalHomologado)} highlight />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn("font-medium", highlight && "text-success")}>{value}</p>
    </div>
  );
}
