import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRIMARY_MODEL = "google/gemini-3-flash-preview";

interface PriceItem {
  orgao: string;
  estado: string;
  data: string;
  valor_unitario: number;
  unidade: string;
  fonte: string;
  url: string | null;
  is_outlier: boolean;
}

function generateMockPrices(objeto: string, estado: string | null, periodo: string): PriceItem[] {
  // Generate realistic mock data based on the object type
  const basePrice = objeto.length * 12.5 + 500;
  const states = estado ? [estado] : ["SP", "RJ", "MG", "PR", "SC", "BA", "RS", "GO"];
  const orgaos = [
    "Prefeitura Municipal", "Secretaria de Saúde", "Secretaria de Educação",
    "IFSP", "UFMG", "Tribunal de Justiça", "Câmara Municipal",
    "Ministério da Saúde", "ANVISA", "IBAMA", "Polícia Federal",
    "Secretaria de Administração", "Hospital Universitário",
  ];
  const fontes = ["PNCP", "Painel de Preços", "ComprasNet"];

  const monthsBack = periodo === "3m" ? 3 : periodo === "12m" ? 12 : 6;
  const count = 8 + Math.floor(Math.random() * 12);
  const items: PriceItem[] = [];

  for (let i = 0; i < count; i++) {
    const variation = 0.6 + Math.random() * 0.8;
    const isOutlier = Math.random() < 0.15;
    const outlierMultiplier = isOutlier ? (Math.random() > 0.5 ? 2.5 : 0.3) : 1;
    const price = Math.round(basePrice * variation * outlierMultiplier * 100) / 100;

    const daysAgo = Math.floor(Math.random() * monthsBack * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const st = states[Math.floor(Math.random() * states.length)];
    items.push({
      orgao: `${orgaos[Math.floor(Math.random() * orgaos.length)]} - ${st}`,
      estado: st,
      data: date.toISOString().split("T")[0],
      valor_unitario: price,
      unidade: "mensal",
      fonte: fontes[Math.floor(Math.random() * fontes.length)],
      url: `https://pncp.gov.br/app/contratos/${Math.random().toString(36).slice(2, 10)}`,
      is_outlier: false,
    });
  }

  // Calculate outliers using 2σ method
  const values = items.map(i => i.valor_unitario);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
  const lowerBound = mean - 2 * stdDev;
  const upperBound = mean + 2 * stdDev;

  for (const item of items) {
    if (item.valor_unitario < lowerBound || item.valor_unitario > upperBound) {
      item.is_outlier = true;
    }
  }

  return items.sort((a, b) => b.data.localeCompare(a.data));
}

function calculateStats(items: PriceItem[]) {
  const validItems = items.filter(i => !i.is_outlier);
  const values = validItems.map(i => i.valor_unitario).sort((a, b) => a - b);

  if (values.length === 0) return { menor: 0, mediana: 0, maior: 0, total: 0, outliers: 0 };

  const mediana = values.length % 2 === 0
    ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
    : values[Math.floor(values.length / 2)];

  return {
    menor: values[0],
    mediana: Math.round(mediana * 100) / 100,
    maior: values[values.length - 1],
    total: items.length,
    outliers: items.filter(i => i.is_outlier).length,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { objeto, estado, municipio, periodo, unidade_medida, processo_id } = await req.json();

    if (!objeto || objeto.length < 3) {
      return new Response(JSON.stringify({ error: "Objeto muito curto" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Generate price data (in production, this would query PNCP/Painel de Preços APIs)
    const items = generateMockPrices(objeto, estado, periodo ?? "6m");
    const stats = calculateStats(items);

    // AI analysis
    const analysisPrompt = `Você é um especialista em contratações públicas brasileiras.

Analise os seguintes dados de pesquisa de preços de mercado e forneça uma análise concisa:

Objeto: ${objeto}
Estado: ${estado ?? "Nacional"}
Período: ${periodo ?? "6 meses"}
Menor preço (saneado): R$ ${stats.menor.toFixed(2)}
Mediana (saneada): R$ ${stats.mediana.toFixed(2)}
Maior preço (saneado): R$ ${stats.maior.toFixed(2)}
Total de fontes: ${stats.total}
Outliers removidos: ${stats.outliers}

Forneça uma análise de mercado em 3-4 parágrafos cobrindo:
1. Variação de preços e o que indica sobre o mercado
2. Recomendação de preço de referência (mediana saneada) com justificativa
3. Riscos e pontos de atenção para o gestor
4. Conformidade com IN SEGES 65/2021

Seja objetivo e use linguagem técnica.`;

    let analise_ia = "";
    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: PRIMARY_MODEL,
          messages: [
            { role: "system", content: "Você é um consultor especialista em licitações públicas brasileiras." },
            { role: "user", content: analysisPrompt },
          ],
          stream: false,
        }),
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        analise_ia = aiData.choices?.[0]?.message?.content ?? "";
      }
    } catch (e) {
      console.warn("AI analysis failed:", e);
      analise_ia = `Com base nos ${stats.total} contratos analisados, o preço de referência sugerido é R$ ${stats.mediana.toFixed(2)} (mediana saneada), conforme metodologia da IN SEGES 65/2021. Foram removidos ${stats.outliers} outliers por desvio superior a 2σ.`;
    }

    // Save to database if processo_id provided
    if (processo_id) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get user from auth header
        const authHeader = req.headers.get("Authorization");
        if (authHeader) {
          const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } });
          const { data: claims } = await anonClient.auth.getUser();
          if (claims?.user?.id) {
            await supabase.from("price_references").insert({
              processo_id,
              objeto,
              estado,
              municipio,
              periodo: periodo ?? "6m",
              unidade_medida,
              resultados: items as any,
              estatisticas: stats as any,
              analise_ia,
              outliers_removidos: stats.outliers,
              preco_referencia: stats.mediana,
              created_by: claims.user.id,
            });
          }
        }
      } catch (e) {
        console.warn("Failed to save price reference:", e);
      }
    }

    return new Response(JSON.stringify({
      resultados: items,
      estatisticas: stats,
      analise_ia,
      preco_referencia: stats.mediana,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("price-research error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
