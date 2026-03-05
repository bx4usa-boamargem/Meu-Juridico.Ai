import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =========================================================================
// MEUJURÍDICO.AI - INGEST KNOWLEDGE
// Processa documentos normativos e gera embeddings para a Base RAG
// =========================================================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        // Requer bypass de RLS para processar vetores no background se acionado pelo user auth
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { document_id, org_id, content } = await req.json()

        if (!document_id || !org_id || !content) {
            throw new Error('document_id, org_id e content (texto extraído do PDF/DOCX) são obrigatórios')
        }

        const openAiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openAiKey) {
            throw new Error('OPENAI_API_KEY necessária para geração de Embeddings (text-embedding-3-small)')
        }

        // 1. Fatiar (Chunking) simples: divide em blocos de ~1500 caracteres
        const chunks = []
        let currentChunk = ''
        const paragraphs = content.split('\n')

        for (const p of paragraphs) {
            const trimmed = p.trim()
            if (!trimmed) continue

            if ((currentChunk.length + trimmed.length) > 1500) {
                chunks.push(currentChunk)
                currentChunk = trimmed
            } else {
                currentChunk += '\n' + trimmed
            }
        }
        if (currentChunk) chunks.push(currentChunk)

        // 2. Processar Embeddings via OpenAI e inserir no DB
        let successCount = 0

        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i]

            // Requisita vetor da OpenAI
            const resp = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openAiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: chunkText,
                    model: 'text-embedding-3-small'
                })
            })

            if (!resp.ok) {
                const errData = await resp.text()
                console.error(`Erro ao vetorizar chunk ${i}:`, errData)
                continue
            }

            const data = await resp.json()
            const embedding = data.data?.[0]?.embedding

            if (!embedding) continue

            // 3. Inserir no PostgreSQL (pgvector)
            const { error: insertErr } = await supabase
                .from('knowledge_chunks')
                .insert({
                    document_id,
                    org_id,
                    content_text: chunkText,
                    embedding,
                    chunk_index: i
                })

            if (insertErr) {
                console.error(`Erro ao salvar chunk ${i} no banco:`, insertErr)
            } else {
                successCount++
            }
        }

        // Marcar o documento como ativo na Knowledge Base
        await supabase
            .from('knowledge_base')
            .update({ is_active: true, metadata: { chunks_processed: successCount } })
            .eq('id', document_id)

        return new Response(JSON.stringify({
            success: true,
            chunks_processed: successCount
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Ingest Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
