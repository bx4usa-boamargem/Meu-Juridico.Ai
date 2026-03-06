import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search, Sparkles, Check, ExternalLink, MapPin, Building2,
  Hash, Package, Users, TrendingDown, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_INSIGHT = {
  text: "Encontrei 6 cotações de notebooks com preços homologados entre R$ 2.349 e R$ 7.798. Descartei itens de leilão, valores inconsistentes e produtos que não correspondem à descrição solicitada.",
  count: 6,
  savings: "49,3%",
};

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
}

const BASE_COTACOES: Cotacao[] = [
  {
    id: "1", valor: 3599.0, valorEstimado: 7096.64,
    descricao: "Notebook Ultrabook 14\" i5 16GB SSD 512GB", categoria: "Material",
    uf: "SP", orgao: "MUNICIPIO DE ATIBAIA",
    orgaoCompleto: "Prefeitura Municipal da Estância de Atibaia",
    fornecedor: "IRMAOS RIGO COMERCIO E ASSISTENCIA EM INFORMATICA LTDA",
    cnpj: "32.228.232/0001-98", porte: "EPP", tipo: "PJ",
    dataHomologacao: "29/01/2024", situacao: "Homologado",
    unidade: "Unidade", quantidade: 315,
    valorTotal: 2235441.6, valorTotalHomologado: 1133685.0,
    item: 1, srp: true, esfera: "Municipal", municipio: "Atibaia",
  },
  {
    id: "2", valor: 3599.0, valorEstimado: 5200.0,
    descricao: "Notebook Corporativo 15.6\" i5 8GB SSD 256GB", categoria: "Material",
    uf: "SP", orgao: "MUNICIPIO DE CAMPINAS",
    orgaoCompleto: "Prefeitura Municipal de Campinas",
    fornecedor: "TECH SOLUTIONS INFORMATICA LTDA",
    cnpj: "15.443.221/0001-45", porte: "ME", tipo: "PJ",
    dataHomologacao: "29/01/2024", situacao: "Homologado",
    unidade: "Unidade", quantidade: 120,
    valorTotal: 624000.0, valorTotalHomologado: 431880.0,
    item: 1, srp: false, esfera: "Municipal", municipio: "Campinas",
  },
  {
    id: "3", valor: 7798.0, valorEstimado: 9500.0,
    descricao: "Notebook Avançado 14\" i7 32GB SSD 1TB", categoria: "Material",
    uf: "SC", orgao: "GOVERNO DO ESTADO DE SC",
    orgaoCompleto: "Secretaria de Administração de Santa Catarina",
    fornecedor: "DELL COMPUTADORES DO BRASIL LTDA",
    cnpj: "72.381.189/0010-25", porte: "Grande Empresa", tipo: "PJ",
    dataHomologacao: "19/01/2024", situacao: "Homologado",
    unidade: "Peça", quantidade: 50,
    valorTotal: 475000.0, valorTotalHomologado: 389900.0,
    item: 3, srp: true, esfera: "Estadual", municipio: "",
  },
  {
    id: "4", valor: 2349.0, valorEstimado: 4100.0,
    descricao: "Notebook Básico Educacional 14\" Celeron 4GB", categoria: "Material",
    uf: "MG", orgao: "PREFEITURA DE BH",
    orgaoCompleto: "Prefeitura Municipal de Belo Horizonte",
    fornecedor: "POSITIVO TECNOLOGIA S.A.",
    cnpj: "81.243.735/0001-48", porte: "Grande Empresa", tipo: "PJ",
    dataHomologacao: "15/02/2024", situacao: "Homologado",
    unidade: "Unidade", quantidade: 800,
    valorTotal: 3280000.0, valorTotalHomologado: 1879200.0,
    item: 2, srp: true, esfera: "Municipal", municipio: "Belo Horizonte",
  },
  {
    id: "5", valor: 4250.0, valorEstimado: 6800.0,
    descricao: "Notebook Intermediário 15.6\" Ryzen 5 16GB SSD 512GB", categoria: "Material",
    uf: "RJ", orgao: "GOVERNO DO ESTADO DO RJ",
    orgaoCompleto: "Secretaria de Estado de Fazenda do Rio de Janeiro",
    fornecedor: "LENOVO TECNOLOGIA BRASIL LTDA",
    cnpj: "07.275.920/0001-61", porte: "Grande Empresa", tipo: "PJ",
    dataHomologacao: "05/03/2024", situacao: "Homologado",
    unidade: "Unidade", quantidade: 200,
    valorTotal: 1360000.0, valorTotalHomologado: 850000.0,
    item: 2, srp: true, esfera: "Estadual", municipio: "",
  },
  {
    id: "6", valor: 5890.0, valorEstimado: 8200.0,
    descricao: "Notebook Profissional 14\" i7 16GB SSD 512GB Touch", categoria: "Material",
    uf: "DF", orgao: "SENADO FEDERAL",
    orgaoCompleto: "Senado Federal - Secretaria de Administração",
    fornecedor: "HP BRASIL INDUSTRIA E COMERCIO LTDA",
    cnpj: "61.797.924/0007-40", porte: "Grande Empresa", tipo: "PJ",
    dataHomologacao: "12/02/2024", situacao: "Homologado",
    unidade: "Unidade", quantidade: 80,
    valorTotal: 656000.0, valorTotalHomologado: 471200.0,
    item: 1, srp: false, esfera: "Federal", municipio: "",
  },
];

