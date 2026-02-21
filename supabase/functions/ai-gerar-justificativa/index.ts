import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { objeto, contexto_contratacao, orgao } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!objeto || objeto.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Objeto da contratação é obrigatório." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contextParts: string[] = [];
    if (orgao) contextParts.push(`Órgão: ${orgao}`);
    if (contexto_contratacao) {
      for (const [k, v] of Object.entries(contexto_contratacao)) {
        if (v && typeof v === "string" && v.trim().length > 0) {
          contextParts.push(`${k.replace(/_/g, " ")}: ${v}`);
        }
      }
    }

    const systemPrompt = `Você é um especialista em contratações públicas brasileiras conforme a Lei 14.133/2021 (Nova Lei de Licitações e Contratos Administrativos).

Gere uma justificativa técnica formal para a contratação descrita, seguindo estas diretrizes:
- Linguagem formal e jurídica
- Referência à legislação vigente (Lei 14.133/2021)
- Alinhamento com o interesse público
- Fundamentação da necessidade
- Clareza e objetividade

Contexto administrativo:
${contextParts.join("\n")}

Retorne APENAS o texto da justificativa, sem títulos ou explicações adicionais.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Gere a justificativa de contratação para o seguinte objeto:\n\n${objeto}` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded", status: 429 }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required", status: 402 }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", status, errorText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const justificativaText = result.choices?.[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({ justificativa_text: justificativaText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-gerar-justificativa error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
