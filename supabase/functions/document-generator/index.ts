import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ────────────────────────────────────────────
// Tabela de custo (USD por 1M tokens)
// ────────────────────────────────────────────
const COSTS: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-5-20251001': { input: 3.00, output: 15.00 },
    'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00 },
    'gpt-4.1': { input: 2.00, output: 8.00 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gemini-2.5-flash': { input: 0.15, output: 0.60 },
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
}

function calcCost(modelo: string, ti: number, to: number): number {
    const c = COSTS[modelo]
    if (!c) return 0
    return (ti / 1_000_000) * c.input + (to / 1_000_000) * c.output
}

// ────────────────────────────────────────────
// callAI — roteador de provider
// ────────────────────────────────────────────
async function callAI(modelo: string, systemPrompt: string, userPrompt: string) {
    const start = Date.now()

    // ── Anthropic (Claude) ──
    if (modelo.startsWith('claude-')) {
        const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
        if (!apiKey) throw new Error(`ANTHROPIC_API_KEY não configurada`)

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: modelo,
                max_tokens: 8000,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
            }),
        })

        if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`)

        const data = await res.json()
        return {
            texto: data.content[0].text as string,
            tokens_input: data.usage.input_tokens as number,
            tokens_output: data.usage.output_tokens as number,
            duracao_ms: Date.now() - start,
        }
    }

    // ── OpenAI (GPT) ──
    if (modelo.startsWith('gpt-')) {
        const apiKey = Deno.env.get('OPENAI_API_KEY')
        if (!apiKey) throw new Error(`OPENAI_API_KEY não configurada`)

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: modelo,
                max_tokens: 8000,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            }),
        })

        if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`)

        const data = await res.json()
        return {
            texto: data.choices[0].message.content as string,
            tokens_input: data.usage.prompt_tokens as number,
            tokens_output: data.usage.completion_tokens as number,
            duracao_ms: Date.now() - start,
        }
    }

    // ── Google (Gemini) ──
    if (modelo.startsWith('gemini-')) {
        const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY')
        if (!apiKey) throw new Error(`GEMINI_API_KEY não configurada`)

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: userPrompt }] }],
                    generationConfig: { maxOutputTokens: 8000 },
                }),
            }
        )

        if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)

        const data = await res.json()
        return {
            texto: data.candidates[0].content.parts[0].text as string,
            tokens_input: (data.usageMetadata?.promptTokenCount ?? 0) as number,
            tokens_output: (data.usageMetadata?.candidatesTokenCount ?? 0) as number,
            duracao_ms: Date.now() - start,
        }
    }

    throw new Error(`Modelo desconhecido: ${modelo}`)
}

// ────────────────────────────────────────────
// generateWithFallback
// ────────────────────────────────────────────
async function generateWithFallback({
    tipo_documento,
    tipo_operacao,
    system_prompt,
    user_prompt,
    documento_id,
    processo_id,
    org_id,
    user_id,
    user_email,
    supabase,
}: {
    tipo_documento: string
    tipo_operacao: string
    system_prompt: string
    user_prompt: string
    documento_id?: string
    processo_id?: string
    org_id?: string
    user_id?: string
    user_email?: string
    supabase: any
}) {
    // Buscar configuração de modelos
    const { data: config } = await supabase
        .from('ai_model_config')
        .select('modelo_principal, modelo_fallback')
        .eq('tipo_documento', tipo_documento)
        .eq('tipo_operacao', tipo_operacao)
        .eq('ativo', true)
        .single()

    const modeloPrincipal = config?.modelo_principal ?? 'gpt-4o'
    const modeloFallback = config?.modelo_fallback ?? 'gpt-4o'

    let resultado: { texto: string; tokens_input: number; tokens_output: number; duracao_ms: number } | null = null
    let modeloUsado = modeloPrincipal
    let foiFallback = false
    let motivoFallback: string | null = null
    let sucesso = true
    let erroFinal: string | null = null

    // 1. Tentar modelo principal
    try {
        resultado = await callAI(modeloPrincipal, system_prompt, user_prompt)
        modeloUsado = modeloPrincipal
    } catch (err: any) {
        console.error(`[FALLBACK] ${modeloPrincipal} falhou: ${err.message}`)
        motivoFallback = err.message
        foiFallback = true
        modeloUsado = modeloFallback

        // 2. Fallback automático
        try {
            resultado = await callAI(modeloFallback, system_prompt, user_prompt)
        } catch (fallbackErr: any) {
            sucesso = false
            erroFinal = fallbackErr.message
            console.error(`[FALLBACK] ${modeloFallback} também falhou: ${fallbackErr.message}`)
        }
    }

    const tokens_input = resultado?.tokens_input ?? 0
    const tokens_output = resultado?.tokens_output ?? 0
    const custo = calcCost(modeloUsado, tokens_input, tokens_output)

    // 3. Registrar log
    await supabase.from('ai_usage_log').insert({
        tipo_documento,
        tipo_operacao,
        documento_id: documento_id ?? null,
        processo_id: processo_id ?? null,
        modelo_solicitado: modeloPrincipal,
        modelo_utilizado: modeloUsado,
        foi_fallback: foiFallback,
        motivo_fallback: motivoFallback,
        tokens_input,
        tokens_output,
        custo_usd: custo,
        org_id: org_id ?? null,
        user_id: user_id ?? null,
        user_email: user_email ?? null,
        duracao_ms: resultado?.duracao_ms ?? 0,
        sucesso,
        erro: erroFinal,
    })

    // 4. Notificação de fallback
    if (foiFallback && user_id) {
        await supabase.from('notifications').insert({
            user_id,
            title: '⚠️ Fallback de IA ativado',
            body: `O documento ${tipo_documento.toUpperCase()} foi gerado pelo modelo "${modeloUsado}" pois "${modeloPrincipal}" estava indisponível. Motivo: ${motivoFallback}`,
            type: 'warning',
            action_url: '/admin/relatorios-ia',
        })
    }

    if (!sucesso) {
        throw new Error(`Todos os modelos falharam. Último erro: ${erroFinal}`)
    }

    return {
        texto: resultado!.texto,
        modelo_utilizado: modeloUsado,
        foi_fallback: foiFallback,
        custo_usd: custo,
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
            tipo_operacao = 'geracao',
            system_prompt,
            user_prompt,
            documento_id,
            processo_id,
            org_id,
            user_id,
            user_email,
        } = payload

        if (!tipo_documento) throw new Error('tipo_documento é obrigatório')
        if (!system_prompt) throw new Error('system_prompt é obrigatório')
        if (!user_prompt) throw new Error('user_prompt é obrigatório')

        const result = await generateWithFallback({
            tipo_documento,
            tipo_operacao,
            system_prompt,
            user_prompt,
            documento_id,
            processo_id,
            org_id,
            user_id,
            user_email,
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
