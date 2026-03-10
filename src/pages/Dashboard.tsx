import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, FileText, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { NovoProcessoDialog } from "@/components/NovoProcessoDialog";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Dashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const { user } = useAuth();

  const { data: processos, isLoading: loadingProcessos, refetch } = useQuery({
    queryKey: ["processos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos")
        .select(`*, documentos (id, tipo, status, posicao_cadeia)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from("processos").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("documentos").select("id", { count: "exact", head: true }).eq("status", "rascunho"),
        supabase.from("alertas_cascata").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      ].map((q) => (q as any).then((r: any) => r).catch(() => ({ count: 0 }))));
      const [processosRes, docsRascunhoRes, alertasRes] = results;
      return {
        ativos: (processosRes as any).count ?? 0,
        emRevisao: (docsRascunhoRes as any).count ?? 0,
        alertas: (alertasRes as any).count ?? 0,
        total: processos?.length ?? 0,
      };
    },
    enabled: !!processos,
  });

  const { data: impactData } = useQuery({
    queryKey: ["meu-impacto", user?.id],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const orgId = (authUser?.user_metadata?.org_id as string | undefined) ?? authUser?.id ?? user?.id;

      const { data, error } = await supabase.functions.invoke("roi-calculator", {
        body: { org_id: orgId, periodo_dias: 180 }, // approx 6 months
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Calculate dynamic bar chart data from processos
  const dynamicBarChartData = useMemo(() => {
    if (!processos) return [];

    // Create an ordered map for the last 6 months
    const monthsMap = new Map<string, number>();
    const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      // Capitalize first letter (e.g. "jan", "fev" -> "Jan", "Fev")
      const monthStr = formatter.format(d)
      const capitalized = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).replace(".", "");
      monthsMap.set(capitalized, 0);
    }

    processos.forEach(p => {
      if (p.created_at) {
        const date = new Date(p.created_at);
        const monStr = formatter.format(date);
        const capitalized = monStr.charAt(0).toUpperCase() + monStr.slice(1).replace(".", "");
        if (monthsMap.has(capitalized)) {
          monthsMap.set(capitalized, monthsMap.get(capitalized)! + 1);
        }
      }
    });

    return Array.from(monthsMap.entries()).map(([month, count]) => ({ month, processos: count }));
  }, [processos]);

  const lineChartData = impactData?.historico?.map((h: any) => ({
    month: h.mes,
    economia: Number((h.economia_brl / 1000000).toFixed(2)) // millions
  })) || dynamicBarChartData.map(d => ({ month: d.month, economia: 0 }));

  // Process status calculation
  const statusGeral = useMemo(() => {
    if (!processos || processos.length === 0) return { concluidos: 0, andamento: 0, atrasados: 0 };
    const concluidos = processos.filter(p => p.status === 'concluido').length;
    const andamento = processos.filter(p => p.status === 'ativo').length;
    // Mock atrasados se houver alertas, assume andamento e com alerta = atrasado
    const atrasados = Math.min(stats?.alertas || 0, andamento);
    // Ajustar andamento puro
    const andamentoPuro = Math.max(0, andamento - atrasados);

    const pctConcluido = Math.round((concluidos / processos.length) * 100) || 0;
    const pctAtrasado = Math.round((atrasados / processos.length) * 100) || 0;
    // O resto é em andamento
    const pctAndamento = Math.round((andamentoPuro / processos.length) * 100) || 0;

    return { concluidos: pctConcluido, andamento: pctAndamento, atrasados: pctAtrasado };
  }, [processos, stats]);

  const handleInjectMockData = async () => {
    try {
      setIsInjecting(true);
      toast.info("Iniciando injeção de dados...");

      // 1. Check and Create Cadeias Documentais
      const { data: cadeias } = await supabase.from('cadeias_documentais').select('id, modalidade');
      let cadeiaPregaoId, cadeiaDispensaId;

      if (!cadeias || cadeias.length === 0) {
        toast.info("Inserindo cadeias documentais...");
        const { data: newCadeias, error: errCad } = await supabase.from('cadeias_documentais').insert([
          { nome: "Pregão Eletrônico - Padrão", descricao: "Fluxo padrão para Pregão", modalidade: "Pregão Eletrônico", ativo: true },
          { nome: "Dispensa de Licitação - Bens", descricao: "Fluxo para Dispensa", modalidade: "Dispensa de Licitação", ativo: true },
          { nome: "Concorrência Pública", descricao: "Fluxo para obras", modalidade: "Concorrência", ativo: true }
        ]).select();

        if (errCad) throw errCad;
        cadeiaPregaoId = newCadeias.find(c => c.modalidade === "Pregão Eletrônico")?.id;
        cadeiaDispensaId = newCadeias.find(c => c.modalidade === "Dispensa de Licitação")?.id;
      } else {
        cadeiaPregaoId = cadeias.find(c => c.modalidade === "Pregão Eletrônico")?.id || cadeias[0].id;
        cadeiaDispensaId = cadeias.find(c => c.modalidade === "Dispensa de Licitação")?.id || cadeias[0].id;
      }

      // 2. Insert 10 fake processos
      toast.info("Inserindo 10 processos falsos...");
      const orgaos = [
        "Prefeitura Municipal de São Paulo", "Prefeitura de Guarulhos",
        "Secretaria da Educação SP", "Prefeitura de Campinas",
        "Secretaria da Saúde SP", "Prefeitura de Santos",
        "Prefeitura de Ribeirão Preto", "Prefeitura de São Bernardo do Campo",
        "Prefeitura de Santo André", "Secretaria de Meio Ambiente SP"
      ];

      const objetos = [
        "Aquisição de notebooks para escolas", "Serviços de limpeza",
        "Reforma de UBS", "Aquisição de mobiliário escolar",
        "Serviços de segurança", "Fornecimento de merenda escolar",
        "Licenças de software", "Material de escritório",
        "Obras de recapeamento", "Consultoria técnica"
      ];

      for (let i = 0; i < 10; i++) {
        const modalidade = i % 2 === 0 ? "Pregão Eletrônico" : "Dispensa de Licitação";
        const cadeia_id = i % 2 === 0 ? cadeiaPregaoId : cadeiaDispensaId;
        const num = `Processo ${i + 1}/${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;

        const { error: errRpc } = await supabase.rpc("create_processo_com_documento_raiz", {
          p_numero_processo: num,
          p_orgao: orgaos[i],
          p_objeto: objetos[i],
          p_modalidade: modalidade,
          p_cadeia_id: cadeia_id
        });

        if (errRpc) {
          console.error("Erro via RPC, inserindo direto...", errRpc);
          const { data: pData, error: pErr } = await supabase.from('processos').insert({
            numero_processo: num,
            orgao: orgaos[i],
            objeto: objetos[i],
            modalidade: modalidade,
            status: "ativo",
            created_by: user?.id || ""
          }).select().single();

          if (pData) {
            await supabase.from('documentos').insert({ processo_id: pData.id, tipo: "dfd", status: "rascunho" });
          } else if (pErr) {
            console.error("Erro ao inserir direto:", pErr);
          }
        }
      }
      toast.success("Dados injetados com sucesso! Atualizando tela...");
      refetch(); // Refetch table data
    } catch (e: any) {
      console.error(e);
      toast.error("Falha ao injetar dados: " + e.message);
    } finally {
      setIsInjecting(false);
    }
  };

  const isLoading = loadingProcessos || loadingStats;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Central Operacional</h1>
          <p className="text-sm text-muted-foreground">Visão geral dos processos licitatórios</p>
        </div>
        <div className="flex gap-2">
          {!processos?.length && (
            <Button variant="outline" size="sm" onClick={handleInjectMockData} disabled={isInjecting}>
              {isInjecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              🛠 Injetar 10 Processos SP
            </Button>
          )}
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Processo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <div className="h-28 rounded-xl bg-muted/50 animate-pulse" />
            <div className="h-28 rounded-xl bg-muted/50 animate-pulse" />
            <div className="h-28 rounded-xl bg-muted/50 animate-pulse" />
            <div className="h-28 rounded-xl bg-muted/50 animate-pulse" />
          </>
        ) : (
          <>
            <KpiCard icon={FolderKanban} label="Processos Ativos" value={stats?.ativos ?? 0} />
            <KpiCard icon={FileText} label="Docs em Revisão" value={stats?.emRevisao ?? 0} />
            <KpiCard icon={AlertTriangle} label="Alertas Cascata" value={stats?.alertas ?? 0} />
            <KpiCard icon={Clock} label="Total Processos" value={stats?.total ?? 0} />
          </>
        )}
      </div>

      {/* Graphs Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Processos por Mês</CardTitle>
            <p className="text-sm text-muted-foreground">Volume de processos iniciados nos últimos meses</p>
          </CardHeader>
          <CardContent className="h-[280px]">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicBarChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="processos" fill="#1A56DB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Economia Estimada</CardTitle>
            <p className="text-sm text-muted-foreground">Evolução do savings gerado (em milhões R$)</p>
          </CardHeader>
          <CardContent className="h-[280px]">
            {!impactData && !isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                Sem dados de impacto suficientes.
              </div>
            ) : isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="economia" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Graphs / Metrics Row */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 shadow-sm md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Status Geral da Operação</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4 pt-2 animate-pulse">
                <div className="h-8 bg-muted rounded-md" />
                <div className="h-8 bg-muted rounded-md" />
                <div className="h-8 bg-muted rounded-md" />
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium">Concluídos com Sucesso</span>
                  </div>
                  <span className="text-sm font-bold">{statusGeral.concluidos}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${statusGeral.concluidos}%` }} />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">Em Andamento (Dentro do Prazo)</span>
                  </div>
                  <span className="text-sm font-bold">{statusGeral.andamento}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${statusGeral.andamento}%` }} />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium">Atrasados / Com Alertas</span>
                  </div>
                  <span className="text-sm font-bold">{statusGeral.atrasados}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${statusGeral.atrasados}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-primary">Produtividade IA</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center h-[200px] text-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">
                {impactData?.horas_economizadas_total ? `${impactData.horas_economizadas_total}h` : "..."}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Tempo economizado essa semana<br /> na geração de ETPs e TRs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <NovoProcessoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
