import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentChainView } from "@/components/DocumentChainView";

export default function Processo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: processo, isLoading } = useQuery({
    queryKey: ["processo", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: documentos } = useQuery({
    queryKey: ["documentos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, tipo, status, posicao_cadeia, cadeia_id")
        .eq("processo_id", id!)
        .order("posicao_cadeia", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: cadeia } = useQuery({
    queryKey: ["cadeia", documentos?.[0]?.cadeia_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cadeias_documentais")
        .select("cadeia")
        .eq("id", documentos![0].cadeia_id!)
        .single();
      if (error) throw error;
      return (data.cadeia as string[]) ?? [];
    },
    enabled: !!documentos?.[0]?.cadeia_id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
        <p className="text-sm text-muted-foreground">Processo não encontrado.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Process Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {processo.numero_processo || "Sem número"}
          </h1>
          <p className="text-sm text-muted-foreground">{processo.orgao || "—"}</p>
        </div>
        <Badge variant={processo.status === "ativo" ? "default" : "secondary"} className="shrink-0">
          {processo.status ?? "rascunho"}
        </Badge>
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="bg-muted rounded-md px-3 py-2">
          <span className="text-muted-foreground text-xs block">Modalidade</span>
          <span className="font-medium">{processo.modalidade || "—"}</span>
        </div>
        <div className="bg-muted rounded-md px-3 py-2">
          <span className="text-muted-foreground text-xs block">Criado em</span>
          <span className="font-medium">{new Date(processo.created_at).toLocaleDateString("pt-BR")}</span>
        </div>
        <div className="bg-muted rounded-md px-3 py-2 flex-1 min-w-[200px]">
          <span className="text-muted-foreground text-xs block">Objeto</span>
          <span className="font-medium text-xs">{processo.objeto || "—"}</span>
        </div>
      </div>

      {/* Document Chain — Main focal point */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Cadeia Documental</CardTitle>
        </CardHeader>
        <CardContent>
          {cadeia ? (
            <DocumentChainView
              processoId={processo.id}
              cadeia={cadeia}
              documentos={documentos ?? []}
            />
          ) : (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
