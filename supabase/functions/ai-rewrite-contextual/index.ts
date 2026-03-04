import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRIMARY_MODEL = "google/gemini-3-pro-preview";
const FALLBACK_MODEL = "google/gemini-2.5-pro";
const PROMPT_VERSION = "v1";

const ACTION_PROMPTS: Record<string, (ctx: any) => string> = {
  melhorar: (ctx) => `Você é um especialista em licitações públicas brasileiras (Lei 14.133/2021).
Reescreva o texto selecionado com linguagem formal, jurídica, clara e objetiva.
Mantenha o sentido original mas aprimore a qualidade técnica e a conformidade legal.

${ctx.sectionContext}
${ctx.processoInfo}
${ctx.kbContext}

Retorne APENAS o texto reescrito, sem explicações.`,

  fundamentar: (ctx) => `Você é um jurista especializado em contratações públicas brasileiras.
Reescreva o texto adicionando fundamentação jurídica explícita com artigos específicos da:
- Lei 14.133/2021
- Decreto 10.024/2019
- IN SEGES/ME relevantes
- Jurisprudência do TCU quando aplicável

${ctx.sectionContext}
${ctx.processoInfo}
${ctx.kbContext}

Retorne APENAS o texto fundamentado, sem explicações adicionais.`,

  adequar_orgao: (ctx) => `Você é um especialista em redação institucional para administração pública brasileira.
Reescreva o texto adequando-o ao padrão institucional do órgão "${ctx.orgao}".
Use linguagem compatível com documentos oficiais deste órgão, seguindo:
- Padrão SEI/e-Proc
- Formalidade institucional
- Terminologia do órgão

${ctx.sectionContext}
${ctx.processoInfo}
${ctx.kbContext}

Retorne APENAS o texto adequado, sem explicações.`,

  base_legal: (ctx) => `Você é um especialista em legislação de contratações públicas brasileiras.
Insira referências legais pertinentes ao texto, incluindo:
- Artigos específicos da Lei 14.133/2021
- Decretos regulamentadores
- Instruções Normativas aplicáveis
- Súmulas e Acórdãos do TCU relevantes

${ctx.sectionContext}
${ctx.processoInfo}
${ctx.kbContext}

Retorne APENAS o texto com as referências legais inseridas, sem explicações.`,

  diferenciar: (ctx) => `Você é um especialista em documentos de contratação pública brasileira.
O texto abaixo foi identificado como semanticamente redundante com outras seções do documento.

REGRA DE DIFERENCIAÇÃO OBRIGATÓRIA:
- "Justificativa" = POR QUE contratar (motivação, fundamento legal, interesse público)
- "Necessidade" = SITUAÇÃO ATUAL (diagnóstico, lacuna, problema identificado)
- "Resultados Esperados" = O QUE MUDA (impacto, entregáveis, benefícios mensuráveis)

Seção atual: ${ctx.sectionType}

Outras seções do documento (para evitar redundância):
${ctx.otherSectionsText}

${ctx.processoInfo}
${ctx.kbContext}

Reescreva o texto eliminando qualquer sobreposição semântica com as outras seções. O texto deve ser ÚNICO e cumprir exclusivamente o papel da seção "${ctx.sectionType}".

Retorne APENAS o texto diferenciado, sem explicações.`,
};

async function callAI(apiKey: string, model: string, systemPrompt: string, userContent: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 429 || response.status === 402) {
      return { error: true, status: response.status, text: "" };
    }
    if (!response.ok) {
      const t = await response.text();
      console.error(`AI error (${model}):`, response.status, t);
      return { error: true, status: response.status, text: t };
    }

    const result = await response.json();
    return { error: false, text: result.choices?.[0]?.message?.content ?? "" };
  } catch (e) {
    clearTimeout(timeout);
    console.error(`AI call failed (${model}):`, e);
    return { error: true, status: 500, text: String(e) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT - extract user from authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user via their JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      selected_text,
      action,
      section_type,
      document_type,
      processo_context,
      dados_estruturados,
      other_sections,
      documento_id,
    } = body;

    if (!selected_text?.trim() || !action) {
      return new Response(JSON.stringify({ error: "selected_text e action são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validActions = ["melhorar", "fundamentar", "adequar_orgao", "base_legal", "diferenciar"];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: `Ação inválida: ${action}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build context
    const processoInfo = processo_context
      ? `Contexto do processo:\n- Objeto: ${processo_context.objeto ?? "N/A"}\n- Órgão: ${processo_context.orgao ?? "N/A"}\n- Modalidade: ${processo_context.modalidade ?? "N/A"}\n- Nº Processo: ${processo_context.numero_processo ?? "N/A"}`
      : "";

    const sectionContext = `Tipo de documento: ${document_type ?? "dfd"}\nSeção: ${section_type ?? "geral"}`;

    const otherSectionsText = (other_sections ?? [])
      .map((s: any) => `[${s.field}]: ${String(s.value).substring(0, 300)}`)
      .join("\n\n");

    // RAG V1: buscar KB institucional via FTS
    let kbContext = "";
    if (processo_context?.orgao) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      const searchTerms = (selected_text as string).split(/\s+/).slice(0, 5).join(" & ");
      const { data: kbDocs } = await adminClient
        .from("org_knowledge_base")
        .select("titulo, conteudo")
        .eq("orgao", processo_context.orgao)
        .textSearch("search_vector", searchTerms, { config: "portuguese" })
        .limit(3);

      if (kbDocs && kbDocs.length > 0) {
        kbContext = "\nBase de conhecimento institucional:\n" +
          kbDocs.map((d: any) => `[${d.titulo}]: ${String(d.conteudo).substring(0, 500)}`).join("\n");
      }
    }

    const promptBuilder = ACTION_PROMPTS[action];
    const systemPrompt = promptBuilder({
      sectionType: section_type,
      orgao: processo_context?.orgao ?? "",
      processoInfo,
      sectionContext,
      otherSectionsText,
      kbContext,
    });

    const userContent = `Reescreva o seguinte trecho:\n\n${selected_text}`;

    // Try primary model, fallback on error
    let result = await callAI(LOVABLE_API_KEY, PRIMARY_MODEL, systemPrompt, userContent);
    let modelUsed = PRIMARY_MODEL;

    if (result.error && result.status !== 429 && result.status !== 402) {
      console.log(`Fallback: ${PRIMARY_MODEL} → ${FALLBACK_MODEL}`);
      result = await callAI(LOVABLE_API_KEY, FALLBACK_MODEL, systemPrompt, userContent);
      modelUsed = FALLBACK_MODEL;
    }

    if (result.error) {
      if (result.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded", status: 429 }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (result.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required", status: 402 }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI failed: ${result.text}`);
    }

    // Audit log (service role)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    await adminClient.from("ai_audit_log").insert({
      user_id: user.id,
      documento_id: documento_id ?? null,
      action,
      model: modelUsed,
      prompt_version: PROMPT_VERSION,
      input_text: selected_text.substring(0, 1000),
      output_text: result.text.substring(0, 1000),
    });

    return new Response(
      JSON.stringify({ rewritten_text: result.text, model: modelUsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-rewrite-contextual error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
