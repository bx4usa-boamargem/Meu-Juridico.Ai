import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ────────────────────────────────────────────
// callLovableAI — uses Lovable AI proxy (no external API keys needed)
// ────────────────────────────────────────────
async function callLovableAI(model: string, systemPrompt: string, userPrompt: string) {
    const start = Date.now()
    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) throw new Error('LOVABLE_API_KEY não configurada')

    const res = await fetch('https://api.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            max_tokens: 8000,
        }),
    })

    if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Lovable AI ${res.status}: ${errorText}`)
    }

    const data = await res.json()
    return {
        texto: data.choices?.[0]?.message?.content || '',
        tokens_input: data.usage?.prompt_tokens || 0,
        tokens_output: data.usage?.completion_tokens || 0,
        duracao_ms: Date.now() - start,
    }
}

// ────────────────────────────────────────────
// generateWithFallback — Lovable AI models
// ────────────────────────────────────────────
async function generateWithFallback({
    tipo_documento,
    system_prompt,
    user_prompt,
    documento_id,
    processo_id,
    org_id,
    user_id,
    supabase,
}: {
    tipo_documento: string
    system_prompt: string
    user_prompt: string
    documento_id?: string
    processo_id?: string
    org_id?: string
    user_id?: string
    supabase: any
}) {
    // Primary: gemini-2.5-flash (fast, good quality, cheap)
    // Fallback: gpt-5-mini (strong reasoning)
    const modeloPrincipal = 'google/gemini-2.5-flash'
    const modeloFallback = 'openai/gpt-5-mini'

    let resultado: { texto: string; tokens_input: number; tokens_output: number; duracao_ms: number } | null = null
    let modeloUsado = modeloPrincipal
    let foiFallback = false
    let erroFinal: string | null = null

    // 1. Try primary model
    try {
        resultado = await callLovableAI(modeloPrincipal, system_prompt, user_prompt)
        modeloUsado = modeloPrincipal
    } catch (err: any) {
        console.error(`[FALLBACK] ${modeloPrincipal} falhou: ${err.message}`)
        foiFallback = true
        modeloUsado = modeloFallback

        // 2. Fallback
        try {
            resultado = await callLovableAI(modeloFallback, system_prompt, user_prompt)
        } catch (fallbackErr: any) {
            erroFinal = fallbackErr.message
            console.error(`[FALLBACK] ${modeloFallback} também falhou: ${fallbackErr.message}`)
        }
    }

    const tokens_input = resultado?.tokens_input ?? 0
    const tokens_output = resultado?.tokens_output ?? 0

    // 3. Log usage
    try {
        await supabase.from('ai_usage_log').insert({
            action: 'generate',
            modelo_utilizado: modeloUsado,
            foi_fallback: foiFallback,
            tokens_input,
            tokens_output,
            custo_usd: 0, // Lovable AI - no direct cost
            org_id: org_id ?? null,
            user_id: user_id ?? '00000000-0000-0000-0000-000000000000',
            documento_id: documento_id ?? null,
            duracao_ms: resultado?.duracao_ms ?? 0,
            erro: erroFinal,
            tipo_documento,
        })
    } catch (logErr) {
        console.error('[LOG] Erro ao salvar usage log:', logErr)
    }

    if (!resultado || erroFinal) {
        throw new Error(`Todos os modelos falharam. Último erro: ${erroFinal}`)
    }

    return {
        texto: resultado.texto,
        modelo_utilizado: modeloUsado,
        foi_fallback: foiFallback,
        custo_usd: 0,
        tokens_input,
        tokens_output,
    }
}

// ────────────────────────────────────────────
// Handler principal
// ────────────────────────────────────────────
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const payload = await req.json()
        const {
            tipo_documento,
            system_prompt,
            user_prompt,
            documento_id,
            processo_id,
            org_id,
            user_id,
        } = payload

        if (!tipo_documento) throw new Error('tipo_documento é obrigatório')
        if (!system_prompt) throw new Error('system_prompt é obrigatório')
        if (!user_prompt) throw new Error('user_prompt é obrigatório')

        const result = await generateWithFallback({
            tipo_documento,
            system_prompt,
            user_prompt,
            documento_id,
            processo_id,
            org_id,
            user_id,
            supabase,
        })

        return new Response(
            JSON.stringify({ success: true, ...result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (err: any) {
        console.error('[document-generator] Erro:', err.message)
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
