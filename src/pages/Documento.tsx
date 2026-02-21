import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, List, Eye, ShieldCheck, Search } from "lucide-react";

export default function Documento() {
  const { processoId, docId } = useParams<{ processoId: string; docId: string }>();
  const navigate = useNavigate();

  const { data: documento, isLoading } = useQuery({
    queryKey: ["documento", docId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("*")
        .eq("id", docId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!docId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
        <p className="text-sm text-muted-foreground">Documento não encontrado.</p>
      </div>
    );
  }

  const sections = documento.conteudo_gerado
    ? Object.keys(documento.conteudo_gerado as Record<string, any>)
    : [];

  return (
    <div className="h-[calc(100svh-3rem)] flex flex-col">
      {/* Doc Header */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-background shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{documento.tipo ?? "Documento"}</span>
          <Badge variant="secondary" className="text-[10px]">v{documento.versao ?? 1}</Badge>
          <Badge
            variant={documento.status === "aprovado" ? "default" : "secondary"}
            className="text-[10px]"
          >
            {documento.status ?? "rascunho"}
          </Badge>
        </div>
      </div>

      {/* Three-column layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* LEFT — Structure Tree */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full border-r bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Estrutura
            </p>
            {sections.length > 0 ? (
              <ul className="space-y-1">
                {sections.map((section) => (
                  <li key={section}>
                    <button className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-xs hover:bg-muted text-left">
                      <List className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{section}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma seção gerada.
              </p>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* CENTER — Content Viewer */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full p-6 overflow-auto">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">{documento.tipo}</h2>
              {documento.conteudo_final ? (
                <div className="prose prose-sm max-w-none text-foreground">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {documento.conteudo_final}
                  </p>
                </div>
              ) : sections.length > 0 ? (
                <div className="space-y-4">
                  {sections.map((section) => (
                    <div key={section} className="border rounded-md p-4">
                      <h3 className="text-sm font-medium mb-2">{section}</h3>
                      <p className="text-xs text-muted-foreground">
                        {JSON.stringify((documento.conteudo_gerado as Record<string, any>)[section], null, 2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-12 text-center">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Conteúdo ainda não gerado.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A geração por IA será disponibilizada em breve.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT — Metadata / Preview / Validation */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <div className="h-full border-l bg-muted/10">
            <Tabs defaultValue="metadata" className="h-full flex flex-col">
              <TabsList className="w-full rounded-none border-b bg-transparent justify-start px-2 shrink-0">
                <TabsTrigger value="metadata" className="text-xs gap-1">
                  <FileText className="h-3 w-3" /> Metadata
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs gap-1">
                  <Eye className="h-3 w-3" /> Preview
                </TabsTrigger>
                <TabsTrigger value="validation" className="text-xs gap-1">
                  <ShieldCheck className="h-3 w-3" /> Validação
                </TabsTrigger>
                <TabsTrigger value="research" className="text-xs gap-1">
                  <Search className="h-3 w-3" /> Pesquisa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="metadata" className="flex-1 overflow-auto p-4 mt-0">
                <div className="space-y-3 text-xs">
                  <Field label="Tipo" value={documento.tipo} />
                  <Field label="Status" value={documento.status} />
                  <Field label="Versão" value={String(documento.versao ?? 1)} />
                  <Field label="Posição" value={String(documento.posicao_cadeia ?? "—")} />
                  <Field label="Criado em" value={new Date(documento.created_at).toLocaleString("pt-BR")} />
                  <Field label="Atualizado em" value={new Date(documento.updated_at).toLocaleString("pt-BR")} />
                  {documento.aprovado_em && (
                    <Field label="Aprovado em" value={new Date(documento.aprovado_em).toLocaleString("pt-BR")} />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 overflow-auto p-4 mt-0">
                <p className="text-xs text-muted-foreground italic">
                  Preview do documento será disponibilizado em breve.
                </p>
              </TabsContent>

              <TabsContent value="validation" className="flex-1 overflow-auto p-4 mt-0">
                <p className="text-xs text-muted-foreground italic">
                  Validação do documento será disponibilizada em breve.
                </p>
              </TabsContent>

              <TabsContent value="research" className="flex-1 overflow-auto p-4 mt-0">
                <p className="text-xs text-muted-foreground italic">
                  Pesquisa de referência será disponibilizada em breve.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-muted-foreground block">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
