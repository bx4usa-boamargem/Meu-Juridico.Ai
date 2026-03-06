import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search, Sparkles, Check, ExternalLink, MapPin, Building2,
  Hash, Package, Users, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_INSIGHT = {
  text: "Encontrei notebooks com preços homologados e descrições consistentes, em uma faixa realista (aprox. de R$ 2.300 a R$ 7.800, variando conforme configuração). Descartei os resultados de leilão e itens com valores muito baixos/altos ou que não eram notebooks (ex.: caderno, suporte).",
  count: 6,
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

const MOCK_COTACOES: Cotacao[] = [
  {
    id: "1",
    valor: 3599.0,
    valorEstimado: 7096.64,
    descricao: "notebook / ultrabook",
    categoria: "Material",
    uf: "SP",
    orgao: "MUNICIPIO DE ATIBAIA",
    orgaoCompleto: "Prefeitura Municipal da Estância de Atibaia",
    fornecedor: "IRMAOS RIGO COMERCIO E ASSISTENCIA EM INFORMATICA LTDA",
    cnpj: "32.228.232/0001-98",
    porte: "EPP",
    tipo: "PJ",
    dataHomologacao: "29/01/2024",
    situacao: "Homologado",
    unidade: "Unidade",
    quantidade: 315,
    valorTotal: 2235441.6,
    valorTotalHomologado: 1133685.0,
    item: 1,
    srp: true,
    esfera: "Municipal",
    municipio: "Atibaia",
  },
  {
    id: "2",
    valor: 3599.0,
    valorEstimado: 5200.0,
    descricao: "notebook / ultrabook",
    categoria: "Material",
    uf: "SP",
    orgao: "MUNICIPIO DE CAMPINAS",
    orgaoCompleto: "Prefeitura Municipal de Campinas",
    fornecedor: "TECH SOLUTIONS INFORMATICA LTDA",
    cnpj: "15.443.221/0001-45",
    porte: "ME",
    tipo: "PJ",
    dataHomologacao: "29/01/2024",
    situacao: "Homologado",
    unidade: "Unidade",
    quantidade: 120,
    valorTotal: 624000.0,
    valorTotalHomologado: 431880.0,
    item: 1,
    srp: false,
    esfera: "Municipal",
    municipio: "Campinas",
  },
  {
    id: "3",
    valor: 7798.0,
    valorEstimado: 9500.0,
    descricao: "notebook avançado",
    categoria: "Material",
    uf: "SC",
    orgao: "GOVERNO DO ESTADO DE SC",
    orgaoCompleto: "Secretaria de Administração de Santa Catarina",
    fornecedor: "DELL COMPUTADORES DO BRASIL LTDA",
    cnpj: "72.381.189/0010-25",
    porte: "Grande Empresa",
    tipo: "PJ",
    dataHomologacao: "19/01/2024",
    situacao: "Homologado",
    unidade: "Peça",
    quantidade: 50,
    valorTotal: 475000.0,
    valorTotalHomologado: 389900.0,
    item: 3,
    srp: true,
    esfera: "Estadual",
    municipio: "",
  },
  {
    id: "4",
    valor: 2349.0,
    valorEstimado: 4100.0,
    descricao: "notebook básico educacional",
    categoria: "Material",
    uf: "MG",
    orgao: "PREFEITURA DE BELO HORIZONTE",
    orgaoCompleto: "Prefeitura Municipal de Belo Horizonte",
    fornecedor: "POSITIVO TECNOLOGIA S.A.",
    cnpj: "81.243.735/0001-48",
    porte: "Grande Empresa",
    tipo: "PJ",
    dataHomologacao: "15/02/2024",
    situacao: "Homologado",
    unidade: "Unidade",
    quantidade: 800,
    valorTotal: 3280000.0,
    valorTotalHomologado: 1879200.0,
    item: 2,
    srp: true,
    esfera: "Municipal",
    municipio: "Belo Horizonte",
  },
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
    <div className="p-6 max-w-[1600px] mx-auto space-y-4">
      {/* Search bar */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar item no PNCP..."
          className="pl-9 text-base"
        />
      </div>

      <div className="flex gap-6 items-start">
        {/* LEFT PANEL - AI Picks */}
        <div className="w-[420px] shrink-0 space-y-4">
          {/* AI Insight card */}
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Escolhas da IA</span>
                <Badge variant="secondary" className="text-[10px]">{MOCK_INSIGHT.count}</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {MOCK_INSIGHT.text}
              </p>
            </CardContent>
          </Card>

          {/* Cotações list */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-3 pr-2">
              {MOCK_COTACOES.map((cot) => {
                const isSelected = selectedId === cot.id;
                const isAdded = addedIds.has(cot.id);
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
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">
                            {formatBRL(cot.valor)}
                          </span>
                          <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-0.5">
                            <Sparkles className="h-2.5 w-2.5" /> IA
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant={isAdded ? "secondary" : "default"}
                          className="text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdd(cot.id);
                          }}
                          disabled={isAdded}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {isAdded ? "Adicionado" : "Adicionar"}
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Homologado - {formatBRL(cot.valor)} ({cot.unidade})
                      </p>
                      <p className="text-xs text-muted-foreground">{cot.descricao}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent">
                          <MapPin className="h-2.5 w-2.5" /> {cot.uf}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent">
                          Homologado
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent">
                          {cot.dataHomologacao}
                        </span>
                        {cot.municipio && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent">
                            {cot.municipio}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* RIGHT PANEL - Detail */}
        <div className="flex-1 min-w-0">
          <Card className="sticky top-6">
            <CardContent className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Homologado - {formatBRL(selected.valor)} ({selected.unidade})
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{selected.descricao}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver no PNCP
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver na plataforma de origem
                  </Button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1 text-xs">
                  <Hash className="h-3 w-3" /> Item {selected.item}
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs">
                  <Package className="h-3 w-3" /> {selected.categoria}
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs">
                  <Building2 className="h-3 w-3" /> {selected.orgao}
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs">
                  {selected.orgaoCompleto}
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs">
                  <Users className="h-3 w-3" /> {selected.fornecedor.split(" ").slice(0, 3).join(" ")}...
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs">
                  <MapPin className="h-3 w-3" /> {selected.municipio || selected.uf} - {selected.uf}
                </Badge>
              </div>

              <Separator />

              {/* Value comparison */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Valor Estimado</p>
                  <p className="text-2xl font-bold text-primary">{formatBRL(selected.valorEstimado)}</p>
                  <p className="text-xs text-muted-foreground">
                    Total: {formatBRL(selected.valorTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selected.quantidade} {selected.unidade}
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-card space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Valor Homologado</p>
                  <p className="text-2xl font-bold text-success">{formatBRL(selected.valor)}</p>
                  <p className="text-xs text-muted-foreground">
                    Total: {formatBRL(selected.valorTotalHomologado)}
                  </p>
                  <p className="text-xs text-muted-foreground">{selected.fornecedor.slice(0, 30)}...</p>
                </div>

                <div className="p-4 rounded-lg border bg-card space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Situação</p>
                  <Badge className="bg-success/10 text-success border-success/20 mt-1">
                    {selected.situacao}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Menor preço
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SRP: {selected.srp ? "Sim" : "Não"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Result details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Resultado</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Fornecedor</p>
                      <p className="font-medium">{selected.fornecedor}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Tipo do Fornecedor</p>
                      <p className="font-medium">{selected.tipo}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Valor unitário homologado</p>
                      <p className="font-medium text-success">{formatBRL(selected.valor)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Quantidade homologada</p>
                      <p className="font-medium">{selected.quantidade}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Edital</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">CNPJ/CPF do Fornecedor</p>
                      <p className="font-medium">{selected.cnpj}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Porte do Fornecedor</p>
                      <p className="font-medium">{selected.porte}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Valor total homologado</p>
                      <p className="font-medium text-success">{formatBRL(selected.valorTotalHomologado)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Percentual de desconto</p>
                      <p className="font-medium">
                        {((1 - selected.valor / selected.valorEstimado) * 100).toFixed(2)}%
                      </p>
                    </div>
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
