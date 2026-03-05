import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { AlertBanner } from "@/components/documento/AlertBanner";
import { SectionSuggestionBanner } from "@/components/documento/SectionSuggestionBanner";
import { DocumentStepSidebar } from "@/components/documento/DocumentStepSidebar";
import { DocumentMetaBar } from "@/components/documento/DocumentMetaBar";
import { DocumentToolsBar } from "@/components/documento/DocumentToolsBar";
import { StepFormRenderer } from "@/components/documento/StepFormRenderer";
import { MelhorarDialog } from "@/components/documento/MelhorarDialog";
import { GerarJustificativaDialog } from "@/components/documento/GerarJustificativaDialog";
import { ValidarObjetoDialog } from "@/components/documento/ValidarObjetoDialog";
import { AiBuilderOverlay } from "@/components/documento/AiBuilderOverlay";
import { NormativasSidebar } from "@/components/documento/NormativasSidebar";
import { SectionActionBar } from "@/components/documento/SectionActionBar";
import { useDocumentAutoSave } from "@/hooks/useDocumentAutoSave";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  calculateDocumentProgress,
  calculateSectionCompletion,
  isSectionUnlocked,
  initializeWorkflow,
  type WorkflowState,
  type FieldDef,
} from "@/lib/document-sections";
import { useDocumentTemplate } from "@/hooks/useDocumentTemplate";
import { renderDocumentTemplate, getProcessoStatusAfterApproval } from "@/lib/document-template-renderer";

interface FieldMeta {
  confianca: string;
  fontes: string[];
  sugestao: string;
}

interface AlertaGlobal {
  titulo: string;
  fonte: string;
  impacto: string;
  url: string | null;
  severidade: string;
}

