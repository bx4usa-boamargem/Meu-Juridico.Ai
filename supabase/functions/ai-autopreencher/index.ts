import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRIMARY_MODEL = "google/gemini-2.5-flash";
const FALLBACK_MODEL = "google/gemini-2.5-pro";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { objeto_contratacao, doc_type, processo_dados } = await req.json();

    if (!objeto_contratacao || objeto_contratacao.length < 10) {
      return new Response(
        JSON.stringify({ error: "Objeto da contratação muito curto" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const orgao = processo_dados?.orgao ?? "não informado";
    const modalidade = processo_dados?.modalidade ?? "a definir";

    const systemPrompt = `Você é um especialista em licitações públicas da Lei 14.133/2021.

Com base no objeto de contratação abaixo, preencha todos os campos
do ${doc_type ?? "dfd"} que for possível inferir. Retorne APENAS um JSON válido,
sem texto adicional, sem markdown, sem explicações.

Objeto da contratação: "${objeto_contratacao}"
Órgão: "${orgao}"
Modalidade: "${modalidade}"

Preencha os seguintes campos (deixe null se não for possível inferir):
{
  "problema_publico": string | null,
  "impacto_esperado": string | null,
  "publico_beneficiado": string | null,
  "justificativa_necessidade": string | null,
  "fundamento_legal": string | null,
  "alinhamento_estrategico": string | null,
  "beneficios_esperados": string | null,
  "descricao_objeto_expandida": string | null,
  "prazo_estimado_dias": number | null,
  "categoria_objeto": "bens" | "serviços" | "obras" | null,
  "modalidade_sugerida": string | null,
  "campos_nao_preenchidos": string[]
}

Regras:
- Use linguagem técnica da administração pública brasileira
- Cite a Lei 14.133/2021 no fundamento_legal
- Em campos_nao_preenchidos liste os campos que só o usuário sabe
- NÃO invente valores estimados se não tiver base para inferir
- Retorne APENAS o JSON, sem nenhum texto fora dele`;

    const callAI = async (model: string) => {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Preencha os campos para o objeto: "${objeto_contratacao}"` },
          ],
          stream: false,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error(`AI error (${model}):`, res.status, t);
        return null;
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? null;
    };

    let rawText = await callAI(PRIMARY_MODEL);
    if (!rawText) {
      console.log(`Fallback: ${PRIMARY_MODEL} → ${FALLBACK_MODEL}`);
      rawText = await callAI(FALLBACK_MODEL);
    }

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "Falha ao gerar preenchimento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean markdown fences if present
    const cleaned = rawText
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", cleaned.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Resposta da IA não é JSON válido" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Separate filled vs unfilled
    const camposNaoPreenchidos = parsed.campos_nao_preenchidos ?? [];
    delete parsed.campos_nao_preenchidos;

    const camposPreenchidos: Record<string, any> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== null && value !== undefined && value !== "") {
        camposPreenchidos[key] = value;
      }
    }

    // Estimate confidence based on how many fields were filled
    const totalFields = Object.keys(parsed).length;
    const filledCount = Object.keys(camposPreenchidos).length;
    const ratio = totalFields > 0 ? filledCount / totalFields : 0;
    const confianca = ratio > 0.7 ? "alta" : ratio > 0.4 ? "media" : "baixa";

    return new Response(
      JSON.stringify({
        campos_preenchidos: camposPreenchidos,
        campos_nao_preenchidos: camposNaoPreenchidos,
        confianca,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-autopreencher error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
