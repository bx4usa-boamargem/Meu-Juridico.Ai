import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, LayoutGrid, List, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const FILTER_TABS = [
  { key: "all", label: "Todos" },
  { key: "dfd", label: "DFD" },
  { key: "etp", label: "ETP" },
  { key: "tr", label: "TR" },
  { key: "projeto_basico", label: "Projeto Básico" },
  { key: "mapa_risco", label: "Mapa de Risco" },
  { key: "edital", label: "Edital" },
  { key: "custom", label: "Personalizado" },
];

const CARDS_LIMIT = 30;

function getStoredView(): "cards" | "list" {
  try { return (localStorage.getItem("docs_view") as any) || "cards"; } catch { return "cards"; }
}

export default function Documentos() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"cards" | "list">(getStoredView);

  const { data: documentos, isLoading } = useQuery({
    queryKey: ["all-documentos", filter],
    queryFn: async () => {
      let q = supabase
        .from("documentos")
        .select("id, tipo, status, versao, processo_id, created_at, processos!inner(numero_processo, objeto)")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        q = q.eq("tipo", filter);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const handleClick = (doc: any) => {
    if (!doc.processo_id) {
      toast.error("Documento sem processo vinculado");
      return;
    }
    navigate(`/processo/${doc.processo_id}/documento/${doc.id}`);
  };

  const setViewMode = (v: "cards" | "list") => {
    setView(v);
    try { localStorage.setItem("docs_view", v); } catch {}
  };

  const statusVariant = (s: string | null) => {
    if (s === "aprovado") return "default";
    if (s === "pendente") return "outline";
    return "secondary";
  };

  const cardsDocs = view === "cards" ? (documentos || []).slice(0, CARDS_LIMIT) : [];
  const extraDocs = view === "cards" ? (documentos || []).slice(CARDS_LIMIT) : [];
  const allDocs = documentos || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Documentos</h1>
        <p className="text-sm text-muted-foreground">Todos os documentos dos seus processos</p>
      </div>

      {/* Filter tabs + view toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${filter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("cards")}
            className={`h-8 w-8 rounded flex items-center justify-center transition-colors ${
              view === "cards"
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
            title="Cards"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`h-8 w-8 rounded flex items-center justify-center transition-colors ${
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
            title="Lista"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : !documentos?.length ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? "Nenhum documento encontrado." : `Nenhum documento do tipo "${FILTER_TABS.find(t => t.key === filter)?.label}" encontrado.`}
          </p>
        </div>
      ) : view === "list" ? (
        /* ═══ FULL LIST VIEW ═══ */
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Processo</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDocs.map((doc, i) => (
                <TableRow
                  key={doc.id}
                  className="cursor-pointer hover:!bg-[#F3F8FF]"
                  style={i % 2 === 1 ? { background: "hsl(var(--muted) / .3)" } : {}}
                  onClick={() => handleClick(doc)}
                >
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{doc.tipo ?? "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{(doc.processos as any)?.numero_processo ?? "—"}</TableCell>
                  <TableCell className="text-sm">{doc.versao ?? 1}</TableCell>
                  <TableCell className="text-sm">{new Date(doc.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(doc.status)} className="text-[10px]">{doc.status ?? "rascunho"}</Badge>
                  </TableCell>
                  <TableCell>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* ═══ CARDS VIEW ═══ */
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cardsDocs.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleClick(doc)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{doc.tipo ?? "Documento"}</span>
                    <Badge variant={statusVariant(doc.status)} className="text-[10px]">
                      {doc.status ?? "rascunho"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Processo: {(doc.processos as any)?.numero_processo ?? "—"}</p>
                    {(doc.processos as any)?.objeto && (
                      <p className="truncate max-w-full" title={(doc.processos as any).objeto}>
                        {(doc.processos as any).objeto}
                      </p>
                    )}
                    <p>Versão: {doc.versao ?? 1}</p>
                    <p>{new Date(doc.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Extra docs as compact list */}
          {extraDocs.length > 0 && (
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Mais documentos</span>
                <Separator className="flex-1" />
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Processo</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extraDocs.map((doc, i) => (
                      <TableRow
                        key={doc.id}
                        className="cursor-pointer hover:!bg-[#F3F8FF]"
                        style={i % 2 === 1 ? { background: "hsl(var(--muted) / .3)" } : {}}
                        onClick={() => handleClick(doc)}
                      >
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{doc.tipo ?? "—"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{(doc.processos as any)?.numero_processo ?? "—"}</TableCell>
                        <TableCell className="text-sm">{doc.versao ?? 1}</TableCell>
                        <TableCell className="text-sm">{new Date(doc.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(doc.status)} className="text-[10px]">{doc.status ?? "rascunho"}</Badge>
                        </TableCell>
                        <TableCell>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
