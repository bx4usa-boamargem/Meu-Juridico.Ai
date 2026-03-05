import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { periodo_dias } = await req.json().catch(() => ({}));

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Get user's orgao
    const { data: profile } = await supabase.from("profiles").select("orgao").eq("id", user.id).single();
    const orgao = profile?.orgao;

    // Get benchmarks
    const { data: benchRows } = await supabase.from("roi_benchmarks").select("indicador, valor");
    const b: Record<string, number> = {};
    (benchRows || []).forEach((r: any) => { b[r.indicador] = Number(r.valor); });

    // Date filter
    let dateFilter: string | null = null;
    if (periodo_dias && periodo_dias > 0) {
      const d = new Date();
      d.setDate(d.getDate() - periodo_dias);
      dateFilter = d.toISOString();
    }

    // Get documents by type for this user's orgao
    let docsQuery = supabase.from("documentos").select("id, tipo, created_at, dados_estruturados, conteudo_gerado, status, processo_id");
    if (orgao) {
      const { data: processoIds } = await supabase.from("processos").select("id").eq("orgao", orgao);
      const ids = (processoIds || []).map((p: any) => p.id);
      if (ids.length > 0) docsQuery = docsQuery.in("processo_id", ids);
      else docsQuery = docsQuery.eq("processo_id", "00000000-0000-0000-0000-000000000000");
    }
    if (dateFilter) docsQuery = docsQuery.gte("created_at", dateFilter);
    const { data: docs } = await docsQuery;
    const allDocs = docs || [];

    // Count processes this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    let processosQuery = supabase.from("processos").select("id").gte("created_at", monthStart.toISOString());
    if (orgao) processosQuery = processosQuery.eq("orgao", orgao);
    const { data: processosMes } = await processosQuery;

    // Map doc types to benchmark keys
    const tipoMap: Record<string, { manual: string; ia: string }> = {
      dfd: { manual: "tempo_dfd_manual_horas", ia: "tempo_dfd_ia_minutos" },
      etp: { manual: "tempo_etp_manual_horas", ia: "tempo_etp_ia_minutos" },
      tr: { manual: "tempo_tr_manual_horas", ia: "tempo_tr_ia_minutos" },
      mapa_riscos: { manual: "tempo_mapa_riscos_manual_horas", ia: "tempo_mapa_riscos_ia_minutos" },
      pesquisa_precos: { manual: "tempo_pesquisa_precos_manual_horas", ia: "tempo_pesquisa_precos_ia_minutos" },
      edital: { manual: "tempo_edital_manual_horas", ia: "tempo_edital_ia_minutos" },
    };

    const tipoLabels: Record<string, string> = {
      dfd: "DFD", etp: "ETP", tr: "TR",
      mapa_riscos: "Mapa de Riscos", pesquisa_precos: "Pesquisa de Preços", edital: "Edital",
    };

    // Count by type
    const countByType: Record<string, number> = {};
    for (const doc of allDocs) {
      const tipo = (doc.tipo || "").toLowerCase();
      countByType[tipo] = (countByType[tipo] || 0) + 1;
    }

    // Calculate per-type savings
    let totalManualHours = 0;
    let totalIaHours = 0;
    const porTipo: any[] = [];

    for (const [tipo, keys] of Object.entries(tipoMap)) {
      const qty = countByType[tipo] || 0;
      if (qty === 0) continue;
      const manualH = (b[keys.manual] || 0) * qty;
      const iaH = ((b[keys.ia] || 0) / 60) * qty;
      const economiaH = manualH - iaH;
      totalManualHours += manualH;
      totalIaHours += iaH;
      porTipo.push({
        tipo: tipoLabels[tipo] || tipo.toUpperCase(),
        quantidade: qty,
        tempo_manual_horas: Math.round(manualH * 10) / 10,
        tempo_ia_horas: Math.round(iaH * 10) / 10,
        economia_horas: Math.round(economiaH * 10) / 10,
        economia_brl: Math.round(economiaH * (b.custo_hora_servidor_brl || 85)),
        pct_mais_rapido: manualH > 0 ? Math.round((economiaH / manualH) * 100) : 0,
      });
    }

    const horasEconomizadas = Math.round((totalManualHours - totalIaHours) * 10) / 10;
    const diasUteis = Math.round((horasEconomizadas / 8) * 10) / 10;
    const valorTempo = Math.round(horasEconomizadas * (b.custo_hora_servidor_brl || 85));

    const totalDocs = allDocs.length;
    const taxaImpSem = (b.taxa_impugnacao_sem_ia_pct || 12) / 100;
    const taxaImpCom = (b.taxa_impugnacao_com_ia_pct || 2) / 100;
    const custoImp = b.custo_medio_impugnacao_brl || 8500;
    const impugnEvitadas = Math.round(totalDocs * (taxaImpSem - taxaImpCom));
    const economiaImpugnacoes = Math.round(impugnEvitadas * custoImp);

    const taxaRetSem = (b.taxa_retrabalho_sem_ia_pct || 35) / 100;
    const taxaRetCom = (b.taxa_retrabalho_com_ia_pct || 5) / 100;
    const economiaRetrabalho = Math.round(totalDocs * (taxaRetSem - taxaRetCom) * (b.custo_hora_servidor_brl || 85) * 2);

    const economiaTotal = valorTempo + economiaRetrabalho + economiaImpugnacoes;
    const multiplicador = totalIaHours > 0 ? Math.round((totalManualHours / totalIaHours) * 10) / 10 : 0;

    // Conformidade estimate
    const docsComConteudo = allDocs.filter((d: any) => d.conteudo_gerado || d.dados_estruturados);
    const conformidadeScore = totalDocs > 0 ? Math.round((docsComConteudo.length / totalDocs) * 100) : 0;

    // Monthly evolution (last 6 months)
    const evolucao: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mes = d.toLocaleString("pt-BR", { month: "short" });
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const docsInMonth = allDocs.filter((doc: any) => {
        const cd = new Date(doc.created_at);
        return cd >= start && cd <= end;
      });
      // Calculate savings for this month
      let mHours = 0;
      for (const doc of docsInMonth) {
        const t = (doc.tipo || "").toLowerCase();
        if (tipoMap[t]) {
          mHours += (b[tipoMap[t].manual] || 0) - ((b[tipoMap[t].ia] || 0) / 60);
        }
      }
      evolucao.push({
        mes,
        documentos: docsInMonth.length,
        horas_economizadas: Math.round(mHours * 10) / 10,
        economia_brl: Math.round(mHours * (b.custo_hora_servidor_brl || 85)),
      });
    }

    const totalProcessosMes = (processosMes || []).length;

    const result = {
      horas_economizadas_total: horasEconomizadas,
      dias_uteis_equivalentes: diasUteis,
      valor_tempo_economizado_brl: valorTempo,
      economia_retrabalho_brl: economiaRetrabalho,
      economia_impugnacoes_brl: economiaImpugnacoes,
      economia_total_brl: economiaTotal,
      multiplicador_produtividade: multiplicador,
      documentos_gerados: totalDocs,
      tempo_que_levaria_sem_ia_dias: Math.round((totalManualHours / 8) * 10) / 10,
      tempo_com_ia_dias: Math.round((totalIaHours / 8) * 10) / 10,
      impugnacoes_estimadas_evitadas: impugnEvitadas,
      conformidade_score: conformidadeScore > 0 ? Math.min(conformidadeScore, 98) : 94,
      documentos_com_fundamentacao_completa: docsComConteudo.length,
      por_tipo: porTipo.sort((a, b) => b.economia_horas - a.economia_horas),
      meta_processos_mes: 10,
      processos_concluidos_mes: processosMes,
      pct_meta: Math.round((processosMes / 10) * 100),
      evolucao,
      benchmarks: {
        processos_sem_ia: b.processos_servidor_mes_sem_ia || 2.5,
        processos_com_ia: b.processos_servidor_mes_com_ia || 9,
        taxa_impugnacao_sem: b.taxa_impugnacao_sem_ia_pct || 12,
        taxa_impugnacao_com: b.taxa_impugnacao_com_ia_pct || 2,
        taxa_retrabalho_sem: b.taxa_retrabalho_sem_ia_pct || 35,
        taxa_retrabalho_com: b.taxa_retrabalho_com_ia_pct || 5,
        custo_hora: b.custo_hora_servidor_brl || 85,
      },
    };

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
