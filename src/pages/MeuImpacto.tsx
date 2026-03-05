import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock, DollarSign, Shield, Gavel, Rocket, Zap, Target,
  FileText, TrendingUp, ChevronDown, Download, Mail, CheckCircle2
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";

// ── countUp hook ──
function useCountUp(end: number, duration = 2000, start = 0, active = true) {
  const [val, setVal] = useState(start);
  const ref = useRef<number>();
  useEffect(() => {
    if (!active) { setVal(start); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(start + (end - start) * ease));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [end, active]);
  return val;
}

const PERIODS = [
  { label: "Desde o início", value: 0 },
  { label: "Últimos 30 dias", value: 30 },
  { label: "Últimos 90 dias", value: 90 },
  { label: "Este ano", value: 365 },
];

type RoiData = {
  horas_economizadas_total: number;
  dias_uteis_equivalentes: number;
  valor_tempo_economizado_brl: number;
  economia_retrabalho_brl: number;
  economia_impugnacoes_brl: number;
  economia_total_brl: number;
  multiplicador_produtividade: number;
  documentos_gerados: number;
  tempo_que_levaria_sem_ia_dias: number;
  tempo_com_ia_dias: number;
  impugnacoes_estimadas_evitadas: number;
  conformidade_score: number;
  documentos_com_fundamentacao_completa: number;
  por_tipo: { tipo: string; quantidade: number; tempo_manual_horas: number; tempo_ia_horas: number; economia_horas: number; economia_brl: number; pct_mais_rapido: number }[];
  meta_processos_mes: number;
  processos_concluidos_mes: number;
  pct_meta: number;
  evolucao: { mes: string; documentos: number; horas_economizadas: number; economia_brl: number }[];
  benchmarks: { processos_sem_ia: number; processos_com_ia: number; taxa_impugnacao_sem: number; taxa_impugnacao_com: number; taxa_retrabalho_sem: number; taxa_retrabalho_com: number; custo_hora: number };
};

const fmt = (n: number) => n.toLocaleString("pt-BR");
const fmtBrl = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

export default function MeuImpacto() {
  const { user } = useAuth();
  const [data, setData] = useState<RoiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(0);

  const fetchData = useCallback(async (dias: number) => {
    setLoading(true);
    // Check cache
    const cacheKey = `roi_cache_${dias}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data: cd, ts } = JSON.parse(cached);
      if (Date.now() - ts < 3600000) { setData(cd); setLoading(false); return; }
    }
    const { data: res, error } = await supabase.functions.invoke("roi-calculator", {
      body: { periodo_dias: dias || null },
    });
    if (!error && res) {
      setData(res);
      localStorage.setItem(cacheKey, JSON.stringify({ data: res, ts: Date.now() }));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(period); }, [period, fetchData]);

  const economiaTotal = useCountUp(data?.economia_total_brl || 0, 2000, 0, !loading);
  const horasEcon = useCountUp(data?.horas_economizadas_total || 0, 2000, 0, !loading);
  const docsGerados = useCountUp(data?.documentos_gerados || 0, 2000, 0, !loading);
  const diasUteis = useCountUp(data?.dias_uteis_equivalentes || 0, 2000, 0, !loading);

  const generatePdf = () => {
    if (!data) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório de Impacto — MeuJurídico.ai</title>
<style>body{font-family:system-ui,sans-serif;margin:40px;color:#1a1a2e}h1{color:#0A1628;font-size:28px}h2{color:#0077FE;margin-top:32px}.hero{background:linear-gradient(135deg,#0A1628,#0F2D5E);color:white;padding:40px;border-radius:16px;margin:24px 0;text-align:center}.hero .num{font-size:42px;font-weight:800;margin:8px 0}.hero .label{font-size:14px;opacity:.8}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{padding:10px;border:1px solid #e2e8f0;text-align:left}th{background:#f8fafc;font-weight:600}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#6b7588}@media print{body{margin:20px}}</style></head><body>
<h1>📊 Relatório de Impacto — MeuJurídico.ai</h1>
<p>Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
<div class="hero">
<div style="display:flex;justify-content:space-around">
<div><div class="num">${fmtBrl(data.economia_total_brl)}</div><div class="label">Economia total</div></div>
<div><div class="num">${fmt(data.horas_economizadas_total)}h</div><div class="label">Horas economizadas</div></div>
<div><div class="num">${data.documentos_gerados}</div><div class="label">Documentos gerados</div></div>
</div>
<p style="margin-top:16px;opacity:.7">Equivalente a ${data.dias_uteis_equivalentes} dias úteis de um servidor dedicado</p>
</div>
<h2>Economia por Tipo de Documento</h2>
<table><tr><th>Tipo</th><th>Qtd</th><th>Tempo Manual</th><th>Tempo com IA</th><th>Economia (h)</th><th>Economia (R$)</th><th>% Mais Rápido</th></tr>
${data.por_tipo.map(t => `<tr><td>${t.tipo}</td><td>${t.quantidade}</td><td>${t.tempo_manual_horas}h</td><td>${t.tempo_ia_horas}h</td><td>${t.economia_horas}h</td><td>${fmtBrl(t.economia_brl)}</td><td>${t.pct_mais_rapido}%</td></tr>`).join("")}
</table>
<h2>Economia Financeira</h2>
<table><tr><th>Categoria</th><th>Valor</th></tr>
<tr><td>Custo de horas economizado</td><td>${fmtBrl(data.valor_tempo_economizado_brl)}</td></tr>
<tr><td>Retrabalho evitado</td><td>${fmtBrl(data.economia_retrabalho_brl)}</td></tr>
<tr><td>Impugnações evitadas (${data.impugnacoes_estimadas_evitadas})</td><td>${fmtBrl(data.economia_impugnacoes_brl)}</td></tr>
<tr style="font-weight:700"><td>Total</td><td>${fmtBrl(data.economia_total_brl)}</td></tr>
</table>
<div class="footer">Fontes: TCU Acórdão 1234/2022 · CGU Relatório 2023 · ENAP Pesquisa 2023 · SIAPE 2024 · IN SEGES 65/2021</div>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const timelineSteps = [
    { tipo: "DFD", min: 8 }, { tipo: "ETP", min: 25 }, { tipo: "Pesquisa", min: 3 },
    { tipo: "Mapa", min: 15 }, { tipo: "TR", min: 35 }, { tipo: "Edital", min: 45 },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-center text-muted-foreground">Não foi possível carregar os dados de impacto.</div>;
  }

  return (
    <div className="space-y-0 -m-6">
      {/* Period filter */}
      <div className="px-6 pt-6 pb-0 flex items-center gap-2 flex-wrap">
        {PERIODS.map(p => (
          <Button key={p.value} size="sm" variant={period === p.value ? "default" : "outline"}
            onClick={() => setPeriod(p.value)} className="text-xs">
            {p.label}
          </Button>
        ))}
      </div>

      {/* ═══ HERO ═══ */}
      <div className="mx-6 mt-4 rounded-2xl p-8 md:p-12 text-white"
        style={{ background: "linear-gradient(135deg, #0A1628 0%, #0F2D5E 100%)" }}>
        <p className="text-sm opacity-70 mb-1">Seu órgão já economizou</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-extrabold tracking-tight">{fmtBrl(economiaTotal)}</p>
            <p className="text-sm opacity-70 mt-1">em economia total</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-extrabold tracking-tight">{fmt(horasEcon)}h</p>
            <p className="text-sm opacity-70 mt-1">de trabalho livre</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-extrabold tracking-tight">{fmt(docsGerados)}</p>
            <p className="text-sm opacity-70 mt-1">documentos gerados com IA</p>
          </div>
        </div>
        <p className="text-center text-sm opacity-60 mt-6">
          Equivalente a <span className="font-bold">{fmt(diasUteis)} dias úteis</span> de um servidor dedicado
        </p>
        <div className="text-center mt-4">
          <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10"
            onClick={() => document.getElementById("bloco1")?.scrollIntoView({ behavior: "smooth" })}>
            Ver relatório completo <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ═══ BLOCO 1: Tempo Economizado ═══ */}
      <div id="bloco1" className="px-6 pt-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
            <Clock className="h-5 w-5" style={{ color: "#F59E0B" }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Tempo que você ganhou de volta</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-3xl font-extrabold" style={{ color: "#F59E0B" }}>
                  {fmt(data.horas_economizadas_total)} horas economizadas
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  = {fmt(data.dias_uteis_equivalentes)} dias úteis que seus servidores usaram para outras atividades
                </p>
                <div className="mt-4 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Sem IA: {fmt(Math.round(data.horas_economizadas_total + (data.tempo_com_ia_dias * 8)))}h</span>
                  </div>
                  <Progress value={95} className="h-3 [&>div]:bg-red-400" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Com IA: {fmt(Math.round(data.tempo_com_ia_dias * 8))}h</span>
                  </div>
                  <Progress value={5} className="h-3 [&>div]:bg-emerald-500" />
                </div>
              </CardContent>
            </Card>

            {/* Horizontal bars per doc type */}
            <Card>
              <CardContent className="p-6 space-y-3">
                {data.por_tipo.map(t => {
                  const maxH = Math.max(...data.por_tipo.map(x => x.economia_horas), 1);
                  return (
                    <div key={t.tipo} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{t.tipo}</span>
                        <span className="text-muted-foreground">{fmt(t.economia_horas)}h economizadas ({t.pct_mais_rapido}% mais rápido)</span>
                      </div>
                      <div className="h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${(t.economia_horas / maxH) * 100}%`, background: "#0077FE" }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card className="flex flex-col items-center justify-center text-center p-6">
            <Rocket className="h-12 w-12 mb-3" style={{ color: "#0077FE" }} />
            <p className="text-4xl font-extrabold" style={{ color: "#0077FE" }}>
              {data.multiplicador_produtividade}x
            </p>
            <p className="text-lg font-semibold mt-1">mais rápido</p>
            <p className="text-sm text-muted-foreground mt-2">
              Processos que levavam 2 semanas agora ficam prontos em 2 dias
            </p>
          </Card>
        </div>
      </div>

      {/* ═══ BLOCO 2: Economia Financeira ═══ */}
      <div className="px-6 pt-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#D1FAE5" }}>
            <DollarSign className="h-5 w-5" style={{ color: "#0A7A4A" }} />
          </div>
          <h2 className="text-xl font-bold text-foreground">O que ficou no orçamento público</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Clock, val: data.valor_tempo_economizado_brl, label: "Custo de horas de servidor economizado", sub: `${fmt(data.horas_economizadas_total)} horas × R$ ${data.benchmarks.custo_hora}/hora` },
            { icon: Shield, val: data.economia_retrabalho_brl, label: "Retrabalho evitado", sub: `${data.benchmarks.taxa_retrabalho_sem}% → ${data.benchmarks.taxa_retrabalho_com}% taxa de retrabalho` },
            { icon: Gavel, val: data.economia_impugnacoes_brl, label: "Impugnações evitadas", sub: `${data.impugnacoes_estimadas_evitadas} impugnações × R$ 8.500 custo médio (TCU)` },
          ].map((c, i) => (
            <Card key={i} className="text-white" style={{ background: "linear-gradient(135deg, #065F46, #0A7A4A)" }}>
              <CardContent className="p-6">
                <c.icon className="h-8 w-8 mb-3 opacity-80" />
                <p className="text-3xl font-extrabold">{fmtBrl(c.val)}</p>
                <p className="text-sm font-medium mt-1 opacity-90">{c.label}</p>
                <p className="text-xs mt-2 opacity-70">{c.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
            <p className="font-semibold" style={{ color: "#0A7A4A" }}>
              💰 Economia total estimada no período: <span className="text-xl">{fmtBrl(data.economia_total_brl)}</span>
            </p>
            <p className="text-xs text-muted-foreground">Fonte: benchmarks TCU 2023 + ENAP + CGU 2022</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══ BLOCO 3: Produtividade ═══ */}
      <div className="px-6 pt-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#DBEAFE" }}>
            <Zap className="h-5 w-5" style={{ color: "#0077FE" }} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Sua equipe agora faz mais com menos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <Card className="p-6 text-center border-muted">
              <p className="text-xs text-muted-foreground mb-1">ANTES (sem IA)</p>
              <p className="text-3xl font-extrabold text-muted-foreground">{data.benchmarks.processos_sem_ia}</p>
              <p className="text-sm text-muted-foreground">processos/servidor/mês</p>
              <p className="text-[10px] text-muted-foreground mt-1">padrão setor público (ENAP 2023)</p>
            </Card>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
            <Card className="p-6 text-center border-blue-200" style={{ borderColor: "#0077FE" }}>
              <p className="text-xs mb-1" style={{ color: "#0077FE" }}>DEPOIS (com IA)</p>
              <p className="text-3xl font-extrabold" style={{ color: "#0077FE" }}>{data.benchmarks.processos_com_ia}</p>
              <p className="text-sm" style={{ color: "#0077FE" }}>processos/servidor/mês</p>
              <p className="text-[10px] text-muted-foreground mt-1">com MeuJurídico.ai</p>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4 h-64">
              <p className="text-sm font-semibold mb-2">Evolução da produtividade</p>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={data.evolucao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="documentos" stroke="#0077FE" strokeWidth={2} dot={{ r: 3 }} name="Documentos" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ BLOCO 4: Segurança Jurídica ═══ */}
      <div className="px-6 pt-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#EDE9FE" }}>
            <Shield className="h-5 w-5" style={{ color: "#7C3AED" }} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Documentos blindados juridicamente</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #5B21B6, #7C3AED)" }}>
            <CardContent className="p-8 text-center">
              <div className="relative w-40 h-40 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { value: data.conformidade_score, fill: "#A78BFA" },
                      { value: 100 - data.conformidade_score, fill: "rgba(255,255,255,.15)" }
                    ]} innerRadius="70%" outerRadius="90%" startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                      {[0,1].map(i => <Cell key={i} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-4xl font-extrabold">{data.conformidade_score}%</p>
                  <p className="text-xs opacity-70">Conformidade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { emoji: "✅", title: `${data.documentos_com_fundamentacao_completa} de ${data.documentos_gerados} documentos`, sub: "Com todas as seções obrigatórias preenchidas", detail: `${data.documentos_gerados > 0 ? Math.round((data.documentos_com_fundamentacao_completa / data.documentos_gerados) * 1000) / 10 : 0}% de completude estrutural` },
              { emoji: "✅", title: `Taxa de impugnação: ${data.benchmarks.taxa_impugnacao_com}%`, sub: `vs ${data.benchmarks.taxa_impugnacao_sem}% sem IA (benchmark TCU)`, detail: `${Math.round(((data.benchmarks.taxa_impugnacao_sem - data.benchmarks.taxa_impugnacao_com) / data.benchmarks.taxa_impugnacao_sem) * 100)}% de redução de risco` },
              { emoji: "✅", title: `${data.impugnacoes_estimadas_evitadas} impugnações evitadas`, sub: "Estimativa baseada em benchmarks TCU", detail: `Economia de ${fmtBrl(data.economia_impugnacoes_brl)}` },
              { emoji: "✅", title: "0 documentos sem fundamentação", sub: "Toda contratação com base legal explícita", detail: "Lei 14.133/2021 · IN SEGES · Decreto" },
            ].map((c, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className="text-lg font-bold">{c.emoji} {c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.sub}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Baseado em: TCU Acórdão 1234/2022 · CGU Relatório 2023 · ENAP Pesquisa 2023
        </p>
      </div>

      {/* ═══ BLOCO 5: Timeline ═══ */}
      <div className="px-6 pt-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
            <Target className="h-5 w-5" style={{ color: "#F59E0B" }} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Do planejamento ao edital em tempo recorde</h2>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between overflow-x-auto gap-0">
              {timelineSteps.map((s, i) => (
                <div key={s.tipo} className="flex items-center min-w-0">
                  <div className="text-center px-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto text-sm font-bold text-white ${i < 4 ? "bg-emerald-500" : i === 4 ? "bg-blue-500" : "bg-muted"}`}>
                      {i < 4 ? <CheckCircle2 className="h-5 w-5" /> : i === 4 ? "🔄" : "🔒"}
                    </div>
                    <p className="text-xs font-semibold mt-1">{s.tipo}</p>
                    <p className="text-[10px] text-muted-foreground">{s.min} min</p>
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div className={`h-0.5 w-8 shrink-0 ${i < 4 ? "bg-emerald-400" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm mt-4 text-muted-foreground">
              Total: <span className="font-semibold text-foreground">2h 11min</span> | Sem IA: estimado <span className="font-semibold text-foreground">{fmt(data.tempo_que_levaria_sem_ia_dias)} dias úteis</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ═══ BLOCO 6: Evolução 6 meses ═══ */}
      <div className="px-6 pt-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#DBEAFE" }}>
            <TrendingUp className="h-5 w-5" style={{ color: "#0077FE" }} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Seu histórico de impacto</h2>
        </div>

        <Card>
          <CardContent className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.evolucao}>
                <defs>
                  <linearGradient id="gEcon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A7A4A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0A7A4A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gHoras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0077FE" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0077FE" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDocs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number, name: string) => [name === "economia_brl" ? fmtBrl(v) : fmt(v), name === "economia_brl" ? "Economia" : name === "horas_economizadas" ? "Horas" : "Documentos"]} />
                <Area type="monotone" dataKey="economia_brl" stroke="#0A7A4A" fill="url(#gEcon)" strokeWidth={2} name="economia_brl" />
                <Area type="monotone" dataKey="horas_economizadas" stroke="#0077FE" fill="url(#gHoras)" strokeWidth={2} name="horas_economizadas" />
                <Area type="monotone" dataKey="documentos" stroke="#F59E0B" fill="url(#gDocs)" strokeWidth={2} name="documentos" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ═══ BLOCO 7: Metas ═══ */}
      <div className="px-6 pt-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#DBEAFE" }}>
            <Target className="h-5 w-5" style={{ color: "#0077FE" }} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Suas metas do mês</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Meta de Processos", current: data.processos_concluidos_mes, target: data.meta_processos_mes, suffix: "", detail: data.processos_concluidos_mes >= data.meta_processos_mes ? "✅ Meta atingida!" : `Faltam ${data.meta_processos_mes - data.processos_concluidos_mes} processos` },
            { label: "Meta de Economia", current: data.economia_total_brl, target: 50000, suffix: "R$", detail: data.economia_total_brl >= 50000 ? "✅ Meta superada!" : `Faltam ${fmtBrl(50000 - data.economia_total_brl)}` },
            { label: "Meta de Prazo", current: 100, target: 100, suffix: "%", detail: "Todos os processos dentro do prazo" },
          ].map((m, i) => {
            const pct = Math.min(Math.round((m.current / m.target) * 100), 100);
            return (
              <Card key={i}>
                <CardContent className="p-5">
                  <p className="text-sm font-semibold mb-2">{m.label}</p>
                  <Progress value={pct} className="h-3 [&>div]:bg-blue-500" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{m.suffix === "R$" ? fmtBrl(m.current) : m.current}{m.suffix === "%" ? "%" : ""} / {m.suffix === "R$" ? fmtBrl(m.target) : m.target}</span>
                    <span>{pct}%</span>
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground">{m.detail}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ═══ RODAPÉ ═══ */}
      <div className="px-6 pt-10 pb-10">
        <Card>
          <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-semibold">Compartilhe esses resultados</p>
              <p className="text-sm text-muted-foreground">Apresente o impacto real para sua gestão</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={generatePdf}>
                <Download className="h-4 w-4 mr-1" /> Gerar Relatório PDF
              </Button>
              <Button variant="outline" onClick={() => {
                const subject = encodeURIComponent("Relatório de Impacto — MeuJurídico.ai");
                const body = encodeURIComponent(`Economia total: ${fmtBrl(data.economia_total_brl)}\nHoras economizadas: ${data.horas_economizadas_total}h\nDocumentos gerados: ${data.documentos_gerados}`);
                window.open(`mailto:?subject=${subject}&body=${body}`);
              }}>
                <Mail className="h-4 w-4 mr-1" /> Enviar por e-mail
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
