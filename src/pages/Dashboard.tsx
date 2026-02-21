import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LogOut, FolderOpen, Scale } from "lucide-react";
import { NovoProcessoDialog } from "@/components/NovoProcessoDialog";
import { useState } from "react";

const statusColor: Record<string, string> = {
  rascunho: "secondary",
  ativo: "default",
  finalizado: "outline",
};

export default function Dashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: processos, isLoading, refetch } = useQuery({
    queryKey: ["processos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos")
        .select(`*, documentos (id, tipo, status, posicao_cadeia)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">MeuJurídico.ai</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Processos</h1>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Processo
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !processos?.length ? (
          <Card className="text-center py-12">
            <CardContent className="flex flex-col items-center gap-3">
              <FolderOpen className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum processo encontrado.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Criar primeiro processo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {processos.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/processo/${p.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{p.numero_processo || "Sem número"}</CardTitle>
                    <Badge variant={statusColor[p.status ?? "rascunho"] as any}>
                      {p.status ?? "rascunho"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="text-muted-foreground line-clamp-2">{p.objeto}</p>
                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span>{p.modalidade}</span>
                    <span>{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {p.orgao && (
                    <p className="text-xs text-muted-foreground">{p.orgao}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <NovoProcessoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