export default function Documento() {
  const { processoId, docId } = useParams<{ processoId: string; docId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [inheritedKeys, setInheritedKeys] = useState<Set<string>>(new Set());
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [disabledSections, setDisabledSections] = useState<Set<string>>(new Set());
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoPreenchendo, setAutoPreenchendo] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  // CORREÇÃO 1+2: No auto AI builder on open. User must confirm objeto first.
  const [objetoConfirmado, setObjetoConfirmado] = useState(false);

  // AI Builder state
  const [aiBuilderActive, setAiBuilderActive] = useState(false);
  const [aiBuilderPhase, setAiBuilderPhase] = useState(0);
  const [camposMeta, setCamposMeta] = useState<Record<string, FieldMeta>>({});
  const [alertasGlobais, setAlertasGlobais] = useState<AlertaGlobal[]>([]);
  const [sectionActions, setSectionActions] = useState<Record<string, "keep" | "improve" | "edit">>({});
  const [showNormativas, setShowNormativas] = useState(false);
  const [generatingSectionAi, setGeneratingSectionAi] = useState(false);

  // Dialog states
  const [melhorarOpen, setMelhorarOpen] = useState(false);
  const [melhorarField, setMelhorarField] = useState<FieldDef | null>(null);
  const [justificativaOpen, setJustificativaOpen] = useState(false);
  const [validarObjetoOpen, setValidarObjetoOpen] = useState(false);

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

  const { data: approvedTR } = useQuery({
    queryKey: ["approved-tr", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, tipo, aprovado_em")
        .eq("processo_id", processoId!)
        .eq("tipo", "tr")
        .eq("status", "aprovado")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!processoId && documento?.tipo === "edital",
  });

  const { sections, loading: sectionsLoading } = useDocumentTemplate(documento?.tipo);

  // Auto-redirect if document is already approved
  useEffect(() => {
    if (documento?.status === "aprovado" && processoId && docId) {
      navigate(`/processo/${processoId}/documento/${docId}/view`, { replace: true });
    }
  }, [documento?.status, processoId, docId, navigate]);

  // Initialize form + workflow from existing data
  useEffect(() => {
    if (!documento || initialized) return;
    const existing = (documento.dados_estruturados as Record<string, any>) ?? {};
    const merged = { ...existing };
    const keys = new Set<string>();

    if (inherited) {
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

    // Pre-populate from processo data if not already set
    if (processo) {
      const processoMapping: Record<string, string | null> = {
        orgao: processo.orgao,
        numero_processo: processo.numero_processo,
        modalidade: processo.modalidade,
      };
      for (const [field, value] of Object.entries(processoMapping)) {
        if (value && !merged[field]) {
          merged[field] = value;
          keys.add(field);
        }
      }
    }

    const existingWorkflow = (existing as any)?.meta?.workflow as WorkflowState | undefined;
    const wf = initializeWorkflow(sections, existingWorkflow);

    const objetoValue = merged.objeto_contratacao || merged.objeto;
    const hasObjeto = !!objetoValue && typeof objetoValue === "string" && objetoValue.trim().length >= 5;

    if (hasObjeto) {
      setObjetoConfirmado(true);
    }

    sections.forEach((s, i) => {
      if (wf.steps[s.id]?.enabled === false) return;
      if (!hasObjeto && i > 0) {
        wf.steps[s.id].status = "locked";
        return;
      }
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
  }, [documento, inherited, processo, sections, initialized]);

  // Populate processo data even after initialization (handles late-loading processo)
  useEffect(() => {
    if (!initialized || !processo) return;
    const processoMapping: Record<string, string | null> = {
      orgao: processo.orgao,
      numero_processo: processo.numero_processo,
      modalidade: processo.modalidade,
    };
    setFormData((prev) => {
      const updated = { ...prev };
      let changed = false;
      for (const [field, value] of Object.entries(processoMapping)) {
        if (value && !updated[field]) {
          updated[field] = value;
          changed = true;
        }
      }
      return changed ? updated : prev;
    });
    setInheritedKeys((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const [field, value] of Object.entries(processoMapping)) {
        if (value && !next.has(field)) {
          next.add(field);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [initialized, processo]);

  // Persist workflow state
  const dataWithWorkflow = useMemo(() => {
    if (!workflow) return formData;
    return { ...formData, meta: { ...((formData as any)?.meta ?? {}), workflow } };
  }, [formData, workflow]);

  const { saving, lastSaved } = useDocumentAutoSave(docId, dataWithWorkflow);

  const handleFieldChange = useCallback((key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear AI badge when user manually edits
    setAiFilledFields((prev) => {
      if (prev.has(key)) {
        const next = new Set(prev);
        next.delete(key);
        return next;
      }
      return prev;
    });
    setInvalidFields((prev) => {
      const hasValue = typeof value === "string" ? !!value.trim() : !!value;
      if (prev.has(key) && hasValue) {
        const next = new Set(prev);
        next.delete(key);
        return next;
      }
      return prev;
    });
  }, []);

  // CORREÇÃO 2: Confirm objeto and unlock sections
  const handleConfirmarObjeto = useCallback(() => {
    const objetoValue = formData.objeto_contratacao || formData.objeto;
    if (!objetoValue || (typeof objetoValue === "string" && objetoValue.trim().length < 5)) {
      toast.error("Preencha o objeto da contratação antes de confirmar.");
      return;
    }
    setObjetoConfirmado(true);
    // Unlock all sections
    setWorkflow((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, steps: { ...prev.steps } };
      sections.forEach((s, i) => {
        if (i === 0) return; // buscar_objeto already editing
        if (updated.steps[s.id]?.enabled === false) return;
        const { complete } = calculateSectionCompletion(s, formData);
        const unlocked = isSectionUnlocked(i, sections, formData, updated);
        updated.steps[s.id] = {
          ...updated.steps[s.id],
          status: complete && unlocked ? "complete" : unlocked ? "editing" : "locked",
        };
      });
      return updated;
    });
    toast.success("Objeto confirmado! Seções desbloqueadas.");
  }, [formData, sections]);

  // AI Document Builder - explicit user action only (CORREÇÃO 1)
  const handleAiDocumentBuilder = useCallback(async () => {
    const objetoValue = formData.objeto_contratacao || formData.objeto;
    if (!objetoValue || (typeof objetoValue === "string" && objetoValue.length < 10)) {
      toast.error("Preencha o objeto da contratação primeiro.");
      return;
    }
    setAiBuilderActive(true);
    setAiBuilderPhase(0);

    const phaseTimer1 = setTimeout(() => setAiBuilderPhase(1), 1500);
    const phaseTimer2 = setTimeout(() => setAiBuilderPhase(2), 3000);

    try {
      const { data, error } = await supabase.functions.invoke("ai-document-builder", {
        body: {
          objeto: objetoValue,
          doc_type: documento?.tipo ?? "dfd",
          orgao: processo?.orgao ?? "",
          processo_id: processoId,
        },
      });
      if (error) throw error;

      if (data?.campos_preenchidos) {
        const newAiFields = new Set<string>();
        setFormData((prev) => {
          const updated = { ...prev };
          for (const [key, value] of Object.entries(data.campos_preenchidos)) {
            if (value !== null && value !== undefined) {
              // CORREÇÃO 3: Never overwrite objeto_contratacao - that's user's input
              if (key === "objeto_contratacao" || key === "objeto") continue;
              if (!updated[key] || (typeof updated[key] === "string" && !updated[key].trim())) {
                updated[key] = value;
                newAiFields.add(key);
              }
            }
          }
          return updated;
        });
        setAiFilledFields(newAiFields);

        if (data.campos_meta) {
          setCamposMeta(data.campos_meta);
        }
        if (data.alertas_globais) {
          setAlertasGlobais(data.alertas_globais);
          setShowNormativas(data.alertas_globais.length > 0);
        }

        const count = Object.keys(data.campos_preenchidos).filter(k => k !== "objeto_contratacao" && k !== "objeto").length;
        toast.success(`IA preencheu ${count} campos!`, {
          description: "Revise cada seção antes de avançar.",
        });
      }
    } catch (err: any) {
      console.error("Erro no AI Document Builder:", err);
      toast.error("Erro ao preencher com IA. Tente novamente.");
    } finally {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      setAiBuilderPhase(3);
      setTimeout(() => setAiBuilderActive(false), 500);
    }
  }, [formData, documento?.tipo, processo?.orgao, processoId]);

  // Incremental section generation
  const handleGenerateCurrentSection = useCallback(async () => {
    if (!workflow || !formData.objeto_contratacao) return;
    const curSection = sections.find(s => s.id === workflow.current_step);
    if (!curSection) return;
    setGeneratingSectionAi(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-document-builder", {
        body: {
          objeto: formData.objeto_contratacao,
          doc_type: documento?.tipo ?? "dfd",
          orgao: processo?.orgao ?? "",
          processo_id: processoId,
        },
      });
      if (error) throw error;

      if (data?.campos_preenchidos) {
        const sectionFieldKeys = new Set(curSection.fields.map(f => f.key));
        const newAiFields = new Set(aiFilledFields);
        setFormData((prev) => {
          const updated = { ...prev };
          for (const [key, value] of Object.entries(data.campos_preenchidos)) {
            if (sectionFieldKeys.has(key) && value !== null && value !== undefined) {
              // Don't overwrite objeto
              if (key === "objeto_contratacao" || key === "objeto") continue;
              updated[key] = value;
              newAiFields.add(key);
            }
          }
          return updated;
        });
        setAiFilledFields(newAiFields);
        if (data.campos_meta) setCamposMeta(prev => ({ ...prev, ...data.campos_meta }));

        const filled = Object.keys(data.campos_preenchidos).filter(k => sectionFieldKeys.has(k) && k !== "objeto_contratacao").length;
        toast.success(`IA preencheu ${filled} campos desta seção!`);
      }
    } catch (err: any) {
      console.error("Erro ao gerar seção com IA:", err);
      toast.error("Erro ao gerar seção. Tente novamente.");
    } finally {
      setGeneratingSectionAi(false);
    }
  }, [workflow, sections, formData.objeto_contratacao, documento?.tipo, processo?.orgao, processoId, aiFilledFields]);

  // Handle adding suggested sections
  const handleAddSuggestedSection = useCallback((section: { id: string; label: string; reason: string }) => {
    setFormData(prev => ({
      ...prev,
      [section.id]: prev[section.id] ?? "",
      meta: {
        ...(prev.meta ?? {}),
        extra_sections: [...((prev.meta as any)?.extra_sections ?? []), { id: section.id, label: section.label }],
      },
    }));
    toast.success(`Seção "${section.label}" adicionada ao documento.`);
  }, []);

  // Update workflow step statuses when formData changes
  useEffect(() => {
    if (!workflow || !initialized) return;
    const updated = { ...workflow, steps: { ...workflow.steps } };
    let changed = false;

    sections.forEach((s, i) => {
      if (updated.steps[s.id]?.enabled === false) return;
      // CORREÇÃO 2: Keep sections locked if objeto not confirmed
      if (!objetoConfirmado && i > 0) {
        if (updated.steps[s.id]?.status !== "locked") {
          updated.steps[s.id] = { ...updated.steps[s.id], status: "locked" };
          changed = true;
        }
        return;
      }
      const { complete } = calculateSectionCompletion(s, formData);
      const unlocked = isSectionUnlocked(i, sections, formData, updated);
      const newStatus = complete && unlocked ? "complete" : unlocked ? "editing" : "locked";
      if (updated.steps[s.id]?.status !== newStatus) {
        updated.steps[s.id] = { ...updated.steps[s.id], status: newStatus };
        changed = true;
      }
    });

    if (changed) setWorkflow(updated);
  }, [formData, sections, initialized, objetoConfirmado]);

  const handleSelectStep = useCallback((stepId: string) => {
    setInvalidFields(new Set());
    setWorkflow((prev) => (prev ? { ...prev, current_step: stepId } : prev));
  }, []);

  const handleToggleSection = useCallback((sectionId: string) => {
    setDisabledSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleNext = useCallback(async () => {
    if (!workflow) return;
    const activeSects = sections.filter((s) => !s.condition || formData[s.condition.field] === s.condition.value);
    const enabledSections = activeSects.filter((s) => workflow.steps[s.id]?.enabled !== false);
    const currentIdx = enabledSections.findIndex((s) => s.id === workflow.current_step);
    if (currentIdx < 0) return;

    const currentSection = enabledSections[currentIdx];

    // CORREÇÃO 2: If on buscar_objeto, confirm objeto first
    if (currentSection.id === "buscar_objeto" && !objetoConfirmado) {
      handleConfirmarObjeto();
      // Don't advance yet - let user see the unlocked sections and optionally use AI
      return;
    }

    const { complete } = calculateSectionCompletion(currentSection, formData);

    if (currentSection.required && !complete) {
      const missingKeys = currentSection.fields
        .filter((f) => {
          if (f.readOnly) return false;
          if (f.required !== true && !(f.required === undefined && currentSection.required)) return false;
          const val = formData[f.key];
          return !val || (typeof val === "string" && !val.trim());
        })
        .map((f) => f.key);
      setInvalidFields(new Set(missingKeys));
      toast.error("Preencha todos os campos obrigatórios desta etapa antes de avançar.");
      return;
    }

    const nextIdx = currentIdx + 1;
    if (nextIdx >= enabledSections.length) {
      if (!docId || !processoId) {
        toast.error("IDs de documento ou processo não encontrados.");
        return;
      }

      const htmlFinal = renderDocumentTemplate(documento?.tipo, formData, processoData);

      setIsGenerating(true);
      try {
        const { data: result, error } = await supabase.functions.invoke("orchestrate_document", {
          body: {
            doc_id: docId,
            processo_id: processoId,
            doc_type: documento?.tipo ?? "custom",
            form_data: formData,
            html_final: htmlFinal,
            generate_with_ai: true,
            disabled_sections: Array.from(disabledSections),
          },
        });

        if (error) throw error;

        const { data: docAtualizado } = await supabase
          .from("documentos")
          .select("conteudo_final, score_conformidade, section_memories")
          .eq("id", docId!)
          .maybeSingle();

        queryClient.invalidateQueries({ queryKey: ["documento", docId] });
        queryClient.invalidateQueries({ queryKey: ["processo", processoId] });
        queryClient.invalidateQueries({ queryKey: ["pipeline", processoId] });

        toast.success(`${documento?.tipo ?? "Documento"} finalizado com IA!`);
        navigate(`/processo/${processoId}/documento/${docId}/view`);
      } catch (err: any) {
        console.error("Erro ao finalizar documento:", err);
        toast.error("Erro ao finalizar documento. Tente novamente.");
      } finally {
        setIsGenerating(false);
      }
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
  }, [workflow, sections, formData, docId, processoId, queryClient, navigate, objetoConfirmado, handleConfirmarObjeto]);

  const handlePrevious = useCallback(() => {
    if (!workflow) return;
    setInvalidFields(new Set());
    const activeSects = sections.filter((s) => !s.condition || formData[s.condition.field] === s.condition.value);
    const enabledSections = activeSects.filter((s) => workflow.steps[s.id]?.enabled !== false);
    const currentIdx = enabledSections.findIndex((s) => s.id === workflow.current_step);
    if (currentIdx <= 0) return;
    const prevSection = enabledSections[currentIdx - 1];
    handleSelectStep(prevSection.id);
  }, [workflow, sections, handleSelectStep]);

  const handleMelhorar = useCallback((field: FieldDef) => {
    setMelhorarField(field);
    setMelhorarOpen(true);
  }, []);

  const handleMelhorarApply = useCallback(
    (improved: string) => {
      if (melhorarField) {
        setFormData((prev) => ({ ...prev, [melhorarField.key]: improved }));
      }
    },
    [melhorarField]
  );

  const handleJustificativaApply = useCallback((text: string) => {
    setFormData((prev) => ({ ...prev, justificativa_contratacao: text }));
  }, []);

  // CORREÇÃO 5: Handle section action (keep/improve/edit)
  const handleSectionAction = useCallback((action: "keep" | "improve" | "edit") => {
    if (!currentSection) return;
    setSectionActions(prev => ({ ...prev, [currentSection.id]: action }));
    if (action === "keep") {
      // Remove AI badges for this section's fields - user accepted
      toast.success("Conteúdo mantido!");
    } else if (action === "edit") {
      // Remove AI badges - user wants to edit manually
      const sectionFieldKeys = new Set(currentSection.fields.map(f => f.key));
      setAiFilledFields(prev => {
        const next = new Set(prev);
        sectionFieldKeys.forEach(k => next.delete(k));
        return next;
      });
    } else if (action === "improve") {
      const textareaField = currentSection.fields.find(f => f.type === "textarea" && !f.readOnly);
      if (textareaField) handleMelhorar(textareaField);
    }
  }, [handleMelhorar]);

  const progress = workflow ? calculateDocumentProgress(sections, formData, workflow) : 0;
  const currentSection = workflow ? sections.find((s) => s.id === workflow.current_step) : null;
  const activeSections = sections.filter((s) => {
    if (s.condition) {
      return formData[s.condition.field] === s.condition.value;
    }
    return true;
  });
  const enabledSections = workflow
    ? activeSections.filter((s) => workflow.steps[s.id]?.enabled !== false && !disabledSections.has(s.id))
    : activeSections.filter((s) => !disabledSections.has(s.id));
  const currentEnabledIdx = currentSection
    ? enabledSections.findIndex((s) => s.id === currentSection.id)
    : 0;
  const isLastStep = currentEnabledIdx >= enabledSections.length - 1;
  const currentCompletion = currentSection
    ? calculateSectionCompletion(currentSection, formData)
    : { filled: 0, total: 0, complete: false };
  const canAdvance = currentSection
    ? !currentSection.required || currentCompletion.complete
    : false;

  const isBuscarObjetoStep = currentSection?.id === "buscar_objeto";

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
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* META BAR */}
      <DocumentMetaBar
        tipo={documento.tipo}
        numero={processo?.numero_processo ?? null}
        status={documento.status}
        saving={saving}
        lastSaved={lastSaved}
        processoId={processoId!}
        docId={docId}
        userEmail={user?.email ?? undefined}
      />

      {/* MAIN 3-COLUMN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Pipeline Sidebar */}
        <DocumentStepSidebar
          sections={activeSections}
          workflow={workflow}
          formData={formData}
          documentTitle={documento.tipo ?? "Documento"}
          documentNumber={processo?.numero_processo ?? undefined}
          disabledSections={disabledSections}
          onSelectStep={handleSelectStep}
          onToggleSection={handleToggleSection}
        />

        {/* CENTER — Workspace */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* AI Builder Overlay */}
          <AiBuilderOverlay isActive={aiBuilderActive} currentPhase={aiBuilderPhase} />

          <ScrollArea className="flex-1">
            <div className="p-6 max-w-2xl mx-auto space-y-4">
              {/* Realtime alert banner */}
              {documento?.tipo && (
                <AlertBanner
                  docType={documento.tipo}
                  onViewImpact={(alert) => {
                    setShowNormativas(true);
                    toast.info(`Alerta: ${alert.title}`, { description: `Fonte: ${alert.source}` });
                  }}
                />
              )}

              {/* CORREÇÃO 6: Section suggestions after confirming objeto */}
              {objetoConfirmado && formData.objeto_contratacao && isBuscarObjetoStep && (
                <SectionSuggestionBanner
                  objeto={formData.objeto_contratacao}
                  onAddSection={handleAddSuggestedSection}
                />
              )}

              {/* Edital banner - TR approved */}
              {documento?.tipo === "edital" && approvedTR && currentEnabledIdx === 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <p className="text-xs text-foreground">
                    Este edital será gerado com base no TR aprovado em{" "}
                    <span className="font-medium">
                      {approvedTR.aprovado_em
                        ? new Date(approvedTR.aprovado_em).toLocaleDateString("pt-BR")
                        : "data não registrada"}
                    </span>
                    . Os dados serão importados automaticamente.
                  </p>
                </div>
              )}

              {/* Section header */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                  Seção {currentEnabledIdx + 1} de {enabledSections.length}
                </p>
                <h2 className="text-lg font-semibold">{currentSection?.label}</h2>
              </div>

              {/* CORREÇÃO 5: Section action bar only when AI filled content */}
              {currentSection && (
                <SectionActionBar
                  currentAction={sectionActions[currentSection.id] ?? null}
                  onAction={handleSectionAction}
                  hasAiContent={currentSection.fields.some(f => aiFilledFields.has(f.key))}
                />
              )}

              {currentSection && (
                <StepFormRenderer
                  section={currentSection}
                  formData={formData}
                  processoData={processoData}
                  inheritedKeys={inheritedKeys}
                  invalidFields={invalidFields}
                  aiFilledFields={aiFilledFields}
                  autoPreenchendo={autoPreenchendo}
                  camposMeta={camposMeta}
                  onChange={handleFieldChange}
                  onMelhorar={handleMelhorar}
                  onGerarJustificativa={() => setJustificativaOpen(true)}
                  onValidarObjeto={() => setValidarObjetoOpen(true)}
                  documentType={documento.tipo ?? "etp"}
                />
              )}

              {/* CORREÇÃO 2: After confirming objeto on buscar_objeto step, show "Preencher com IA" button */}
              {isBuscarObjetoStep && objetoConfirmado && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Objeto confirmado ✓</p>
                    <p className="text-xs text-muted-foreground">
                      Você pode preencher as seções manualmente ou deixar a IA sugerir o conteúdo.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleAiDocumentBuilder}
                    disabled={aiBuilderActive}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Preencher documento com IA
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* FOOTER */}
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
              {/* Gerar seção com IA button - only when objeto confirmed and not on buscar_objeto */}
              {currentSection && !isBuscarObjetoStep && objetoConfirmado && !currentCompletion.complete && formData.objeto_contratacao && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                  onClick={handleGenerateCurrentSection}
                  disabled={generatingSectionAi}
                >
                  {generatingSectionAi ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Gerando...</>
                  ) : (
                    <><Sparkles className="h-3 w-3" /> Gerar seção com IA</>
                  )}
                </Button>
              )}
              {currentEnabledIdx > 0 && (
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handlePrevious}>
                  <ArrowLeft className="h-3 w-3" /> Anterior
                </Button>
              )}
              <Button
                size="sm"
                className="text-xs gap-1"
                onClick={handleNext}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Gerando com IA...
                  </>
                ) : (
                  <>
                    {isBuscarObjetoStep && !objetoConfirmado ? "Confirmar Objeto" : isLastStep ? "Finalizar" : "Próximo"} <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT — Normativas Sidebar or Tools Bar */}
        {showNormativas && alertasGlobais.length > 0 ? (
          <NormativasSidebar
            alertas={alertasGlobais}
            camposMeta={camposMeta}
            currentSectionFields={currentSection?.fields.map(f => f.key)}
          />
        ) : (
          <DocumentToolsBar
            onMelhorarClick={() => {
              if (currentSection) {
                const textareaField = currentSection.fields.find((f) => f.type === "textarea" && !f.readOnly);
                if (textareaField) handleMelhorar(textareaField);
              }
            }}
          />
        )}
      </div>

      {/* DIALOGS */}
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

      <GerarJustificativaDialog
        open={justificativaOpen}
        onOpenChange={setJustificativaOpen}
        currentText={formData.justificativa_contratacao ?? ""}
        objeto={formData.objeto_contratacao ?? processoData?.objeto ?? ""}
        contexto={{
          problema_publico: formData.problema_publico,
          area_demandante: formData.area_demandante,
          impacto_esperado: formData.impacto_esperado,
          fundamento_legal: formData.fundamento_legal,
          alinhamento_estrategico: formData.alinhamento_estrategico,
        }}
        orgao={processoData?.orgao ?? ""}
        onApply={handleJustificativaApply}
      />

      <ValidarObjetoDialog
        open={validarObjetoOpen}
        onOpenChange={setValidarObjetoOpen}
        objeto={formData.objeto_contratacao ?? ""}
        orgao={processoData?.orgao ?? ""}
      />
    </div>
  );
}
