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
    const { objeto, orgao } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!objeto || objeto.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Objeto é obrigatório." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um especialista em contratações públicas brasileiras conforme a Lei 14.133/2021.

Analise o objeto da contratação fornecido e retorne uma avaliação no seguinte formato JSON:

{
  "status": "ok" ou "atencao",
  "alertas": ["lista de alertas identificados"],
  "recomendacao": "texto com recomendação geral"
}

Analise:
1. Clareza e especificidade da descrição do objeto
2. Risco de direcionamento (marca específica, fornecedor único)
3. Categoria provável (Bens, Serviços, Obras, Serviços de Engenharia)
4. Modalidade de licitação sugerida

Órgão: ${orgao || "Não informado"}

RETORNE APENAS o JSON válido, sem markdown.`;

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
          { role: "user", content: `Analise este objeto de contratação:\n\n${objeto}` },
        ],
        stream: false,
        tools: [
          {
            type: "function",
            function: {
              name: "validar_objeto",
              description: "Retorna a validação do objeto da contratação",
              parameters: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["ok", "atencao"] },
                  alertas: { type: "array", items: { type: "string" } },
                  recomendacao: { type: "string" },
                },
                required: ["status", "alertas", "recomendacao"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "validar_objeto" } },
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
    
    // Extract from tool call
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse from content
    const content = result.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(
        JSON.stringify({ status: "ok", alertas: [], recomendacao: content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("ai-validar-objeto error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
