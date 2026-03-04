import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // 1. Check config
    const { data: config, error: configError } = await supabase
      .from("monitoring_config")
      .select("*")
      .limit(1)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: "Monitoramento não configurado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!config.is_active) {
      return new Response(
        JSON.stringify({ message: "Monitoramento está pausado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check cost limit
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();

    const { data: runs } = await supabase
      .from("monitoring_runs")
      .select("estimated_cost_usd")
      .gte("started_at", startOfMonth);

    const currentCost =
      runs?.reduce((sum, r) => sum + (Number(r.estimated_cost_usd) ?? 0), 0) ??
      0;

    if (currentCost >= config.cost_limit_usd) {
      return new Response(
        JSON.stringify({
          error: "Limite de custo mensal atingido",
          current: currentCost,
          limit: config.cost_limit_usd,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Create run record
    const { data: run, error: runError } = await supabase
      .from("monitoring_runs")
      .insert({ status: "running" })
      .select()
      .single();

    if (runError) throw runError;

    let itemsCollected = 0;
    let itemsFilteredOut = 0;
    let itemsAnalyzedLight = 0;
    let itemsAnalyzedDeep = 0;
    let alertsGenerated = 0;
    let estimatedCost = 0;

    // 4. Collect from sources (simulated for now — real APIs would be called here)
    const sources = ["TCU", "CGU", "PNCP"];
    const mockItems = [
      {
        source: "TCU",
        title: "Acórdão 1234/2025 — Nova orientação sobre pesquisa de preços",
        summary:
          "O TCU reforçou a necessidade de consulta a no mínimo 3 fontes distintas para composição de preços em contratações diretas.",
        url: "https://pesquisa.apps.tcu.gov.br/",
      },
      {
        source: "CGU",
        title: "Nota Técnica CGU sobre sustentabilidade em licitações",
        summary:
          "A CGU publicou orientação sobre critérios de sustentabilidade obrigatórios em termos de referência acima de R$ 500 mil.",
        url: "https://www.gov.br/cgu/",
      },
    ];

    itemsCollected = mockItems.length;

    // 5. Light filter with AI (Gemini Flash)
    if (lovableApiKey && mockItems.length > 0) {
      try {
        const filterPrompt = `Analise os seguintes itens normativos e classifique cada um como "relevante" ou "irrelevante" para licitações públicas brasileiras sob a Lei 14.133/2021. Responda em JSON: [{\\"index\\": 0, \\"relevant\\": true/false}, ...]

Itens:
${mockItems.map((item, i) => `${i}. [${item.source}] ${item.title}: ${item.summary}`).join("\n")}`;

        const filterRes = await fetch(
          "https://api.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [{ role: "user", content: filterPrompt }],
              temperature: 0.1,
            }),
          }
        );

        if (filterRes.ok) {
          const filterData = await filterRes.json();
          itemsAnalyzedLight = mockItems.length;
          estimatedCost += 0.001;
          // For now, keep all items as relevant
        }
      } catch (e) {
        console.error("Light filter error:", e);
      }
    }

    // 6. Deep analysis with AI (stronger model)
    for (const item of mockItems) {
      if (!lovableApiKey) break;

      try {
        const analysisPrompt = `Você é um especialista em licitações públicas brasileiras (Lei 14.133/2021).

Analise o seguinte item normativo e gere uma análise de impacto:

Fonte: ${item.source}
Título: ${item.title}
Resumo: ${item.summary}

Responda em JSON com:
{
  "severity": "low|medium|high|critical",
  "impact_analysis": "Análise detalhada do impacto...",
  "affected_doc_types": ["DFD", "ETP", "TR", etc.],
  "is_relevant": true/false
}`;

        const analysisRes = await fetch(
          "https://api.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "user", content: analysisPrompt }],
              temperature: 0.2,
            }),
          }
        );

        if (analysisRes.ok) {
          const analysisData = await analysisRes.json();
          const content =
            analysisData.choices?.[0]?.message?.content ?? "";
          itemsAnalyzedDeep++;
          estimatedCost += 0.005;

          // Parse AI response
          let parsed;
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
          } catch {
            parsed = {
              severity: "medium",
              impact_analysis: content,
              affected_doc_types: ["TR", "ETP"],
              is_relevant: true,
            };
          }

          if (parsed?.is_relevant) {
            const { error: alertError } = await supabase
              .from("monitoring_alerts")
              .insert({
                source: item.source,
                source_url: item.url,
                title: item.title,
                summary: item.summary,
                impact_analysis: parsed.impact_analysis,
                affected_doc_types: parsed.affected_doc_types ?? [],
                severity: parsed.severity ?? "medium",
                is_relevant: true,
              });

            if (!alertError) alertsGenerated++;
          } else {
            itemsFilteredOut++;
          }
        }
      } catch (e) {
        console.error("Deep analysis error:", e);
      }
    }

    // 7. Update run record
    await supabase
      .from("monitoring_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        items_collected: itemsCollected,
        items_filtered_out: itemsFilteredOut,
        items_analyzed_light: itemsAnalyzedLight,
        items_analyzed_deep: itemsAnalyzedDeep,
        alerts_generated: alertsGenerated,
        estimated_cost_usd: estimatedCost,
      })
      .eq("id", run.id);

    // 8. Update config timestamps
    const nextRun = new Date();
    if (config.frequency === "daily") nextRun.setDate(nextRun.getDate() + 1);
    else if (config.frequency === "weekly")
      nextRun.setDate(nextRun.getDate() + 7);
    else nextRun.setMonth(nextRun.getMonth() + 1);

    await supabase
      .from("monitoring_config")
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: nextRun.toISOString(),
      })
      .eq("id", config.id);

    return new Response(
      JSON.stringify({
        success: true,
        run_id: run.id,
        items_collected: itemsCollected,
        alerts_generated: alertsGenerated,
        estimated_cost: estimatedCost,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Monitoring agent error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
