import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RichTextEditor } from "@/components/documento/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Save, Printer, Share2, Send, FileText, ArrowLeft,
  Loader2, Check, Copy, ExternalLink
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function DocumentView() {
  const { processoId, docId } = useParams<{ processoId: string; docId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [editedHtml, setEditedHtml] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [creatingShare, setCreatingShare] = useState(false);

  // Fetch latest version
  const { data: version, isLoading } = useQuery({
    queryKey: ["document-version", docId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("documento_id", docId!)
        .order("versao", { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!docId,
  });

  const { data: documento } = useQuery({
    queryKey: ["documento", docId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("tipo, status, workflow_status")
        .eq("id", docId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!docId,
  });

  const { data: processo } = useQuery({
    queryKey: ["processo-for-doc", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos")
        .select("numero_processo, orgao")
        .eq("id", processoId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!processoId,
  });

  const currentHtml = editedHtml ?? version?.conteudo_html ?? "";
  const hasChanges = editedHtml !== null && editedHtml !== version?.conteudo_html;

  const handleSaveVersion = useCallback(async () => {
    if (!version || !editedHtml) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("document_versions").insert({
        documento_id: docId!,
        processo_id: processoId!,
        conteudo_html: editedHtml,
        versao: version.versao + 1,
        gerado_por: user?.id,
      });
      if (error) throw error;

      await supabase.from("documentos").update({ conteudo_final: editedHtml }).eq("id", docId!);

      queryClient.invalidateQueries({ queryKey: ["document-version", docId] });
      setEditedHtml(null);
      toast.success(`Versão ${version.versao + 1} salva com sucesso!`);
    } catch (e: any) {
      toast.error("Erro ao salvar versão: " + e.message);
    } finally {
      setSaving(false);
    }
  }, [version, editedHtml, docId, processoId, user, queryClient]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>${documento?.tipo ?? "Documento"}</title>
      <style>@media print { body { margin: 20mm; } }</style>
      </head><body>${currentHtml}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [currentHtml, documento]);

  const handleShare = useCallback(async () => {
    if (!version) return;
    setShareDialogOpen(true);
    setCreatingShare(true);
    try {
      // Check for existing active link
      const { data: existing } = await supabase
        .from("document_share_links")
        .select("token")
        .eq("version_id", version.id)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();

      if (existing) {
        setShareLink(`${window.location.origin}/shared/${existing.token}`);
      } else {
        const { data: newLink, error } = await supabase
          .from("document_share_links")
          .insert({
            documento_id: docId!,
            version_id: version.id,
            created_by: user?.id,
          })
          .select("token")
          .single();
        if (error) throw error;
        setShareLink(`${window.location.origin}/shared/${newLink.token}`);
      }
    } catch (e: any) {
      toast.error("Erro ao criar link: " + e.message);
    } finally {
      setCreatingShare(false);
    }
  }, [version, docId, user]);

  const handleWorkflowChange = useCallback(async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("documentos")
        .update({ workflow_status: newStatus })
        .eq("id", docId!);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["documento", docId] });
      toast.success(
        newStatus === "em_aprovacao"
          ? "Documento enviado para aprovação!"
          : `Status atualizado para ${newStatus}`
      );
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  }, [docId, queryClient]);

  const workflowBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
      em_aprovacao: { label: "Em Aprovação", className: "bg-warning/15 text-warning border-warning/30" },
      aprovado: { label: "Aprovado", className: "bg-success/15 text-success border-success/30" },
      rejeitado: { label: "Rejeitado", className: "bg-destructive/15 text-destructive border-destructive/30" },
    };
    const s = map[status] ?? map.rascunho;
    return <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${s.className}`}>{s.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!version) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
        <p className="text-sm text-muted-foreground">Nenhuma versão encontrada.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Top toolbar */}
      <div className="h-12 shrink-0 border-b bg-card flex items-center px-4 gap-3">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate(`/processo/${processoId}`)}>
          <ArrowLeft className="h-3 w-3" /> Voltar
        </Button>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold truncate">{documento?.tipo ?? "Documento"}</span>
          {processo?.numero_processo && (
            <span className="text-xs text-muted-foreground">• {processo.numero_processo}</span>
          )}
          {workflowBadge(documento?.workflow_status ?? "rascunho")}
          <Badge variant="secondary" className="text-[10px] px-1.5">v{version.versao}</Badge>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasChanges && (
            <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSaveVersion} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Salvar v{version.versao + 1}
            </Button>
          )}

          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handlePrint}>
            <Printer className="h-3 w-3" /> Imprimir / PDF
          </Button>

          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleShare}>
            <Share2 className="h-3 w-3" /> Compartilhar
          </Button>

          {documento?.workflow_status === "rascunho" && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-primary/30 text-primary" onClick={() => handleWorkflowChange("em_aprovacao")}>
              <Send className="h-3 w-3" /> Enviar p/ Aprovação
            </Button>
          )}
          {documento?.workflow_status === "em_aprovacao" && (
            <>
              <Button size="sm" className="h-7 text-xs gap-1 bg-success hover:bg-success/90" onClick={() => handleWorkflowChange("aprovado")}>
                <Check className="h-3 w-3" /> Aprovar
              </Button>
              <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={() => handleWorkflowChange("rejeitado")}>
                Rejeitar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-3xl mx-auto">
          <RichTextEditor
            value={currentHtml}
            onChange={setEditedHtml}
            className="min-h-[600px]"
          />
        </div>
      </ScrollArea>

      {/* Share dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Compartilhar Documento</DialogTitle>
            <DialogDescription className="text-xs">
              Qualquer pessoa com o link poderá visualizar este documento (somente leitura).
            </DialogDescription>
          </DialogHeader>
          {creatingShare ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : shareLink ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md border p-2">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs truncate flex-1 font-mono">{shareLink}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    toast.success("Link copiado!");
                  }}
                >
                  <Copy className="h-3 w-3" /> Copiar
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
