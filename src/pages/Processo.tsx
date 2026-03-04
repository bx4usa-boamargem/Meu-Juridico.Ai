import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentChainView } from "@/components/DocumentChainView";
import { Plus } from "lucide-react";

interface PipelineItem {
  tipo: string;
  posicao: number;
  doc_id: string | null;
  status: string | null;
  desbloqueado: boolean;
}

export default function Processo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Load processo + DFD ativo via view
  const { data: processo, isLoading } = useQuery({
    queryKey: ["processo", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_processo_com_dfd" as any)
        .select("*")
        .eq("processo_id", id!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  // Load pipeline via RPC (only when DFD is approved)
  const dfdAprovado = processo?.dfd_status === "aprovado";
  const { data: pipeline } = useQuery({
    queryKey: ["pipeline", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("obter_pipeline_processo" as any, {
        p_processo_id: id!,
      });
      if (error) throw error;
      return (data as any as PipelineItem[]) ?? [];
    },
    enabled: !!id && dfdAprovado,
  });

  // Auto-redirect: DFD not approved → go to document workspace
  useEffect(() => {
    if (!processo) return;
    const { dfd_id, dfd_status } = processo;
    if (dfd_id && dfd_status !== "aprovado") {
      navigate(`/processo/${id}/documento/${dfd_id}`, { replace: true });
    }
  }, [processo, id, navigate]);

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

  // No DFD at all
  if (!processo.dfd_id) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
        <p className="text-sm text-muted-foreground">Processo sem DFD vinculado.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
          Voltar
        </Button>
      </div>
    );
  }

  // DFD not approved → useEffect will redirect, show loading
  if (processo.dfd_status !== "aprovado") {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  // DFD approved → show pipeline

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
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => navigate(`/processo/${processo.processo_id}/novo-documento`)}
          >
            <Plus className="h-3.5 w-3.5" /> Criar novo documento
          </Button>
          <Badge variant={processo.status === "DFD_APROVADO" ? "default" : "secondary"} className="shrink-0">
            {processo.status ?? "rascunho"}
          </Badge>
        </div>
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

      {/* Document Chain — Pipeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Cadeia Documental</CardTitle>
        </CardHeader>
        <CardContent>
          {pipeline ? (
            <DocumentChainView
              processoId={processo.processo_id}
              pipeline={pipeline ?? []}
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
