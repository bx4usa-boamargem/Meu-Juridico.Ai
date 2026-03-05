import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PriceResearchDrawer } from "@/components/documento/PriceResearchDrawer";
import MapaDeRiscos from "@/pages/MapaDeRiscos";
import { useAuth } from "@/hooks/useAuth";
import {
  Check, Circle, Lock, Loader2, FileText, ArrowRight,
  AlertTriangle, Clock, Eye, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PipelineItem {
  tipo: string;
  posicao: number;
  doc_id: string | null;
  status: string | null;
  desbloqueado: boolean;
}

// Full chain definition with display names and phases
const FULL_CHAIN = [
  { key: "dfd", label: "DFD — Documento de Formalização da Demanda", phase: "interna" },
  { key: "etp", label: "ETP — Estudo Técnico Preliminar", phase: "interna" },
  { key: "pesquisa_precos", label: "Pesquisa de Preços", phase: "interna", special: "price" },
  { key: "mapa_riscos", label: "Mapa de Riscos", phase: "interna", special: "risk" },
  { key: "tr", label: "TR — Termo de Referência", phase: "interna" },
  { key: "parecer_juridico", label: "Parecer Jurídico", phase: "interna" },
  { key: "edital", label: "Edital", phase: "externa" },
  { key: "publicacao", label: "Publicação", phase: "externa" },
  { key: "contrato", label: "Contrato", phase: "externa" },
];

function getStepStatus(
  step: typeof FULL_CHAIN[0],
  pipeline: PipelineItem[],
  priceResearchExists: boolean,
  riskMapApproved: boolean,
): { status: "aprovado" | "rascunho" | "proximo" | "bloqueado"; docId: string | null; date?: string } {
  // Special steps
  if (step.special === "price") {
    if (priceResearchExists) return { status: "aprovado", docId: null };
    // Unlocked after ETP approved
    const etp = pipeline.find(p => p.tipo === "etp");
    if (etp?.status === "aprovado") return { status: "proximo", docId: null };
    return { status: "bloqueado", docId: null };
  }
  if (step.special === "risk") {
    if (riskMapApproved) return { status: "aprovado", docId: null };
    // Unlocked after price research exists
    if (priceResearchExists) return { status: "proximo", docId: null };
    return { status: "bloqueado", docId: null };
  }

  // Regular pipeline step
  const pItem = pipeline.find(p => p.tipo === step.key);
  if (pItem?.status === "aprovado") return { status: "aprovado", docId: pItem.doc_id };
  if (pItem?.status === "rascunho") return { status: "rascunho", docId: pItem.doc_id };
  if (pItem?.doc_id) return { status: "rascunho", docId: pItem.doc_id };
  if (pItem?.desbloqueado) return { status: "proximo", docId: null };
  return { status: "bloqueado", docId: null };
}

export default function Processo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [priceDrawerOpen, setPriceDrawerOpen] = useState(false);
  const [showRiskMap, setShowRiskMap] = useState(false);
  const [creatingTipo, setCreatingTipo] = useState<string | null>(null);

  // Load processo + DFD via view
  const { data: processo, isLoading } = useQuery({
    queryKey: ["processo", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_processo_com_dfd" as any)
        .select("*")
        .eq("processo_id", id!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  // Load pipeline
  const { data: pipeline } = useQuery({
    queryKey: ["pipeline", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("obter_pipeline_processo" as any, {
        p_processo_id: id!,
      });
      if (error) throw error;
      return (data as any as PipelineItem[]) ?? [];
    },
    enabled: !!id,
  });

  // Check if price research exists
  const { data: priceRef } = useQuery({
    queryKey: ["price-ref", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("price_references")
        .select("id")
        .eq("processo_id", id!)
        .limit(1);
      return data && data.length > 0;
    },
    enabled: !!id,
  });

  // Check if risk map is approved
  const { data: riskMapData } = useQuery({
    queryKey: ["risk-map", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("risk_maps" as any)
        .select("id, aprovado_em")
        .eq("processo_id", id!)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        return { exists: true, approved: !!(data[0] as any).aprovado_em };
      }
      return { exists: false, approved: false };
    },
    enabled: !!id,
  });

  // Load documents list
  const { data: documentos } = useQuery({
    queryKey: ["docs-list", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, tipo, status, created_at, versao, posicao_cadeia")
        .eq("processo_id", id!)
        .order("posicao_cadeia", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Load monitoring alerts
  const { data: alertas } = useQuery({
    queryKey: ["alertas-processo"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_alertas_documento", { p_doc_type: "tr" });
      return data ?? [];
    },
  });

  // Auto-redirect: DFD not approved and exists → go to document workspace
  useEffect(() => {
    if (!processo) return;
    const { dfd_id, dfd_status } = processo;
    if (dfd_id && dfd_status !== "aprovado") {
      navigate(`/processo/${id}/documento/${dfd_id}`, { replace: true });
    }
  }, [processo, id, navigate]);

  const pipelineArr = pipeline ?? [];
  const priceResearchExists = priceRef ?? false;
  const riskMapApproved = riskMapData?.approved ?? false;

  // Build enriched steps
  const enrichedSteps = useMemo(() => {
    return FULL_CHAIN.map((step) => ({
      ...step,
      ...getStepStatus(step, pipelineArr, priceResearchExists, riskMapApproved),
    }));
  }, [pipelineArr, priceResearchExists, riskMapApproved]);

  const completedCount = enrichedSteps.filter(s => s.status === "aprovado").length;
  const totalCount = enrichedSteps.length;
  const currentStep = enrichedSteps.find(s => s.status === "rascunho" || s.status === "proximo");
  const pendingSteps = enrichedSteps.filter(s => s.status !== "aprovado");

  // Health indicator
  const health = useMemo(() => {
    if (!processo) return "green";
    const now = Date.now();
    const lastUpdate = new Date(processo.created_at).getTime();
    const daysSince = (now - lastUpdate) / 86400000;
    if (daysSince > 15 && completedCount < totalCount) return "red";
    if (daysSince > 7 && completedCount < totalCount) return "yellow";
    return "green";
  }, [processo, completedCount, totalCount]);

  const handleCreateDoc = async (tipo: string) => {
    if (!id) return;
    setCreatingTipo(tipo);
    try {
      const pItem = pipelineArr.find(p => p.tipo === tipo);
      const prevItem = pipelineArr.find(p => p.posicao === (pItem?.posicao ?? 0) - 1);
      const parentDocId = prevItem?.doc_id ?? null;

      const existingDoc = pipelineArr.find(p => p.doc_id);
      let cadeiaId: string | null = null;
      if (existingDoc?.doc_id) {
        const { data: docData } = await supabase
          .from("documentos")
          .select("cadeia_id")
          .eq("id", existingDoc.doc_id)
          .single();
        cadeiaId = docData?.cadeia_id ?? null;
      }

      const { data: newDoc, error } = await supabase
        .from("documentos")
        .insert({
          processo_id: id,
          tipo,
          posicao_cadeia: pItem?.posicao ?? 0,
          status: "rascunho",
          cadeia_id: cadeiaId,
          parent_doc_id: parentDocId,
        })
        .select("id")
        .single();

      if (error) throw error;
      navigate(`/processo/${id}/documento/${newDoc.id}`);
    } catch (err: any) {
      console.error("Erro ao criar documento:", err);
      toast.error("Erro ao criar documento. Tente novamente.");
    } finally {
      setCreatingTipo(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
        <p className="text-sm text-muted-foreground">Processo não encontrado.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/processos")}>Voltar</Button>
      </div>
    );
  }

  // DFD not approved → useEffect will redirect
  if (processo.dfd_id && processo.dfd_status !== "aprovado") {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!processo.dfd_id) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
        <p className="text-sm text-muted-foreground">Processo sem DFD vinculado.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/processos")}>Voltar</Button>
      </div>
    );
  }

  const healthColors = { green: "bg-emerald-500", yellow: "bg-yellow-500", red: "bg-red-500" };
  const healthLabels = { green: "Em dia", yellow: "Atenção", red: "Atrasado" };

  const internaSteps = enrichedSteps.filter(s => s.phase === "interna");
  const externaSteps = enrichedSteps.filter(s => s.phase === "externa");

  return (
    <div className="flex gap-6 p-6 max-w-7xl mx-auto">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Status Banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("h-3 w-3 rounded-full", healthColors[health])} />
              <div className="flex-1">
                <h1 className="text-base font-semibold">
                  {processo.numero_processo || "Sem número"} — {processo.orgao || "Órgão"}
                </h1>
                {currentStep && (
                  <p className="text-sm text-muted-foreground">
                    Você está na etapa: <span className="font-medium text-foreground">{currentStep.label}</span>
                  </p>
                )}
              </div>
              <Badge className="text-[10px]">{healthLabels[health]}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={(completedCount / totalCount) * 100} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {completedCount} de {totalCount} etapas concluídas
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Fase Interna */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Fase Interna — Planejamento
          </h2>
          <div className="space-y-1">
            {internaSteps.map((step, i) => (
              <StepRow
                key={step.key}
                step={step}
                processoId={id!}
                creatingTipo={creatingTipo}
                onCreateDoc={handleCreateDoc}
                onOpenPriceDrawer={() => setPriceDrawerOpen(true)}
                onOpenRiskMap={() => setShowRiskMap(true)}
                onNavigate={navigate}
              />
            ))}
          </div>
        </div>

        {/* Fase Externa */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Fase Externa — Licitação
          </h2>
          <div className="space-y-1">
            {externaSteps.map((step) => (
              <StepRow
                key={step.key}
                step={step}
                processoId={id!}
                creatingTipo={creatingTipo}
                onCreateDoc={handleCreateDoc}
                onOpenPriceDrawer={() => {}}
                onOpenRiskMap={() => {}}
                onNavigate={navigate}
              />
            ))}
          </div>
        </div>

        {/* Inline Risk Map */}
        {showRiskMap && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Mapa de Riscos</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowRiskMap(false)}>
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <MapaDeRiscos
                processoId={id}
                objeto={processo.objeto}
                modalidade={processo.modalidade}
                onApproved={() => {
                  setShowRiskMap(false);
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        {documentos && documentos.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Documentos criados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {documentos.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium uppercase">{doc.tipo}</span>
                      <Badge variant={doc.status === "aprovado" ? "default" : "secondary"} className="text-[9px]">
                        {doc.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-6 gap-1"
                      onClick={() => {
                        if (doc.status === "aprovado") {
                          navigate(`/processo/${id}/documento/${doc.id}/view`);
                        } else {
                          navigate(`/processo/${id}/documento/${doc.id}`);
                        }
                      }}
                    >
                      {doc.status === "aprovado" ? <Eye className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                      {doc.status === "aprovado" ? "Ver" : "Abrir"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar — O que falta */}
      <div className="w-72 shrink-0 hidden lg:block space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">O que falta para este processo?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingSteps.length === 0 ? (
              <p className="text-xs text-emerald-600 font-medium">✅ Processo completo!</p>
            ) : (
              pendingSteps.map((step, i) => {
                const isNext = step.status === "proximo" || step.status === "rascunho";
                return (
                  <div
                    key={step.key}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded text-xs",
                      isNext && "bg-primary/5 font-medium",
                      !isNext && "text-muted-foreground"
                    )}
                  >
                    <span className="w-4 text-center text-[10px]">{i + 1}.</span>
                    <span className="flex-1 truncate">{step.label}</span>
                    {isNext && (
                      <span className="text-primary text-[10px]">→</span>
                    )}
                    {step.status === "bloqueado" && (
                      <Lock className="h-3 w-3 text-muted-foreground/40" />
                    )}
                  </div>
                );
              })
            )}

            {pendingSteps.length > 0 && (
              <p className="text-[10px] text-muted-foreground pt-2 border-t">
                Estimativa: {pendingSteps.length} etapa{pendingSteps.length > 1 ? "s" : ""} restante{pendingSteps.length > 1 ? "s" : ""} · ~{Math.ceil(pendingSteps.length * 0.5)}h com IA
              </p>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        {alertas && alertas.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-[10px] font-semibold text-amber-800">Alertas</span>
              </div>
              {(alertas as any[]).slice(0, 2).map((a: any) => (
                <p key={a.id} className="text-[10px] text-amber-700 leading-relaxed">
                  ⚠️ {a.title}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardContent className="p-3 space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground text-[10px]">Modalidade</span>
              <p className="font-medium">{processo.modalidade || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px]">Criado em</span>
              <p className="font-medium">{new Date(processo.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px]">Objeto</span>
              <p className="font-medium text-[11px] leading-relaxed">{processo.objeto || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Research Drawer */}
      <PriceResearchDrawer
        open={priceDrawerOpen}
        onOpenChange={setPriceDrawerOpen}
        defaultObjeto={processo.objeto ?? ""}
        processoId={id}
        orgaoNome={processo.orgao}
        userName={user?.email ?? undefined}
      />
    </div>
  );
}

// ── Step Row Component ──────────────────────────────────────────────

interface StepRowProps {
  step: {
    key: string;
    label: string;
    phase: string;
    special?: string;
    status: "aprovado" | "rascunho" | "proximo" | "bloqueado";
    docId: string | null;
  };
  processoId: string;
  creatingTipo: string | null;
  onCreateDoc: (tipo: string) => void;
  onOpenPriceDrawer: () => void;
  onOpenRiskMap: () => void;
  onNavigate: (path: string) => void;
}

function StepRow({ step, processoId, creatingTipo, onCreateDoc, onOpenPriceDrawer, onOpenRiskMap, onNavigate }: StepRowProps) {
  const isCreating = creatingTipo === step.key;

  const statusConfig = {
    aprovado: { icon: Check, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    rascunho: { icon: Circle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    proximo: { icon: ChevronRight, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
    bloqueado: { icon: Lock, color: "text-muted-foreground/40", bg: "bg-muted/30", border: "border-transparent" },
  };

  const config = statusConfig[step.status];
  const Icon = config.icon;

  const handleAction = () => {
    if (step.status === "aprovado" && step.docId) {
      onNavigate(`/processo/${processoId}/documento/${step.docId}/view`);
    } else if (step.status === "rascunho" && step.docId) {
      onNavigate(`/processo/${processoId}/documento/${step.docId}`);
    } else if (step.status === "proximo") {
      if (step.special === "price") {
        onOpenPriceDrawer();
      } else if (step.special === "risk") {
        onOpenRiskMap();
      } else {
        onCreateDoc(step.key);
      }
    }
  };

  const actionLabel = step.status === "aprovado"
    ? "Ver documento"
    : step.status === "rascunho"
    ? "Continuar"
    : step.status === "proximo"
    ? "Criar agora"
    : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all",
        config.bg,
        config.border,
        step.status === "bloqueado" && "opacity-50",
        (step.status === "proximo" || step.status === "rascunho" || step.status === "aprovado") && "cursor-pointer hover:shadow-sm",
      )}
      onClick={step.status !== "bloqueado" ? handleAction : undefined}
    >
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-full shrink-0", config.bg)}>
        {isCreating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : (
          <Icon className={cn("h-3.5 w-3.5", config.color)} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-medium", step.status === "bloqueado" && "text-muted-foreground")}>
          {step.label}
        </p>
      </div>

      {actionLabel && !isCreating && (
        <span className={cn(
          "text-[10px] font-medium shrink-0",
          step.status === "proximo" && "text-primary",
          step.status === "aprovado" && "text-emerald-600",
          step.status === "rascunho" && "text-amber-600",
        )}>
          {actionLabel} →
        </span>
      )}

      {step.status === "bloqueado" && (
        <span className="text-[9px] text-muted-foreground/60 shrink-0">Bloqueado</span>
      )}
    </div>
  );
}
