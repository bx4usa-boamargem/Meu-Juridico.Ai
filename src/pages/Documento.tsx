import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";
import { DocumentStepSidebar } from "@/components/documento/DocumentStepSidebar";
import { StepFormRenderer } from "@/components/documento/StepFormRenderer";
import { MelhorarDialog } from "@/components/documento/MelhorarDialog";
import { useDocumentAutoSave } from "@/hooks/useDocumentAutoSave";
import { toast } from "sonner";
import {
  getSectionsForType,
  calculateDocumentProgress,
  calculateSectionCompletion,
  isSectionUnlocked,
  initializeWorkflow,
  type WorkflowState,
  type FieldDef,
} from "@/lib/document-sections";

export default function Documento() {
  const { processoId, docId } = useParams<{ processoId: string; docId: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [inheritedKeys, setInheritedKeys] = useState<Set<string>>(new Set());
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [initialized, setInitialized] = useState(false);

  // AI Melhorar state
  const [melhorarOpen, setMelhorarOpen] = useState(false);
  const [melhorarField, setMelhorarField] = useState<FieldDef | null>(null);

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

  const sections = useMemo(() => getSectionsForType(documento?.tipo), [documento?.tipo]);

  // Initialize form + workflow from existing data
  useEffect(() => {
    if (!documento || initialized) return;
    const existing = (documento.dados_estruturados as Record<string, any>) ?? {};
    const merged = { ...existing };
    const keys = new Set<string>();

    if (inherited) {
      // inherited is the full resolver_heranca response with nested structure
      const herancaData = (inherited as any)?.heranca ?? inherited;
      if (herancaData && typeof herancaData === "object") {
        for (const [k, v] of Object.entries(herancaData)) {
          if (v !== null && v !== undefined && v !== "" && !merged[k]) {
            merged[k] = v;
            keys.add(k);
          }
        }
      }
    }

    // Initialize workflow from persisted state or fresh
    const existingWorkflow = (existing as any)?.meta?.workflow as WorkflowState | undefined;
    const wf = initializeWorkflow(sections, existingWorkflow);

    // Re-evaluate step statuses based on actual data
    sections.forEach((s, i) => {
      if (wf.steps[s.id]?.enabled === false) return;
      const { complete } = calculateSectionCompletion(s, merged);
      const unlocked = isSectionUnlocked(i, sections, merged, wf);
      if (complete && unlocked) {
        wf.steps[s.id].status = "complete";
      } else if (unlocked) {
        wf.steps[s.id].status = "editing";
      } else {
        wf.steps[s.id].status = "locked";
      }
    });

    setFormData(merged);
    setInheritedKeys(keys);
    setWorkflow(wf);
    setInitialized(true);
  }, [documento, inherited, sections, initialized]);

  // Persist workflow state into formData.meta.workflow whenever workflow changes
  const dataWithWorkflow = useMemo(() => {
    if (!workflow) return formData;
    return { ...formData, meta: { ...((formData as any)?.meta ?? {}), workflow } };
  }, [formData, workflow]);

  const { saving, lastSaved } = useDocumentAutoSave(docId, dataWithWorkflow);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Update workflow step statuses when formData changes
  useEffect(() => {
    if (!workflow || !initialized) return;
    const updated = { ...workflow, steps: { ...workflow.steps } };
    let changed = false;

    sections.forEach((s, i) => {
      if (updated.steps[s.id]?.enabled === false) return;
      const { complete } = calculateSectionCompletion(s, formData);
      const unlocked = isSectionUnlocked(i, sections, formData, updated);
      const newStatus = complete && unlocked ? "complete" : unlocked ? "editing" : "locked";
      if (updated.steps[s.id]?.status !== newStatus) {
        updated.steps[s.id] = { ...updated.steps[s.id], status: newStatus };
        changed = true;
      }
    });

    if (changed) setWorkflow(updated);
  }, [formData, sections, initialized]);

  const handleSelectStep = useCallback((stepId: string) => {
    setWorkflow((prev) => prev ? { ...prev, current_step: stepId } : prev);
  }, []);

  const handleToggleStep = useCallback((stepId: string, enabled: boolean) => {
    setWorkflow((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: {
          ...prev.steps,
          [stepId]: { ...prev.steps[stepId], enabled },
        },
      };
    });
  }, []);

  const handleNext = useCallback(() => {
    if (!workflow) return;
    const enabledSections = sections.filter((s) => workflow.steps[s.id]?.enabled !== false);
    const currentIdx = enabledSections.findIndex((s) => s.id === workflow.current_step);
    if (currentIdx < 0) return;

    const currentSection = enabledSections[currentIdx];
    const { complete } = calculateSectionCompletion(currentSection, formData);

    if (currentSection.required && !complete) {
      toast.error("Preencha todos os campos obrigatórios desta etapa antes de avançar.");
      return;
    }

    // Mark current as complete and advance
    const nextIdx = currentIdx + 1;
    if (nextIdx >= enabledSections.length) {
      toast.success("Documento completo!");
      return;
    }

    const nextSection = enabledSections[nextIdx];
    setWorkflow((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        current_step: nextSection.id,
        steps: {
          ...prev.steps,
          [currentSection.id]: { ...prev.steps[currentSection.id], status: "complete" },
          [nextSection.id]: { ...prev.steps[nextSection.id], status: "editing" },
        },
      };
    });
  }, [workflow, sections, formData]);

  const handleMelhorar = useCallback((field: FieldDef) => {
    setMelhorarField(field);
    setMelhorarOpen(true);
  }, []);

  const handleMelhorarApply = useCallback((improved: string) => {
    if (melhorarField) {
      setFormData((prev) => ({ ...prev, [melhorarField.key]: improved }));
    }
  }, [melhorarField]);

  const progress = workflow ? calculateDocumentProgress(sections, formData, workflow) : 0;
  const currentSection = workflow ? sections.find((s) => s.id === workflow.current_step) : null;
  const enabledSections = workflow
    ? sections.filter((s) => workflow.steps[s.id]?.enabled !== false)
    : sections;
  const currentEnabledIdx = currentSection
    ? enabledSections.findIndex((s) => s.id === currentSection.id)
    : 0;
  const isLastStep = currentEnabledIdx >= enabledSections.length - 1;
  const currentCompletion = currentSection
    ? calculateSectionCompletion(currentSection, formData)
    : { filled: 0, total: 0, complete: false };

  const processoData = processo
    ? {
        numero_processo: processo.numero_processo,
        orgao: processo.orgao,
        objeto: processo.objeto,
        modalidade: processo.modalidade,
      }
    : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!documento || !workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
        <p className="text-sm text-muted-foreground">Documento não encontrado.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100svh-3rem)] flex flex-col">
      {/* TOP DOCUMENT BAR */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => navigate(`/processo/${processoId}`)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-sm font-semibold">{documento.tipo ?? "Documento"}</span>
          {processo?.numero_processo && (
            <span className="text-xs text-muted-foreground">• {processo.numero_processo}</span>
          )}
          <Badge variant="secondary" className="text-[10px]">
            v{documento.versao ?? 1}
          </Badge>
          <Badge
            variant={documento.status === "aprovado" ? "default" : "secondary"}
            className="text-[10px]"
          >
            {documento.status ?? "rascunho"}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Salvando...
              </>
            ) : lastSaved ? (
              <>
                <Check className="h-3 w-3 text-success" /> Salvo automaticamente
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">{progress}%</span>
            <Progress value={progress} className="w-24 h-1.5" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => navigate(`/processo/${processoId}`)}
          >
            <X className="h-3 w-3" /> Sair
          </Button>
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Step Sidebar */}
        <DocumentStepSidebar
          sections={sections}
          workflow={workflow}
          formData={formData}
          onSelectStep={handleSelectStep}
          onToggleStep={handleToggleStep}
        />

        {/* CENTER — Form Engine */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-2xl mx-auto">
              {/* Section header */}
              <div className="mb-6">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                  Seção {currentEnabledIdx + 1} de {enabledSections.length}
                </p>
                <h2 className="text-lg font-semibold">{currentSection?.label}</h2>
              </div>

              {currentSection && (
                <StepFormRenderer
                  section={currentSection}
                  formData={formData}
                  processoData={processoData}
                  inheritedKeys={inheritedKeys}
                  onChange={handleFieldChange}
                  onMelhorar={handleMelhorar}
                />
              )}
            </div>
          </ScrollArea>

          {/* BOTTOM NAV BAR */}
          <div className="border-t px-6 py-3 flex items-center justify-between bg-background shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-xs text-muted-foreground">Documento em edição</span>
              {currentSection && currentCompletion.total > 0 && (
                <span className="text-[10px] text-muted-foreground ml-2">
                  ({currentCompletion.filled}/{currentCompletion.total} campos preenchidos)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentEnabledIdx > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => {
                    const prevSection = enabledSections[currentEnabledIdx - 1];
                    handleSelectStep(prevSection.id);
                  }}
                >
                  <ArrowLeft className="h-3 w-3" /> Anterior
                </Button>
              )}
              <Button
                size="sm"
                className="text-xs gap-1"
                onClick={handleNext}
                disabled={isLastStep && currentCompletion.complete}
              >
                {isLastStep ? "Finalizar" : "Próximo"} <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Melhorar Dialog */}
      {melhorarField && (
        <MelhorarDialog
          open={melhorarOpen}
          onOpenChange={setMelhorarOpen}
          fieldLabel={melhorarField.label}
          fieldValue={formData[melhorarField.key] ?? ""}
          documentType={documento.tipo ?? "Documento"}
          sectionLabel={currentSection?.label ?? ""}
          dadosEstruturados={formData}
          processoContext={processoData}
          onApply={handleMelhorarApply}
        />
      )}
    </div>
  );
}
