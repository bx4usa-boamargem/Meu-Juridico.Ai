import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { CustomDocumentBuilder } from "@/components/documento/CustomDocumentBuilder";

interface DocTemplate {
  id: string;
  doc_type: string;
  title: string;
  description: string;
  icon: string;
  sections_plan: any[];
  is_active: boolean;
}

export default function SelecionarTipoDocumento() {
  const { processoId } = useParams<{ processoId: string }>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["document_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_templates" as any)
        .select("*")
        .eq("is_active", true)
        .order("doc_type");
      if (error) throw error;
      return (data as any[]) as DocTemplate[];
    },
  });

  const { data: existingDocs } = useQuery({
    queryKey: ["existing-docs", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("tipo, status, updated_at")
        .eq("processo_id", processoId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!processoId,
  });

  const handleCreate = async () => {
    if (!selected || !processoId) return;
    setCreating(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Não autenticado");

      // For 'custom' type, navigate to custom builder
      if (selected === "custom") {
        navigate(`/processo/${processoId}/novo-documento/custom`);
        return;
      }

      // Create document
      const { data: doc, error } = await supabase
        .from("documentos")
        .insert({
          processo_id: processoId,
          tipo: selected,
          status: "rascunho",
          workflow_status: "rascunho",
          gerado_por: user.user.id,
        })
        .select("id")
        .single();

      if (error) throw error;
      toast.success("Documento criado!");
      navigate(`/processo/${processoId}/documento/${doc.id}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar documento");
    } finally {
      setCreating(false);
    }
  };

  // Sort templates in specific order
  const sortOrder = ["DFD", "ETP", "TR", "projeto_basico", "mapa_risco", "edital", "custom"];
  const sorted = templates?.slice().sort((a, b) => {
    const ai = sortOrder.indexOf(a.doc_type);
    const bi = sortOrder.indexOf(b.doc_type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const getExistingDoc = (docType: string) =>
    existingDocs?.find((d) => d.tipo === docType);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Selecionar tipo de documento</h1>
          <p className="text-sm text-muted-foreground">Escolha o tipo de documento que deseja criar</p>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {sorted?.map((tmpl) => {
            const existing = getExistingDoc(tmpl.doc_type);
            const isSelected = selected === tmpl.doc_type;

            return (
              <button
                key={tmpl.doc_type}
                onClick={() => setSelected(tmpl.doc_type)}
                className={`
                  relative text-left rounded-xl border-2 p-5 transition-all duration-200 cursor-pointer
                  hover:shadow-[0_4px_12px_rgba(27,79,216,0.15)] hover:border-primary
                  ${isSelected
                    ? "bg-[hsl(217,100%,97%)] border-primary shadow-[0_4px_12px_rgba(27,79,216,0.15)]"
                    : "bg-card border-border"
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <span className="text-2xl mb-3 block">{tmpl.icon}</span>
                <h3 className="text-sm font-semibold mb-1">{tmpl.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{tmpl.description}</p>
                <Badge variant="secondary" className="mt-3 text-[10px]">
                  {tmpl.sections_plan?.length || 0} seções
                </Badge>

                {existing && (
                  <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-600" />
                    <span>{existing.status === "aprovado" ? "Aprovado" : "Em andamento"}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Existing docs info */}
      {existingDocs && existingDocs.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Documentos existentes neste processo:</p>
          <div className="flex flex-wrap gap-2">
            {existingDocs.map((doc, i) => (
              <Badge key={i} variant={doc.status === "aprovado" ? "default" : "secondary"} className="text-[10px]">
                {doc.tipo} ({doc.status ?? "rascunho"})
              </Badge>
            ))}
          </div>
          {existingDocs.some((d) => d.status === "aprovado") && selected && (
            <p className="text-[10px] text-muted-foreground mt-2">
              ✅ Dados dos documentos aprovados serão importados automaticamente
            </p>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex justify-end">
        <Button onClick={handleCreate} disabled={!selected || creating} className="gap-2">
          {creating ? "Criando..." : "Criar documento"}
        </Button>
      </div>
    </div>
  );
}
