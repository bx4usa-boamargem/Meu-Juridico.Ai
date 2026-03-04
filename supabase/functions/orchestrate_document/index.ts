import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRIMARY_MODEL = "google/gemini-3-pro-preview";
const FALLBACK_MODEL = "google/gemini-2.5-pro";

async function callAI(apiKey: string, model: string, systemPrompt: string, userContent: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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

async function getEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ input: text.slice(0, 2000), model: "text-embedding-3-small" }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

async function fetchRAGContext(supabase: any, orgId: string | null, searchText: string, apiKey: string): Promise<string> {
  if (!orgId) return "";
  try {
    const embedding = await getEmbedding(searchText, apiKey);
    if (!embedding) return "";
    const { data: chunks } = await supabase.rpc("match_knowledge_chunks", {
      p_org_id: orgId,
      p_embedding: JSON.stringify(embedding),
      p_match_threshold: 0.5,
      p_match_count: 5,
      p_doc_types: null,
    });
    if (!chunks || chunks.length === 0) return "";
    return "\n\n## Base de Conhecimento Institucional (RAG)\n" +
      chunks.map((c: any) => `[${c.doc_title}]: ${String(c.content_text).substring(0, 600)}`).join("\n\n");
  } catch (err) {
    console.warn("RAG fetch error (non-blocking):", err);
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { doc_id, processo_id, doc_type, form_data, html_final, generate_with_ai } = await req.json();

    if (!doc_id || !processo_id || !doc_type) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios: doc_id, processo_id, doc_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let finalHtml = html_final ?? "";

    // ── AI Generation with RAG ──────────────────────────────────────
    if (generate_with_ai && form_data) {
      // Get processo context
      const { data: processo } = await supabase
        .from("processos")
        .select("objeto, orgao, modalidade, numero_processo")
        .eq("id", processo_id)
        .single();

      // Get org_id for RAG
      let orgId: string | null = null;
      const { data: orgSettings } = await supabase
        .from("org_settings")
        .select("org_id")
        .limit(1)
        .maybeSingle();
      orgId = orgSettings?.org_id ?? null;

      // Build search text from form_data for RAG context
      const searchText = Object.values(form_data)
        .filter((v) => typeof v === "string" && v.length > 10)
        .slice(0, 3)
        .join(" ");

      const ragContext = await fetchRAGContext(supabase, orgId, searchText || processo?.objeto || "", LOVABLE_API_KEY);

      // Also fetch FTS context from org_knowledge_base
      let ftsContext = "";
      if (processo?.orgao) {
        const terms = (processo.objeto ?? "").split(/\s+/).slice(0, 5).join(" & ");
        const { data: kbDocs } = await supabase
          .from("org_knowledge_base")
          .select("titulo, conteudo")
          .eq("orgao", processo.orgao)
          .textSearch("search_vector", terms, { config: "portuguese" })
          .limit(3);
        if (kbDocs && kbDocs.length > 0) {
          ftsContext = "\n\n## Normativos Institucionais (FTS)\n" +
            kbDocs.map((d: any) => `[${d.titulo}]: ${String(d.conteudo).substring(0, 500)}`).join("\n\n");
        }
      }

      const docTypeLabels: Record<string, string> = {
        dfd: "Documento de Formalização da Demanda (DFD)",
        etp: "Estudo Técnico Preliminar (ETP)",
        tr: "Termo de Referência (TR)",
        edital: "Edital de Licitação",
        projeto_basico: "Projeto Básico",
        mapa_risco: "Mapa de Riscos",
      };

      const systemPrompt = `Você é um especialista em contratações públicas brasileiras (Lei 14.133/2021).
Gere um documento completo do tipo "${docTypeLabels[doc_type] ?? doc_type}" em formato HTML válido.

Contexto do processo:
- Objeto: ${processo?.objeto ?? "N/A"}
- Órgão: ${processo?.orgao ?? "N/A"}
- Modalidade: ${processo?.modalidade ?? "N/A"}
- Nº Processo: ${processo?.numero_processo ?? "N/A"}

Dados preenchidos pelo usuário:
${JSON.stringify(form_data, null, 2)}
${ragContext}
${ftsContext}

REGRAS:
1. Use HTML semântico com <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <table> quando apropriado
2. Inclua fundamentação legal com artigos específicos da Lei 14.133/2021
3. Se houver dados do RAG/normativos acima, INTEGRE-OS no documento
4. Mantenha linguagem formal e jurídica
5. Retorne APENAS o HTML do documento, sem explicações`;

      const userContent = `Gere o ${docTypeLabels[doc_type] ?? doc_type} completo agora.`;

      let result = await callAI(LOVABLE_API_KEY, PRIMARY_MODEL, systemPrompt, userContent);
      if (result.error) {
        console.log(`Fallback: ${PRIMARY_MODEL} → ${FALLBACK_MODEL}`);
        result = await callAI(LOVABLE_API_KEY, FALLBACK_MODEL, systemPrompt, userContent);
      }

      if (!result.error && result.text) {
        // Clean potential markdown code fences
        finalHtml = result.text
          .replace(/^```html?\n?/i, "")
          .replace(/\n?```$/i, "")
          .trim();
      }
    }

    // ── 1. Save version ──────────────────────────────────────────────
    const { error: versionError } = await supabase
      .from("document_versions")
      .insert({
        documento_id: doc_id,
        processo_id,
        conteudo_html: finalHtml,
        versao: 1,
        gerado_por: user.id,
      });

    if (versionError) {
      console.error("Version insert error:", versionError);
      return new Response(JSON.stringify({ error: "Erro ao salvar versão", details: versionError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Update documento status ───────────────────────────────────
    const { error: docError } = await supabase
      .from("documentos")
      .update({
        status: "aprovado",
        conteudo_final: finalHtml,
        workflow_status: "rascunho",
        dados_estruturados: form_data ?? {},
        aprovado_em: new Date().toISOString(),
        aprovado_por: user.id,
      })
      .eq("id", doc_id);

    if (docError) {
      console.error("Doc update error:", docError);
    }

    // ── 3. Update processo status ────────────────────────────────────
    const statusMap: Record<string, string> = {
      dfd: "dfd_aprovado",
      etp: "etp_aprovado",
      tr: "tr_aprovado",
      edital: "edital_aprovado",
      projeto_basico: "projeto_basico_aprovado",
      mapa_risco: "mapa_risco_aprovado",
    };
    const newStatus = statusMap[doc_type] ?? "em_andamento";
    await supabase.from("processos").update({ status: newStatus }).eq("id", processo_id);

    // ── 4. Chain: TR→Edital ──────────────────────────────────────────
    if (doc_type === "tr") {
      const { data: existingEdital } = await supabase
        .from("documentos")
        .select("id")
        .eq("processo_id", processo_id)
        .eq("tipo", "edital")
        .limit(1)
        .maybeSingle();

      if (!existingEdital) {
        const { data: trDoc } = await supabase
          .from("documentos")
          .select("cadeia_id, posicao_cadeia")
          .eq("id", doc_id)
          .single();

        if (trDoc?.cadeia_id) {
          await supabase.from("documentos").insert({
            processo_id,
            cadeia_id: trDoc.cadeia_id,
            tipo: "edital",
            posicao_cadeia: (trDoc.posicao_cadeia ?? 2) + 1,
            parent_doc_id: doc_id,
            status: "rascunho",
            dados_herdados: form_data ?? {},
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      status: newStatus,
      html_generated: generate_with_ai ? true : false,
      html_length: finalHtml.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Orchestrate error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
