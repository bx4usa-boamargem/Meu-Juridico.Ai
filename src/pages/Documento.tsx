import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DocumentStepSidebar } from "@/components/documento/DocumentStepSidebar";
import { DocumentMetaBar } from "@/components/documento/DocumentMetaBar";
import { DocumentToolsBar } from "@/components/documento/DocumentToolsBar";
import { StepFormRenderer } from "@/components/documento/StepFormRenderer";
import { MelhorarDialog } from "@/components/documento/MelhorarDialog";
import { GerarJustificativaDialog } from "@/components/documento/GerarJustificativaDialog";
import { ValidarObjetoDialog } from "@/components/documento/ValidarObjetoDialog";
import { useDocumentAutoSave } from "@/hooks/useDocumentAutoSave";
import { useAuth } from "@/hooks/useAuth";
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
import { renderDocumentTemplate, getProcessoStatusAfterApproval } from "@/lib/document-template-renderer";

export default function Documento() {
  const { processoId, docId } = useParams<{ processoId: string; docId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [inheritedKeys, setInheritedKeys] = useState<Set<string>>(new Set());
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [initialized, setInitialized] = useState(false);

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

  // Check for approved TR when editing Edital
  const { data: approvedTR } = useQuery({
    queryKey: ["approved-tr", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, tipo, aprovado_em")
        .eq("processo_id", processoId!)
        .eq("tipo", "TR")
        .eq("status", "aprovado")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!processoId && documento?.tipo === "edital",
  });

  const sections = useMemo(() => getSectionsForType(documento?.tipo), [documento?.tipo]);

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

    const existingWorkflow = (existing as any)?.meta?.workflow as WorkflowState | undefined;
    const wf = initializeWorkflow(sections, existingWorkflow);

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

  // Persist workflow state
  const dataWithWorkflow = useMemo(() => {
    if (!workflow) return formData;
    return { ...formData, meta: { ...((formData as any)?.meta ?? {}), workflow } };
  }, [formData, workflow]);

  const { saving, lastSaved } = useDocumentAutoSave(docId, dataWithWorkflow);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setInvalidFields((prev) => {
      if (prev.has(key) && value?.trim()) {
        const next = new Set(prev);
        next.delete(key);
        return next;
      }
      return prev;
    });
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
    setInvalidFields(new Set());
    setWorkflow((prev) => (prev ? { ...prev, current_step: stepId } : prev));
  }, []);

  const handleToggleStep = useCallback((stepId: string, enabled: boolean) => {
    setWorkflow((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: { ...prev.steps, [stepId]: { ...prev.steps[stepId], enabled } },
      };
    });
  }, []);

  const handleNext = useCallback(async () => {
    if (!workflow) return;
    const enabledSections = sections.filter((s) => workflow.steps[s.id]?.enabled !== false);
    const currentIdx = enabledSections.findIndex((s) => s.id === workflow.current_step);
    if (currentIdx < 0) return;

    const currentSection = enabledSections[currentIdx];
    const { complete } = calculateSectionCompletion(currentSection, formData);

    if (currentSection.required && !complete) {
      // Identify which required fields are empty
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

      const { error: insertError } = await supabase
        .from("document_versions")
        .insert({
          documento_id: docId,
          processo_id: processoId,
          conteudo_html: htmlFinal,
          versao: 1,
          gerado_por: user?.id,
        });

      if (insertError) {
        console.error("Erro ao inserir versão:", insertError);
        toast.error("Erro ao gerar documento. Tente novamente.");
        return;
      }

      await supabase.from("documentos").update({
        status: "aprovado",
        conteudo_final: htmlFinal,
        workflow_status: "rascunho",
      }).eq("id", docId);

      const newProcessoStatus = getProcessoStatusAfterApproval(documento?.tipo);
      await supabase.from("processos").update({ status: newProcessoStatus }).eq("id", processoId);
      queryClient.invalidateQueries({ queryKey: ["processo", processoId] });
      queryClient.invalidateQueries({ queryKey: ["pipeline", processoId] });
      toast.success(`${documento?.tipo ?? "Documento"} finalizado! Redirecionando...`);
      navigate(`/processo/${processoId}/documento/${docId}/view`);
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
  }, [workflow, sections, formData, docId, processoId, queryClient, navigate]);

  const handlePrevious = useCallback(() => {
    if (!workflow) return;
    setInvalidFields(new Set());
    const enabledSections = sections.filter((s) => workflow.steps[s.id]?.enabled !== false);
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
  const canAdvance = currentSection
    ? !currentSection.required || currentCompletion.complete
    : false;

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
        userEmail={user?.email ?? undefined}
      />

      {/* MAIN 3-COLUMN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Pipeline Sidebar */}
        <DocumentStepSidebar
          sections={sections}
          workflow={workflow}
          formData={formData}
          documentTitle={documento.tipo ?? "Documento"}
          documentNumber={processo?.numero_processo ?? undefined}
          onSelectStep={handleSelectStep}
          onToggleStep={handleToggleStep}
        />

        {/* CENTER — Workspace */}
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
                  invalidFields={invalidFields}
                  onChange={handleFieldChange}
                  onMelhorar={handleMelhorar}
                  onGerarJustificativa={() => setJustificativaOpen(true)}
                  onValidarObjeto={() => setValidarObjetoOpen(true)}
                />
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
              {currentEnabledIdx > 0 && (
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handlePrevious}>
                  <ArrowLeft className="h-3 w-3" /> Anterior
                </Button>
              )}
              <Button
                size="sm"
                className="text-xs gap-1"
                onClick={handleNext}
              >
                {isLastStep ? "Finalizar" : "Próximo"} <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT — Tools Bar */}
        <DocumentToolsBar
          onMelhorarClick={() => {
            if (currentSection) {
              const textareaField = currentSection.fields.find((f) => f.type === "textarea" && !f.readOnly);
              if (textareaField) handleMelhorar(textareaField);
            }
          }}
        />
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
