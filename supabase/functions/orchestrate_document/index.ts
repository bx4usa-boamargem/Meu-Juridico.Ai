import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { doc_id, processo_id, doc_type, form_data, html_final } = await req.json();

    if (!doc_id || !processo_id || !doc_type) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios: doc_id, processo_id, doc_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Save version
    const { error: versionError } = await supabase
      .from("document_versions")
      .insert({
        documento_id: doc_id,
        processo_id,
        conteudo_html: html_final ?? "",
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

    // 2. Update documento status
    const { error: docError } = await supabase
      .from("documentos")
      .update({
        status: "aprovado",
        conteudo_final: html_final ?? "",
        workflow_status: "rascunho",
        dados_estruturados: form_data ?? {},
        aprovado_em: new Date().toISOString(),
        aprovado_por: user.id,
      })
      .eq("id", doc_id);

    if (docError) {
      console.error("Doc update error:", docError);
    }

    // 3. Update processo status based on doc_type
    const statusMap: Record<string, string> = {
      DFD: "dfd_aprovado",
      ETP: "etp_aprovado",
      TR: "tr_aprovado",
      edital: "edital_aprovado",
      projeto_basico: "projeto_basico_aprovado",
      mapa_risco: "mapa_risco_aprovado",
    };
    const newStatus = statusMap[doc_type] ?? "em_andamento";
    await supabase.from("processos").update({ status: newStatus }).eq("id", processo_id);

    return new Response(JSON.stringify({ success: true, status: newStatus }), {
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
