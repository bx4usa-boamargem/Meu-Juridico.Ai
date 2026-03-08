import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RichTextEditor } from "@/components/documento/RichTextEditor";
import { SignatureBlock, renderSignatureHtml } from "@/components/documento/SignatureBlock";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import { getDocumentTypeLabel } from "@/lib/document-template-renderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  Save, Printer, Share2, Send, FileText, ArrowLeft,
  Loader2, Check, Copy, ExternalLink, Info, Sparkles
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

  // Fetch latest version (with self-healing if missing)
  const { data: version, isLoading } = useQuery({
    queryKey: ["document-version", docId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("documento_id", docId!)
        .order("versao", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;

      // Self-healing: no version exists
      const { data: doc } = await supabase
        .from("documentos")
        .select("conteudo_final, dados_estruturados, processo_id")
        .eq("id", docId!)
        .single();

      if (!doc || !processoId) return null;

      let html = doc.conteudo_final;
      if (!html && doc.dados_estruturados) {
        const { data: proc } = await supabase
          .from("processos").select("*").eq("id", processoId).single();
        const { renderDocumentTemplate } = await import("@/lib/document-template-renderer");
        const docMeta = await supabase.from("documentos").select("tipo").eq("id", docId!).single();
        html = renderDocumentTemplate(docMeta.data?.tipo, doc.dados_estruturados as Record<string, any>, proc as any);
      }
      if (!html) return null;

      const { data: newVersion, error: insertErr } = await supabase
        .from("document_versions")
        .insert({ documento_id: docId!, processo_id: processoId, conteudo_html: html, versao: 1, gerado_por: user?.id })
        .select("*").single();

      if (insertErr) { console.error("Self-healing failed:", insertErr); return null; }
      if (!doc.conteudo_final) {
        await supabase.from("documentos").update({ conteudo_final: html }).eq("id", docId!);
      }
      return newVersion;
    },
    enabled: !!docId,
  });

  const { data: documento } = useQuery({
    queryKey: ["documento", docId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos").select("tipo, status, workflow_status, dados_estruturados").eq("id", docId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!docId,
  });

  const { data: processo } = useQuery({
    queryKey: ["processo-for-doc", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos").select("numero_processo, orgao, objeto, modalidade").eq("id", processoId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!processoId,
  });

  // Extract signature data from dados_estruturados (NOT from HTML)
  const signatureData = useMemo(() => {
    const dados = (documento?.dados_estruturados as Record<string, any>) ?? {};
    return {
      responsavel_tecnico: dados.responsavel_tecnico as string | undefined,
      fiscal_contrato: dados.fiscal_contrato as string | undefined,
      ordenador_despesa: dados.ordenador_despesa as string | undefined,
    };
  }, [documento?.dados_estruturados]);

  const docCode = useMemo(() => {
    const num = processo?.numero_processo ?? "—";
    const prefix = documento?.tipo ?? "DOC";
    return `${prefix}-${num}`;
  }, [processo, documento?.tipo]);

  const currentHtml = editedHtml ?? version?.conteudo_html ?? "";
  const hasChanges = editedHtml !== null && editedHtml !== version?.conteudo_html;

  const handleSaveVersion = useCallback(async () => {
    if (!version || !editedHtml) return;
    setSaving(true);
    try {
      // Sanitize before saving
      const cleanHtml = sanitizeHtml(editedHtml);

      const { error } = await supabase.from("document_versions").insert({
        documento_id: docId!,
        processo_id: processoId!,
        conteudo_html: cleanHtml,
        versao: version.versao + 1,
        gerado_por: user?.id,
      });
      if (error) throw error;

      await supabase.from("documentos").update({ conteudo_final: cleanHtml }).eq("id", docId!);
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

    const sigHtml = renderSignatureHtml(
      signatureData.responsavel_tecnico,
      signatureData.fiscal_contrato,
      signatureData.ordenador_despesa,
    );

    const generatedAt = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    printWindow.document.write(`<!DOCTYPE html>
<html><head>
<title>${docCode} — ${documento?.tipo ?? "Documento"}</title>
<style>
  @page {
    size: A4;
    margin: 25mm 20mm 30mm 20mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', serif;
    font-size: 12pt;
    color: #1a1a1a;
    line-height: 1.6;
    margin: 0;
    padding: 0;
  }
  /* Header on first page */
  .print-header {
    text-align: center;
    border-bottom: 2px solid #1a1a1a;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .print-header .org { font-size: 10pt; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
  .print-header .title { font-size: 14pt; font-weight: bold; margin: 8px 0 4px; }
  .print-header .proc { font-size: 10pt; margin: 0; }
  .print-header .meta { font-size: 9pt; color: #666; margin-top: 4px; }
  /* Content */
  .print-content { }
  .print-content h1, .print-content h2, .print-content h3 { page-break-after: avoid; }
  .print-content table { page-break-inside: avoid; }
  /* Page break markers */
  div[style*="page-break-before"] {
    border: none !important;
    color: transparent !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  /* Footer */
  .print-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 8pt;
    color: #999;
    border-top: 1px solid #ddd;
    padding-top: 4px;
  }
  @media print {
    .print-footer { position: fixed; bottom: 0mm; }
  }
</style>
</head><body>
  <div class="print-footer">
    ${docCode} • v${version?.versao ?? 1} • ${processo?.orgao ?? ""} • Gerado em ${generatedAt}
  </div>
  <div class="print-header">
    <p class="org">${processo?.orgao ?? ""}</p>
    <p class="title">${getDocumentTypeLabel(documento?.tipo)}</p>
    <p class="proc">Processo nº ${processo?.numero_processo ?? "—"}</p>
    <p class="meta">${docCode} • Versão ${version?.versao ?? 1} • ${generatedAt} • ${user?.email ?? ""}</p>
  </div>
  <div class="print-content">${currentHtml}</div>
  ${sigHtml}
</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  }, [currentHtml, documento, processo, version, docCode, user, signatureData]);

  const handleShare = useCallback(async () => {
    if (!version) return;
    setShareDialogOpen(true);
    setCreatingShare(true);
    try {
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
          .insert({ documento_id: docId!, version_id: version.id, created_by: user?.id })
          .select("token").single();
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
      const { error } = await supabase.from("documentos").update({ workflow_status: newStatus }).eq("id", docId!);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["documento", docId] });
      toast.success(newStatus === "em_aprovacao" ? "Documento enviado para aprovação!" : `Status: ${newStatus}`);
    } catch (e: any) { toast.error("Erro: " + e.message); }
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
            <Printer className="h-3 w-3" /> PDF / Imprimir
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
          {documento?.workflow_status === "aprovado" && (() => {
            const nextMap: Record<string, { type: string, label: string }> = {
              "pca": { type: "dfd", label: "Gerar DFD" },
              "dfd": { type: "etp", label: "Gerar ETP" },
              "etp": { type: "tr", label: "Gerar TR" },
              "tr": { type: "edital", label: "Gerar Edital" }
            };
            const nextDoc = documento?.tipo ? nextMap[documento.tipo] : null;
            if (nextDoc) {
              return (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90 text-white ml-2"
                  onClick={async () => {
                    try {
                      // Navigate directly to create the next document type
                      // But the create flow occurs in SelecionarTipoDocumento or we can do it directly
                      const { data: user } = await supabase.auth.getUser();
                      if (!user.user) throw new Error("Não autenticado");

                      const insertData = {
                        processo_id: processoId,
                        tipo: nextDoc.type,
                        status: "rascunho",
                        workflow_status: "rascunho",
                        gerado_por: user.user.id,
                        parent_doc_id: docId // Store lineage!
                      };

                      const { data: newDoc, error } = await supabase
                        .from("documentos")
                        .insert(insertData)
                        .select("id")
                        .single();

                      if (error) throw error;
                      toast.success(`Sucesso! Iniciando geração do ${nextDoc.type.toUpperCase()}...`);
                      navigate(`/processo/${processoId}/documento/${newDoc.id}`);
                    } catch (err: any) {
                      toast.error("Erro ao iniciar próximo documento: " + err.message);
                    }
                  }}
                >
                  <Sparkles className="h-3 w-3" /> {nextDoc.label}
                </Button>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Metadata bar */}
      <div className="shrink-0 border-b bg-muted/20 px-4 py-2">
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground max-w-3xl mx-auto">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span className="font-semibold text-foreground">{docCode}</span>
          </div>
          <span>Versão: <span className="font-medium text-foreground">v{version.versao}</span></span>
          <span>Gerado em: <span className="font-medium text-foreground">
            {new Date(version.gerado_em).toLocaleString("pt-BR")}
          </span></span>
          <span>Por: <span className="font-medium text-foreground">{user?.email ?? "—"}</span></span>
          {processo?.orgao && <span>Órgão: <span className="font-medium text-foreground">{processo.orgao}</span></span>}
        </div>
      </div>

      {/* Editor + Signatures */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-3xl mx-auto space-y-6">
          <RichTextEditor
            value={currentHtml}
            onChange={setEditedHtml}
            className="min-h-[600px]"
            processoContext={{
              objeto: processo?.objeto,
              orgao: processo?.orgao,
              modalidade: processo?.modalidade,
              numero_processo: processo?.numero_processo,
            }}
            documentType={documento?.tipo ?? "dfd"}
            sectionType="documento_completo"
            dadosEstruturados={documento?.dados_estruturados as Record<string, any>}
            documentoId={docId}
          />

          {/* Signature preview */}
          <Card className="p-6">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-4">
              Bloco de Assinaturas (incluído no PDF)
            </p>
            <SignatureBlock
              responsavelTecnico={signatureData.responsavel_tecnico}
              fiscalContrato={signatureData.fiscal_contrato}
              ordenadorDespesa={signatureData.ordenador_despesa}
            />
          </Card>
        </div>
      </ScrollArea>

      {/* Share dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md overflow-hidden">
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
            <div className="flex justify-center gap-3 pt-4 pb-2">
              <Button variant="outline" className="gap-2 w-full" onClick={() => window.open(shareLink, '_blank')}>
                <ExternalLink className="h-4 w-4" />
                Abrir Link
              </Button>
              <Button className="gap-2 w-full" onClick={() => { navigator.clipboard.writeText(shareLink); toast.success("Link copiado!"); }}>
                <Copy className="h-4 w-4" />
                Copiar Link
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
