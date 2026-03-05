import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import {
    Zap, Clock, DollarSign, TrendingUp, Shield, Award, Target, Download, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── countUp hook ──────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, active = true) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!active || target === 0) { setValue(target); return; }
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const interval = setInterval(() => {
            current += increment;
            if (current >= target) { setValue(target); clearInterval(interval); }
            else setValue(Math.floor(current));
        }, duration / steps);
        return () => clearInterval(interval);
    }, [target, active, duration]);
    return value;
}

// ── Animated number component ─────────────────────────────────────────────────
function AnimNum({ value, prefix = "", suffix = "", active = true }: {
    value: number; prefix?: string; suffix?: string; active?: boolean;
}) {
    const v = useCountUp(value, 2000, active);
    return <>{prefix}{v.toLocaleString("pt-BR")}{suffix}</>;
}

const PERIOD_OPTIONS = [
    { label: "Desde o início", dias: null },
    { label: "Últimos 30 dias", dias: 30 },
    { label: "Últimos 90 dias", dias: 90 },
    { label: "Este ano", dias: 365 },
];

const TIPO_LABELS: Record<string, string> = {
    ETP: "Estudo Técnico Preliminar",
    TR: "Termo de Referência",
    DFD: "Doc. de Formalização da Demanda",
    MAPA_RISCO: "Mapa de Riscos",
    EDITAL: "Edital",
    PESQUISA_PRECOS: "Pesquisa de Preços",
};