// Generate 50 extra mock cotações for scroll stress-test
const UFS = ["SP", "RJ", "MG", "SC", "PR", "RS", "BA", "PE", "CE", "DF", "GO", "PA", "AM", "MT", "MS"];
const ESFERAS = ["Municipal", "Estadual", "Federal"];
const PORTES = ["ME", "EPP", "Grande Empresa"];
const DESCRICOES = [
  "Notebook 14\" i5 8GB SSD 256GB", "Notebook 15.6\" i7 16GB SSD 512GB",
  "Notebook Educacional 11.6\" Celeron 4GB", "Ultrabook 13\" i7 16GB SSD 1TB",
  "Notebook Workstation 15.6\" i9 32GB SSD 1TB", "Notebook Corporativo 14\" Ryzen 7 16GB",
  "Notebook Básico 14\" Pentium 4GB HDD 500GB", "Notebook Gamer 15.6\" i7 32GB RTX",
];
const FORNECEDORES = [
  "LENOVO TECNOLOGIA LTDA", "DELL COMPUTADORES LTDA", "HP BRASIL LTDA",
  "POSITIVO TECNOLOGIA S.A.", "ACER DO BRASIL LTDA", "SAMSUNG ELETRONICA LTDA",
  "ASUS COMPUTADORES LTDA", "MULTILASER INDUSTRIAL LTDA",
];

const EXTRA_COTACOES: Cotacao[] = Array.from({ length: 50 }, (_, i) => {
  const idx = i + 7;
  const valor = Math.round(1800 + Math.random() * 7000);
  const valorEstimado = Math.round(valor * (1.2 + Math.random() * 0.8));
  const quantidade = Math.round(10 + Math.random() * 500);
  const uf = UFS[i % UFS.length];
  return {
    id: String(idx),
    valor,
    valorEstimado,
    descricao: DESCRICOES[i % DESCRICOES.length],
    categoria: "Material",
    uf,
    orgao: `ORGAO ${uf} ${idx}`,
    orgaoCompleto: `Órgão Público ${idx} - ${uf}`,
    fornecedor: FORNECEDORES[i % FORNECEDORES.length],
    cnpj: `${String(10 + i).padStart(2, "0")}.000.000/0001-${String(10 + i)}`,
    porte: PORTES[i % PORTES.length],
    tipo: "PJ",
    dataHomologacao: `${String(1 + (i % 28)).padStart(2, "0")}/${String(1 + (i % 12)).padStart(2, "0")}/2024`,
    situacao: "Homologado",
    unidade: "Unidade",
    quantidade,
    valorTotal: valorEstimado * quantidade,
    valorTotalHomologado: valor * quantidade,
    item: (i % 5) + 1,
    srp: i % 3 === 0,
    esfera: ESFERAS[i % ESFERAS.length],
    municipio: i % 3 === 0 ? `Cidade ${idx}` : "",
  };
});

const MOCK_COTACOES: Cotacao[] = [...BASE_COTACOES, ...EXTRA_COTACOES];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getDiscount(estimado: number, homologado: number) {
  return ((1 - homologado / estimado) * 100).toFixed(1);
}

export default function PesquisaPrecos() {
  const [searchTerm, setSearchTerm] = useState("Notebook");
  const [selectedId, setSelectedId] = useState<string>(MOCK_COTACOES[0].id);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const selected = MOCK_COTACOES.find((c) => c.id === selectedId) ?? MOCK_COTACOES[0];

  const handleAdd = (id: string) => {
    setAddedIds((prev) => new Set([...prev, id]));
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight">Pesquisa de Preços</h1>
        <p className="text-sm text-muted-foreground">Consulte preços homologados do PNCP com auxílio da IA</p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-lg mb-4 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar item no PNCP (ex: notebook, cadeira ergonômica)..."
          className="pl-9 text-base"
        />
      </div>

      {/* Main split layout */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* LEFT PANEL */}
        <div className="w-[400px] shrink-0 flex flex-col min-h-0">
          {/* AI Insight - pinned top */}
          <Card className="border-primary/30 bg-primary/[0.03] shadow-sm mb-3 shrink-0">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold">Escolhas da IA</span>
                <Badge variant="secondary" className="text-[10px] ml-auto">{MOCK_INSIGHT.count} resultados</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {MOCK_INSIGHT.text}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1">
                  <TrendingDown className="h-2.5 w-2.5" /> Economia média de {MOCK_INSIGHT.savings}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Cotações list - scrollable only area */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2.5 pr-2">
              {MOCK_COTACOES.map((cot) => {
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
                            Homologado · {cot.unidade} · -{discount}%
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
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                          {cot.esfera}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                          {cot.dataHomologacao}
                        </span>
                        {cot.srp && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            SRP
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

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
          <Card className="sticky top-0">
            <CardContent className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-success/10 text-success border-success/20 text-[10px]">{selected.situacao}</Badge>
                    <Badge variant="outline" className="text-[10px]">{selected.esfera}</Badge>
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
                  <a href="https://paineldeprecos.planejamento.gov.br" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      <ExternalLink className="h-3.5 w-3.5" /> Plataforma de origem
                    </Button>
                  </a>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <Hash className="h-3 w-3" /> Item {selected.item}
                </Badge>
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <Package className="h-3 w-3" /> {selected.categoria}
                </Badge>
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <Building2 className="h-3 w-3" /> {selected.orgao}
                </Badge>
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <MapPin className="h-3 w-3" /> {selected.municipio || selected.uf}
                </Badge>
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <Users className="h-3 w-3" /> {selected.porte}
                </Badge>
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
                  <p className="text-[11px] text-muted-foreground">{formatBRL(selected.valorEstimado - selected.valor)}/un</p>
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
                    <DetailRow label="SRP" value={selected.srp ? "Sim" : "Não"} />
                    <DetailRow label="Esfera" value={selected.esfera} />
                    <DetailRow label="Valor total estimado" value={formatBRL(selected.valorTotal)} />
                    <DetailRow label="Valor total homologado" value={formatBRL(selected.valorTotalHomologado)} highlight />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
