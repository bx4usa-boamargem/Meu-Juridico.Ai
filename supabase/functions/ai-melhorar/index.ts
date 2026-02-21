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
    const { field_label, field_value, document_type, section_label, dados_estruturados, processo_context } =
      await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!field_value || field_value.trim().length === 0) {
      return new Response(
        JSON.stringify({ improved_text: "", error: "Campo vazio, nada para melhorar." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context summary
    const contextParts: string[] = [];
    if (processo_context) {
      if (processo_context.numero_processo) contextParts.push(`Processo: ${processo_context.numero_processo}`);
      if (processo_context.orgao) contextParts.push(`Órgão: ${processo_context.orgao}`);
      if (processo_context.objeto) contextParts.push(`Objeto: ${processo_context.objeto}`);
      if (processo_context.modalidade) contextParts.push(`Modalidade: ${processo_context.modalidade}`);
    }

    // Include other filled fields for context
    const otherFields: string[] = [];
    if (dados_estruturados) {
      for (const [k, v] of Object.entries(dados_estruturados)) {
        if (k !== field_label && v && typeof v === "string" && v.trim().length > 0) {
          otherFields.push(`${k}: ${String(v).substring(0, 200)}`);
        }
      }
    }

    const systemPrompt = `Você é um especialista em licitações públicas brasileiras, com profundo conhecimento da Lei 14.133/2021 (Nova Lei de Licitações).

Seu papel é melhorar textos de documentos de licitação, mantendo:
- Linguagem formal e jurídica apropriada
- Conformidade com a legislação vigente
- Clareza e objetividade
- Termos técnicos corretos

Contexto do processo:
${contextParts.join("\n")}

Tipo de documento: ${document_type}
Seção: ${section_label}

Outros campos já preenchidos:
${otherFields.slice(0, 10).join("\n")}

Retorne APENAS o texto melhorado, sem explicações adicionais.`;

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
          {
            role: "user",
            content: `Melhore o seguinte texto do campo "${field_label}":\n\n${field_value}`,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", status: 429 }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required", status: 402 }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", status, errorText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const improvedText = result.choices?.[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({ improved_text: improvedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-melhorar error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