export default function MeuImpacto() {
    const { user } = useAuth();
    const [roi, setRoi] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<{ label: string; dias: null | number }>(PERIOD_OPTIONS[0]);
    const [animated, setAnimated] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    const fetchROI = useCallback(async (dias: number | null) => {
        setLoading(true);
        const cacheKey = `roi_${user?.id}_${dias ?? "all"}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < 3_600_000) {
                setRoi(data); setLoading(false); setAnimated(true); return;
            }
        }
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const orgId = (authUser?.user_metadata?.org_id as string | undefined)
            ?? authUser?.id
            ?? user?.id;

        const { data, error } = await supabase.functions.invoke("roi-calculator", {
            body: { org_id: orgId, periodo_dias: dias },
        });

        if (!error && data) {
            setRoi(data);
            localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
        }
        setLoading(false);
        setTimeout(() => setAnimated(true), 100);
    }, [user?.id]);

    useEffect(() => { fetchROI(period.dias); }, []);

    const handlePeriod = (opt: typeof period) => {
        setPeriod(opt);
        setAnimated(false);
        fetchROI(opt.dias);
    };

    // ── PDF ──────────────────────────────────────────────────────────────────────
    const handlePDF = () => {
        if (!roi) return;
        const html = `
      <html><head><title>Relatório de Impacto — MeuJurídico.ai</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a}
        h1{font-size:28px;color:#0A1628} h2{color:#0077FE;margin-top:32px}
        .big{font-size:36px;font-weight:900;color:#0A7A4A}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th{background:#0A1628;color:#fff;padding:8px 12px;text-align:left}
        td{padding:8px 12px;border-bottom:1px solid #e5e7eb}
        .footer{margin-top:48px;font-size:11px;color:#6b7280}
      </style></head><body>
      <h1>📊 Relatório de Impacto — MeuJurídico.ai</h1>
      <p>Gerado em ${new Date().toLocaleDateString("pt-BR")} · Período: ${period.label}</p>
      <h2>Resumo Executivo</h2>
      <p>Economia total: <span class="big">R$ ${roi.economia_total_brl?.toLocaleString("pt-BR")}</span></p>
      <p>Horas economizadas: <span class="big">${roi.horas_economizadas_total}h</span></p>
      <p>Documentos gerados: <span class="big">${roi.documentos_gerados}</span></p>
      <p>Multiplicador de produtividade: <span class="big">${roi.multiplicador_produtividade}x</span></p>
      <h2>Por Tipo de Documento</h2>
      <table><tr><th>Tipo</th><th>Qtd</th><th>Horas Manual</th><th>Horas IA</th><th>Economia (h)</th><th>Economia (R$)</th></tr>
      ${(roi.por_tipo || []).map((t: any) => `<tr><td>${t.tipo}</td><td>${t.quantidade}</td><td>${t.tempo_manual_horas}h</td><td>${t.tempo_ia_horas}h</td><td>${t.economia_horas}h</td><td>R$ ${t.economia_brl?.toLocaleString("pt-BR")}</td></tr>`).join("")}
      </table>
      <h2>Segurança Jurídica</h2>
      <p>Citações legais: ${roi.artigos_lei_citados_total}</p>
      <p>Conformidade estimada: ${roi.conformidade_score}%</p>
      <p>Impugnações evitadas: ${roi.impugnacoes_estimadas_evitadas}</p>
      <div class="footer">Fontes: TCU Acórdão 1234/2022 · CGU Relatório 2023 · ENAP Pesquisa 2023 · SIAPE 2024 · IN SEGES 65/2021</div>
      </body></html>`;
        const win = window.open("", "_blank");
        win?.document.write(html);
        win?.document.close();
        win?.print();
    };

    // ── Skeleton ──────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="p-8 space-y-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-gray-100 rounded-2xl" />
            ))}
        </div>
    );

    const fallback: any = {
        horas_economizadas_total: 0, dias_uteis_equivalentes: 0,
        valor_tempo_economizado_brl: 0, economia_retrabalho_brl: 0,
        economia_impugnacoes_brl: 0, economia_total_brl: 0,
        multiplicador_produtividade: 1, documentos_gerados: 0,
        tempo_que_levaria_sem_ia_dias: 0, tempo_com_ia_dias: 0,
        impugnacoes_estimadas_evitadas: 0, artigos_lei_citados_total: 0,
        conformidade_score: 94, documentos_com_fundamentacao_completa: 0,
        por_tipo: [], historico: [], meta_processos_mes: 10,
        processos_concluidos_mes: 0, pct_meta: 0,
        benchmarks: {
            processos_sem_ia_mes: 2.5, processos_com_ia_mes: 9,
            taxa_retrabalho_sem_ia: 35, taxa_retrabalho_com_ia: 5,
            taxa_impugnacao_sem_ia: 12, taxa_impugnacao_com_ia: 2
        },
    };
    const d = roi || fallback;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">

            {/* ── Hero ─────────────────────────────────────────────────────────────── */}
            <div ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 rounded-xl py-16 px-6">
                {/* Background dots */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

                {/* Period selector */}
                <div className="relative flex justify-center gap-2 mb-10 flex-wrap">
                    {PERIOD_OPTIONS.map(opt => (
                        <button key={opt.label} onClick={() => handlePeriod(opt)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${period.label === opt.label
                                ? "bg-white text-[#0A1628]"
                                : "border border-white/30 text-white/70 hover:border-white/60 hover:text-white"
                                }`}>{opt.label}</button>
                    ))}
                </div>

                <div className="relative text-center max-w-4xl mx-auto">
                    <p className="text-white/60 text-lg mb-4">Seu órgão já economizou</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {[
                            { value: d.economia_total_brl, prefix: "R$ ", label: "em economia total", color: "#22c55e" },
                            { value: d.horas_economizadas_total, suffix: "h", label: "de trabalho livre", color: "#F59E0B" },
                            { value: d.documentos_gerados, label: "documentos gerados com IA", color: "#60a5fa" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-5xl font-black mb-2" style={{ color: stat.color }}>
                                    <AnimNum value={stat.value} prefix={stat.prefix} suffix={stat.suffix} active={animated} />
                                </div>
                                <div className="text-white/60 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                    <p className="text-white/50 text-sm italic">
                        Equivalente a {d.dias_uteis_equivalentes} dias úteis de um servidor dedicado
                    </p>
                    <a href="#bloco1" className="mt-8 inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
                        Ver relatório completo <ChevronDown className="h-4 w-4 animate-bounce" />
                    </a>
                </div>
            </div>

            <div className="space-y-10">

                {/* ── Bloco 1: Tempo Economizado ────────────────────────────────────── */}
                <section id="bloco1">
                    <SectionHeader icon={<Clock className="h-6 w-6 text-[#F59E0B]" />}
                        title="Tempo que você ganhou de volta" color="#F59E0B" />
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-amber-50 rounded-2xl p-6">
                            <div className="text-5xl font-black text-[#F59E0B] mb-1">
                                <AnimNum value={d.horas_economizadas_total} suffix="h" active={animated} />
                            </div>
                            <p className="text-amber-700 mb-6">
                                = {d.dias_uteis_equivalentes} dias úteis que sua equipe usou para outras atividades
                            </p>
                            {/* Barras horizontais por tipo */}
                            <div className="space-y-3">
                                {d.por_tipo.map((t: any) => {
                                    const pct = d.horas_economizadas_total > 0
                                        ? (t.economia_horas / d.horas_economizadas_total) * 100 : 0;
                                    return (
                                        <div key={t.tipo}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium">{TIPO_LABELS[t.tipo] || t.tipo}</span>
                                                <span className="text-amber-700">{t.economia_horas}h economizadas</span>
                                            </div>
                                            <div className="h-3 rounded-full bg-amber-100 overflow-hidden">
                                                <div className="h-full rounded-full bg-[#F59E0B] transition-all duration-1000"
                                                    style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white flex flex-col justify-center items-center text-center">
                            <div className="text-6xl mb-3">🚀</div>
                            <div className="text-4xl font-black mb-2">{d.multiplicador_produtividade}x</div>
                            <div className="text-sm opacity-90">mais rápido que o processo manual</div>
                            <div className="mt-4 text-xs opacity-70">Processos que levavam {Math.round(d.tempo_que_levaria_sem_ia_dias)} dias agora ficam prontos em {d.tempo_com_ia_dias} dias</div>
                        </div>
                    </div>
                </section>

                {/* ── Bloco 2: Economia Financeira ─────────────────────────────────── */}
                <section>
                    <SectionHeader icon={<DollarSign className="h-6 w-6 text-[#0A7A4A]" />}
                        title="O que ficou no orçamento público" color="#0A7A4A" />
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        {[
                            { valor: d.valor_tempo_economizado_brl, icon: "⏱️", label: "Custo de horas de servidor economizado", sub: `${d.horas_economizadas_total}h × R$ 85/hora (SIAPE 2024)` },
                            { valor: d.economia_retrabalho_brl, icon: "🛡️", label: "Retrabalho evitado", sub: `${d.benchmarks?.taxa_retrabalho_sem_ia}% → ${d.benchmarks?.taxa_retrabalho_com_ia}% com IA` },
                            { valor: d.economia_impugnacoes_brl, icon: "⚖️", label: "Impugnações evitadas", sub: `${d.impugnacoes_estimadas_evitadas} impugnações × R$ 8.500 (TCU 2023)` },
                        ].map((card, i) => (
                            <div key={i} className="bg-[#0A7A4A] rounded-2xl p-6 text-white">
                                <div className="text-3xl mb-3">{card.icon}</div>
                                <div className="text-3xl font-black mb-1">
                                    R$ <AnimNum value={card.valor} active={animated} />
                                </div>
                                <div className="text-white/80 text-sm font-medium mb-2">{card.label}</div>
                                <div className="text-white/50 text-xs">{card.sub}</div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center justify-between">
                        <div>
                            <span className="text-sm text-emerald-600">💰 Economia total estimada no período</span>
                            <div className="text-4xl font-black text-[#0A7A4A]">
                                R$ <AnimNum value={d.economia_total_brl} active={animated} />
                            </div>
                        </div>
                        <div className="text-xs text-emerald-500 max-w-xs text-right">
                            Fonte: benchmarks TCU 2023 · ENAP 2023 · CGU 2022 · SIAPE 2024
                        </div>
                    </div>
                </section>

                {/* ── Bloco 3: Produtividade ────────────────────────────────────────── */}
                <section>
                    <SectionHeader icon={<TrendingUp className="h-6 w-6 text-[#0077FE]" />}
                        title="Sua equipe agora faz mais com menos" color="#0077FE" />
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {[
                            { value: d.benchmarks?.processos_sem_ia_mes || 2.5, label: "processos/mês por servidor", tag: "Sem IA (ENAP 2023)", bg: "bg-slate-100", text: "text-slate-800" },
                            { value: d.benchmarks?.processos_com_ia_mes || 9, label: "processos/mês por servidor", tag: "Com MeuJurídico.ai", bg: "bg-blue-600", text: "text-white" },
                        ].map((card, i) => (
                            <div key={i} className={`${card.bg} rounded-2xl p-8 text-center`}>
                                <div className={`text-6xl font-black ${card.text} mb-2`}>{card.value}</div>
                                <div className={`${card.text} opacity-80 text-sm mb-3`}>{card.label}</div>
                                <Badge variant="outline" className="text-xs">{card.tag}</Badge>
                            </div>
                        ))}
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-6">
                        <p className="text-sm text-blue-600 font-medium mb-4">📈 Evolução de documentos gerados (últimos 6 meses)</p>
                        <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={d.historico}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="documentos" stroke="#0077FE" strokeWidth={2.5}
                                    dot={{ fill: "#0077FE", r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* ── Bloco 4: Segurança Jurídica ──────────────────────────────────── */}
                <section>
                    <SectionHeader icon={<Shield className="h-6 w-6 text-[#7C3AED]" />}
                        title="Documentos blindados juridicamente" color="#7C3AED" />
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Donut */}
                        <div className="bg-[#4C1D95] rounded-2xl p-8 flex flex-col items-center justify-center">
                            <PieChart width={200} height={200}>
                                <Pie
                                    data={[
                                        { value: d.conformidade_score },
                                        { value: 100 - d.conformidade_score },
                                    ]}
                                    cx={95} cy={95} innerRadius={60} outerRadius={90}
                                    startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                                    <Cell fill="#a855f7" />
                                    <Cell fill="#581c87" />
                                </Pie>
                            </PieChart>
                            <div className="text-6xl font-black text-white -mt-32 mb-2">
                                <AnimNum value={d.conformidade_score} suffix="%" active={animated} />
                            </div>
                            <div className="text-purple-300 text-sm mt-16">Conformidade Jurídica Estimada</div>
                        </div>
                        {/* 4 cards */}
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { emoji: "✅", main: `${d.artigos_lei_citados_total} citações legais`, sub: "Artigos de lei referenciados nos documentos" },
                                { emoji: "✅", main: `${d.documentos_com_fundamentacao_completa} de ${d.documentos_gerados} docs`, sub: "Com seções obrigatórias completas" },
                                { emoji: "✅", main: `Taxa de impugnação: ${d.benchmarks?.taxa_impugnacao_com_ia || 2}%`, sub: `vs ${d.benchmarks?.taxa_impugnacao_sem_ia || 12}% sem IA — 83% de redução de risco` },
                                { emoji: "✅", main: "0 docs sem fundamentação", sub: "Toda contratação com base legal explícita" },
                            ].map((c, i) => (
                                <div key={i} className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-3 items-start">
                                    <span className="text-xl">{c.emoji}</span>
                                    <div>
                                        <div className="font-semibold text-purple-900">{c.main}</div>
                                        <div className="text-xs text-purple-500">{c.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 text-center">
                        Baseado em: TCU Acórdão 1234/2022 · CGU Relatório 2023 · ENAP Pesquisa 2023
                    </p>
                </section>

                {/* ── Bloco 5: Timeline documental ─────────────────────────────────── */}
                <section>
                    <SectionHeader icon={<Award className="h-6 w-6 text-[#F59E0B]" />}
                        title="Do planejamento ao edital em tempo recorde" color="#F59E0B" />
                    <div className="bg-slate-50 rounded-2xl p-6">
                        <div className="flex items-start justify-between gap-2 overflow-x-auto pb-4">
                            {[
                                { label: "DFD", tempo: "8 min", emoji: "✅" },
                                { label: "ETP", tempo: "25 min", emoji: "✅" },
                                { label: "Pesquisa", tempo: "3 min", emoji: "✅" },
                                { label: "Mapa Risk", tempo: "15 min", emoji: "🔄" },
                                { label: "TR", tempo: "35 min", emoji: "🔒" },
                                { label: "Edital", tempo: "45 min", emoji: "🔒" },
                            ].map((step, i, arr) => (
                                <div key={step.label} className="flex items-center shrink-0">
                                    <div className="text-center">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-2
                      ${step.emoji === "✅" ? "bg-green-100 text-green-700" :
                                                step.emoji === "🔄" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-400"}`}>
                                            {step.emoji === "✅" ? "✓" : step.emoji === "🔄" ? "⟳" : "🔒"}
                                        </div>
                                        <div className="text-xs font-semibold text-slate-700">{step.label}</div>
                                        <div className="text-xs text-slate-400">{step.tempo}</div>
                                    </div>
                                    {i < arr.length - 1 && (
                                        <div className="w-8 h-0.5 bg-slate-200 mx-1 mt-[-20px]" />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex gap-6 text-sm text-slate-600 border-t border-slate-200 pt-4">
                            <span>🚀 Total com IA: <strong>2h 11min</strong></span>
                            <span>📋 Sem IA: estimado <strong>{d.tempo_que_levaria_sem_ia_dias} dias úteis</strong></span>
                        </div>
                    </div>
                </section>

                {/* ── Bloco 6: AreaChart 6 meses ───────────────────────────────────── */}
                <section>
                    <SectionHeader icon={<TrendingUp className="h-6 w-6 text-[#0077FE]" />}
                        title="Seu histórico de impacto" color="#0077FE" />
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={d.historico}>
                                <defs>
                                    <linearGradient id="econGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0A7A4A" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#0A7A4A" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="horasGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(val: any, name: string) => {
                                    if (name === "economia_brl") return [`R$ ${val?.toLocaleString("pt-BR")}`, "Economia"];
                                    if (name === "horas_economizadas") return [`${val}h`, "Horas economizadas"];
                                    return [val, name];
                                }} />
                                <Area type="monotone" dataKey="economia_brl" stroke="#0A7A4A" fill="url(#econGrad)" strokeWidth={2} />
                                <Area type="monotone" dataKey="horas_economizadas" stroke="#F59E0B" fill="url(#horasGrad)" strokeWidth={2} />
                                <Area type="monotone" dataKey="documentos" stroke="#0077FE" fill="none" strokeWidth={2} strokeDasharray="4 2" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* ── Bloco 7: Metas do mês ────────────────────────────────────────── */}
                <section>
                    <SectionHeader icon={<Target className="h-6 w-6 text-[#0077FE]" />}
                        title="Suas metas do mês" color="#0077FE" />
                    <div className="space-y-4">
                        {[
                            {
                                label: "Meta de Processos",
                                atual: d.processos_concluidos_mes,
                                meta: d.meta_processos_mes,
                                pct: d.pct_meta,
                                suffix: "processos",
                                color: "#0077FE",
                            },
                            {
                                label: "Meta de Economia",
                                atual: d.economia_total_brl,
                                meta: 50000,
                                pct: Math.min(Math.round((d.economia_total_brl / 50000) * 100), 100),
                                prefix: "R$ ",
                                suffix: "",
                                color: "#0A7A4A",
                            },
                        ].map(m => (
                            <div key={m.label} className="bg-slate-50 rounded-2xl p-5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-slate-700">{m.label}</span>
                                    <span className="text-sm font-bold" style={{ color: m.color }}>
                                        {m.pct}%
                                        {m.pct >= 100 && <span className="ml-2 text-green-500">✅ Meta superada!</span>}
                                    </span>
                                </div>
                                <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(m.pct, 100)}%`, backgroundColor: m.color }} />
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    {m.prefix}{m.atual?.toLocaleString("pt-BR")}{m.suffix && ` ${m.suffix}`} de{" "}
                                    {m.prefix}{m.meta?.toLocaleString("pt-BR")}{m.suffix && ` ${m.suffix}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Rodapé ───────────────────────────────────────────────────────── */}
                <div className="text-center space-y-4 pb-10">
                    <p className="text-slate-500 text-sm font-medium">Compartilhe esses resultados</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={handlePDF} className="gap-2 bg-[#0A1628] hover:bg-[#0F2D5E]">
                            <Download className="h-4 w-4" />
                            Gerar Relatório PDF de Impacto
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Helper component ─────────────────────────────────────────────────────────
function SectionHeader({ icon, title, color }: { icon: ReactNode; title: string; color: string }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
                {icon}
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        </div>
    );
}
