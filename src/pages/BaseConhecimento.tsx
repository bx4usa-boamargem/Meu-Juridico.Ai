import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Trash2, Loader2, Cpu } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface KbDoc {
  id: string;
  title: string;
  doc_type: string;
  file_path: string;
  is_active: boolean;
  file_size_bytes: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const DOC_TYPES = [
  { value: "normative", label: "Normativo" },
  { value: "template_dfd", label: "Template DFD" },
  { value: "template_etp", label: "Template ETP" },
  { value: "template_tr", label: "Template TR" },
  { value: "template_edital", label: "Template Edital" },
  { value: "other", label: "Outro" },
];

export default function BaseConhecimento() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<KbDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("normative");
  const [file, setFile] = useState<File | null>(null);

  const loadOrgAndDocs = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get or create org_settings
    const { data: orgs } = await supabase
      .from("org_settings")
      .select("org_id")
      .limit(1);

    let oid = (orgs as any)?.[0]?.org_id;

    if (!oid) {
      const { data: newOrg, error } = await supabase
        .from("org_settings")
        .insert({ nome: "Meu Órgão", created_by: user.id })
        .select("org_id")
        .single();
      if (error) {
        toast.error("Erro ao criar organização");
        setLoading(false);
        return;
      }
      oid = (newOrg as any)?.org_id;
    }

    setOrgId(oid);

    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("org_id", oid)
      .order("created_at", { ascending: false });

    if (!error) setDocs((data as any) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadOrgAndDocs();
  }, [loadOrgAndDocs]);

  async function handleUpload() {
    if (!file || !title || !orgId || !user) return;
    setUploading(true);

    try {
      const filePath = `${orgId}/${Date.now()}_${file.name}`;
      const { error: storageErr } = await supabase.storage
        .from("knowledge_files")
        .upload(filePath, file);

      if (storageErr) throw storageErr;

      const { error: insertErr } = await supabase.from("knowledge_base").insert({
        org_id: orgId,
        title,
        doc_type: docType,
        file_path: filePath,
        file_size_bytes: file.size,
        created_by: user.id,
      } as any);

      if (insertErr) throw insertErr;

      toast.success("Documento adicionado!");
      setTitle("");
      setFile(null);
      setDialogOpen(false);
      loadOrgAndDocs();
    } catch (err: any) {
      toast.error("Erro: " + (err?.message ?? "desconhecido"));
    } finally {
      setUploading(false);
    }
  }

  async function handleIngest(docId: string) {
    setIngesting(docId);
    try {
      const { error } = await supabase.functions.invoke("ingest_knowledge", {
        body: { knowledge_doc_id: docId },
      });
      if (error) throw error;
      toast.success("Documento vetorizado com sucesso!");
      loadOrgAndDocs();
    } catch (err: any) {
      toast.error("Erro na vetorização: " + (err?.message ?? "desconhecido"));
    } finally {
      setIngesting(null);
    }
  }

  async function handleDelete(docId: string, filePath: string) {
    if (!confirm("Deseja excluir este documento?")) return;
    await supabase.storage.from("knowledge_files").remove([filePath]);
    await supabase.from("knowledge_base").delete().eq("id", docId);
    toast.success("Documento removido");
    loadOrgAndDocs();
  }

  function formatBytes(bytes: number | null) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Base de Conhecimento</h1>
          <p className="text-sm text-muted-foreground">
            Normativos, templates e documentos do seu órgão para alimentar a IA.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" /> Adicionar Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar à Base de Conhecimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Decreto Municipal 1234/2025"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Arquivo (PDF ou TXT)</Label>
                <Input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={uploading || !file || !title}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {uploading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhum documento na base de conhecimento.</p>
              <p className="text-xs mt-1">Adicione normativos e templates para potencializar a IA.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => {
                  const isIngested = !!(doc.metadata as any)?.ingested_at;
                  const chunksCount = (doc.metadata as any)?.chunks_count ?? 0;
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {DOC_TYPES.find((t) => t.value === doc.doc_type)?.label ?? doc.doc_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatBytes(doc.file_size_bytes)}
                      </TableCell>
                      <TableCell>
                        {isIngested ? (
                          <Badge className="bg-success/15 text-success border-success/30 text-[10px]">
                            Vetorizado ({chunksCount} chunks)
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleIngest(doc.id)}
                          disabled={ingesting === doc.id}
                          title="Vetorizar"
                        >
                          {ingesting === doc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Cpu className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(doc.id, doc.file_path)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
