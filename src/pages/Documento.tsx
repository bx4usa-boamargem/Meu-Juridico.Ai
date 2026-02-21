import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, ArrowLeft, Check, Circle, Lock, Link2, Save, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/documento/SectionCard";
import { InheritedDataPanel } from "@/components/documento/InheritedDataPanel";
import { useDocumentAutoSave } from "@/hooks/useDocumentAutoSave";
import {
  getSectionsForType,
  calculateDocumentProgress,
  calculateSectionCompletion,
  isSectionUnlocked,
} from "@/lib/document-sections";

export default function Documento() {
  const { processoId, docId } = useParams<{ processoId: string; docId: string }>();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [inheritedKeys, setInheritedKeys] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});

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

  const { data: processo } = useQuery({
    queryKey: ["processo-for-doc", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos")
        .select("*")
        .eq("id", processoId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!processoId,
  });

  // Preload inherited data
  const { data: inherited } = useQuery({
    queryKey: ["heranca-preload", processoId, documento?.tipo],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("resolver_heranca", {
        p_processo_id: processoId!,
        p_tipo_documento: documento!.tipo!,
        p_parent_doc_id: documento?.parent_doc_id ?? undefined,
      });
      if (error) throw error;
      return data as Record<string, any> | null;
    },
    enabled: !!processoId && !!documento?.tipo,
  });

  const sections = getSectionsForType(documento?.tipo);

  // Initialize form with existing data + inherited
  useEffect(() => {
    if (!documento) return;
    const existing = (documento.dados_estruturados as Record<string, any>) ?? {};
    const merged = { ...existing };
    const keys = new Set<string>();

    if (inherited) {
      for (const [k, v] of Object.entries(inherited)) {
        if (v !== null && v !== undefined && v !== "" && !merged[k]) {
          merged[k] = v;
          keys.add(k);
        }
      }
    }

    setFormData(merged);
    setInheritedKeys(keys);
    if (!activeSection && sections.length > 0) {
      setActiveSection(sections[0].id);
    }
  }, [documento, inherited, sections.length]);

  const { saving, lastSaved } = useDocumentAutoSave(docId, formData);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleApplyInherited = useCallback((key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setInheritedKeys((prev) => new Set(prev).add(key));
  }, []);

  // Ensure refs exist for each section
  sections.forEach((s) => {
    if (!sectionRefs.current[s.id]) {
      sectionRefs.current[s.id] = { current: null } as React.RefObject<HTMLDivElement>;
    }
  });

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    sectionRefs.current[sectionId]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const progress = calculateDocumentProgress(sections, formData);
  const processoData = processo ? {
    numero_processo: processo.numero_processo,
    orgao: processo.orgao,
    objeto: processo.objeto,
    modalidade: processo.modalidade,
  } : undefined;

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
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100svh-3rem)] flex flex-col">
      {/* Top Document Bar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate(`/processo/${processoId}`)}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            {saving ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</>
            ) : lastSaved ? (
              <><Check className="h-3 w-3 text-green-600" /> Salvo automaticamente</>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">{progress}%</span>
            <Progress value={progress} className="w-20 h-1.5" />
          </div>
        </div>
      </div>

      {/* Three-column workspace */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* LEFT — Section Navigator */}
        <ResizablePanel defaultSize={18} minSize={14} maxSize={25}>
          <ScrollArea className="h-full">
            <div className="p-3">
              <p className="text-[10px] font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Seções do Documento
              </p>
              <div className="space-y-1">
                {sections.map((section, i) => {
                  const unlocked = isSectionUnlocked(i, sections, formData);
                  const { filled, total, complete } = calculateSectionCompletion(section, formData);
                  const isActive_ = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => unlocked && scrollToSection(section.id)}
                      disabled={!unlocked}
                      className={`flex items-center gap-2 w-full rounded-md px-2 py-2 text-xs text-left transition-colors ${
                        isActive_
                          ? "bg-primary/10 text-primary font-medium"
                          : unlocked
                          ? "hover:bg-muted text-foreground"
                          : "text-muted-foreground/50 cursor-not-allowed"
                      }`}
                    >
                      {!unlocked ? (
                        <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                      ) : complete ? (
                        <Check className="h-3 w-3 shrink-0 text-green-600" />
                      ) : (
                        <Circle className="h-3 w-3 shrink-0 text-yellow-500" />
                      )}
                      <span className="truncate flex-1">{section.label}</span>
                      <span className="text-[9px] text-muted-foreground shrink-0">
                        {filled}/{total}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* CENTER — Structured Form Engine */}
        <ResizablePanel defaultSize={52} minSize={35}>
          <ScrollArea className="h-full">
            <div className="p-6 max-w-2xl mx-auto space-y-3">
              {sections.map((section, i) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  data={formData}
                  processoData={processoData}
                  inheritedKeys={inheritedKeys}
                  onChange={handleFieldChange}
                  isActive={activeSection === section.id}
                  isUnlocked={isSectionUnlocked(i, sections, formData)}
                  onActivate={() => setActiveSection(section.id)}
                  sectionRef={sectionRefs.current[section.id]}
                />
              ))}
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT — Inherited Data + Metadata */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <div className="h-full border-l bg-muted/10">
            <Tabs defaultValue="herdados" className="h-full flex flex-col">
              <TabsList className="w-full rounded-none border-b bg-transparent justify-start px-2 shrink-0">
                <TabsTrigger value="herdados" className="text-xs gap-1">
                  <Link2 className="h-3 w-3" /> Dados Herdados
                </TabsTrigger>
                <TabsTrigger value="metadata" className="text-xs gap-1">
                  <FileText className="h-3 w-3" /> Metadata
                </TabsTrigger>
              </TabsList>

              <TabsContent value="herdados" className="flex-1 overflow-auto mt-0">
                <InheritedDataPanel
                  processoId={processoId!}
                  tipoDocumento={documento.tipo ?? ""}
                  parentDocId={documento.parent_doc_id}
                  onApply={handleApplyInherited}
                />
              </TabsContent>

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
