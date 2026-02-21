import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Printer, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";

export default function SharedDocument() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["shared-document", token],
    queryFn: async () => {
      // 1. Fetch share link by token
      const { data: shareLink, error: linkError } = await supabase
        .from("document_share_links")
        .select("version_id, documento_id")
        .eq("token", token!)
        .eq("ativo", true)
        .maybeSingle();

      if (linkError) throw linkError;
      if (!shareLink) throw new Error("LINK_NOT_FOUND");

      // 2. Fetch version content
      const { data: version, error: versionError } = await supabase
        .from("document_versions")
        .select("conteudo_html, versao, gerado_em")
        .eq("id", shareLink.version_id)
        .maybeSingle();

      if (versionError) throw versionError;
      if (!version) throw new Error("VERSION_NOT_FOUND");

      // 3. Fetch document metadata
      const { data: documento } = await supabase
        .from("documentos")
        .select("tipo")
        .eq("id", shareLink.documento_id)
        .maybeSingle();

      return {
        html: version.conteudo_html,
        versao: version.versao,
        geradoEm: version.gerado_em,
        tipo: documento?.tipo ?? "Documento",
      };
    },
    enabled: !!token,
    retry: false,
  });

  const handlePrint = useCallback(() => {
    if (!data) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>${data.tipo}</title>
      <style>@media print { body { margin: 20mm; font-family: serif; } }</style>
      </head><body>${data.html}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data) {
    const isNotFound =
      error instanceof Error &&
      (error.message === "LINK_NOT_FOUND" || error.message === "VERSION_NOT_FOUND");

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 max-w-md px-6">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <h1 className="text-lg font-semibold text-foreground">
            {isNotFound ? "Link inválido ou expirado" : "Erro ao carregar documento"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isNotFound
              ? "Este link de compartilhamento não existe, foi desativado ou expirou."
              : "Ocorreu um erro inesperado. Tente novamente mais tarde."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-12 border-b bg-card flex items-center px-4 gap-3 sticky top-0 z-10">
        <FileText className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold truncate flex-1">{data.tipo}</span>
        <span className="text-xs text-muted-foreground">v{data.versao}</span>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handlePrint}>
          <Printer className="h-3 w-3" /> Imprimir
        </Button>
      </header>

      {/* Document content */}
      <main className="max-w-3xl mx-auto p-6">
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
      </main>
    </div>
  );
}
