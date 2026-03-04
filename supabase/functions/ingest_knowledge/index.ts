import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  // Use Lovable AI gateway for embeddings via OpenAI-compatible endpoint
  const response = await fetch("https://api.lovable.dev/v1/ai/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text.slice(0, 8000),
      model: "text-embedding-3-small",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { knowledge_doc_id } = await req.json();
    if (!knowledge_doc_id) {
      return new Response(JSON.stringify({ error: "knowledge_doc_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the knowledge_base record
    const { data: kbDoc, error: kbErr } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("id", knowledge_doc_id)
      .single();

    if (kbErr || !kbDoc) {
      return new Response(JSON.stringify({ error: "Documento não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download file from storage
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("knowledge_files")
      .download(kbDoc.file_path);

    if (fileErr || !fileData) {
      return new Response(JSON.stringify({ error: "Erro ao baixar arquivo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract text (for now, treat as plain text — PDF parsing would need a library)
    const rawText = await fileData.text();

    if (!rawText || rawText.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Arquivo sem conteúdo textual" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete existing chunks for this doc
    await supabase.from("knowledge_chunks").delete().eq("document_id", knowledge_doc_id);

    // Chunk the text
    const chunks = chunkText(rawText);
    let inserted = 0;

    // Process chunks in batches of 5
    for (let i = 0; i < chunks.length; i += 5) {
      const batch = chunks.slice(i, i + 5);
      const embeddings = await Promise.all(
        batch.map((chunk) => getEmbedding(chunk, lovableApiKey))
      );

      const rows = batch.map((chunk, j) => ({
        document_id: knowledge_doc_id,
        org_id: kbDoc.org_id,
        content_text: chunk,
        embedding: JSON.stringify(embeddings[j]),
        chunk_index: i + j,
        metadata: { source: kbDoc.title },
      }));

      const { error: insertErr } = await supabase.from("knowledge_chunks").insert(rows);
      if (insertErr) {
        console.error("Chunk insert error:", insertErr);
      } else {
        inserted += rows.length;
      }
    }

    // Update knowledge_base metadata
    await supabase
      .from("knowledge_base")
      .update({
        metadata: { ...((kbDoc.metadata as Record<string, unknown>) ?? {}), chunks_count: inserted, ingested_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      })
      .eq("id", knowledge_doc_id);

    return new Response(
      JSON.stringify({ success: true, chunks_inserted: inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Ingest error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
