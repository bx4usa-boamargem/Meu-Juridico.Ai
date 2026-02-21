import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentChainView } from "@/components/DocumentChainView";
import { ArrowLeft } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <p className="text-muted-foreground">Processo não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold">Processo {processo.numero_processo}</span>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle>{processo.numero_processo || "Sem número"}</CardTitle>
              <Badge>{processo.status ?? "rascunho"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <span className="text-muted-foreground">Órgão</span>
              <p className="font-medium">{processo.orgao || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Modalidade</span>
              <p className="font-medium">{processo.modalidade || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Objeto</span>
              <p className="font-medium">{processo.objeto || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Criado em</span>
              <p className="font-medium">{new Date(processo.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cadeia Documental</CardTitle>
          </CardHeader>
          <CardContent>
            {cadeia ? (
              <DocumentChainView
                processoId={processo.id}
                cadeia={cadeia}
                documentos={documentos ?? []}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Carregando cadeia...</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
