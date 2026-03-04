import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { toast } from "sonner";

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

export default function Documentos() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const { data: documentos, isLoading } = useQuery({
    queryKey: ["all-documentos", filter],
    queryFn: async () => {
      let q = supabase
        .from("documentos")
        .select("id, tipo, status, versao, processo_id, created_at, processos!inner(numero_processo)")
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Documentos</h1>
        <p className="text-sm text-muted-foreground">Todos os documentos dos seus processos</p>
      </div>

      {/* Filter tabs */}
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
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documentos.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleClick(doc)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{doc.tipo ?? "Documento"}</span>
                  <Badge variant={doc.status === "aprovado" ? "default" : "secondary"} className="text-[10px]">
                    {doc.status ?? "rascunho"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Processo: {(doc.processos as any)?.numero_processo ?? "—"}</p>
                  <p>Versão: {doc.versao ?? 1}</p>
                  <p>{new Date(doc.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
