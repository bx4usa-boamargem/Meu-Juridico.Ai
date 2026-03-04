import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRIMARY_MODEL = "google/gemini-3-flash-preview";

interface RiskItem {
  id: number;
  categoria: string;
  descricao: string;
  probabilidade: string;
  impacto: string;
  nivel: string;
  responsavel: string;
  mitigacao: string;
  base_legal: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { objeto, doc_type, valor_estimado, modalidade, processo_id } = await req.json();

    if (!objeto || objeto.length < 3) {
      return new Response(JSON.stringify({ error: "Objeto muito curto" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Você é um especialista em gestão de riscos em contratações públicas brasileiras (Lei 14.133/2021).

Gere uma matriz de riscos completa para a seguinte contratação:

Objeto: ${objeto}
Modalidade: ${modalidade ?? "Pregão Eletrônico"}
Valor estimado: ${valor_estimado ?? "Não informado"}
Tipo de documento base: ${doc_type ?? "tr"}

Gere entre 8 e 12 riscos cobrindo as seguintes categorias:
- Jurídico/Legal
- Operacional
- Financeiro/Orçamentário
- Técnico
- Mercado/Fornecedor
- Compliance/Controle

Para cada risco, forneça:
- categoria (uma das acima)
- descricao (descrição clara do risco)
- probabilidade: "Alta", "Média" ou "Baixa"
- impacto: "Alto", "Médio" ou "Baixo"
- nivel: "Crítico" (alta prob + alto impacto), "Alto", "Médio" ou "Baixo"
- responsavel (cargo genérico do responsável pela mitigação)
- mitigacao (ação concreta de mitigação)
- base_legal (artigo da Lei 14.133/2021, jurisprudência TCU ou outra norma)

Também gere um resumo_executivo (2-3 parágrafos) com a análise geral dos riscos.

Responda SOMENTE em JSON válido no formato:
{
  "riscos": [...],
  "resumo_executivo": "..."
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages: [
          { role: "system", content: "Você é um consultor especialista em gestão de riscos para licitações públicas brasileiras. Responda sempre em JSON válido." },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!aiRes.ok) throw new Error(`AI request failed: ${aiRes.status}`);

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response (handle markdown code blocks)
    let parsed: { riscos: RiskItem[]; resumo_executivo: string };
    try {
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)```/) || rawContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawContent;
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      parsed = {
        riscos: [{
          id: 1, categoria: "Operacional", descricao: "Risco genérico identificado",
          probabilidade: "Média", impacto: "Médio", nivel: "Médio",
          responsavel: "Gestor do contrato", mitigacao: "Monitoramento contínuo",
          base_legal: "Art. 22 §3º Lei 14.133/2021"
        }],
        resumo_executivo: "Análise de riscos gerada para a contratação."
      };
    }

    // Number the risks
    parsed.riscos = parsed.riscos.map((r, i) => ({ ...r, id: i + 1 }));

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("risk-map error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
