import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================
// MONITORING AGENT — Pipeline 3 Camadas
// MeuJurídico.ai — Sprint 1 — Março 2026
//
// Camada 1: Coleta (custo $0 — APIs públicas)
// Camada 2: Filtro leve (Gemini Flash — ~$0.002/1k tokens)
// Camada 3: Análise profunda (Claude Sonnet — só itens relevantes)
// Trava: custo total ≤ $5 USD/mês
// ============================================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- SOURCES CONFIGURATION ---
const SOURCES_FEDERAL = [
    { name: 'PNCP', type: 'api', url: 'https://pncp.gov.br/api/consulta/v1/atos' },
    { name: 'TCU', type: 'api', url: 'https://pesquisa.apps.tcu.gov.br/rest/acordao' },
    { name: 'CGU', type: 'api', url: 'https://www.portaltransparencia.gov.br/api-de-dados' },
]

const SOURCES_STATES: Record<string, Array<{ name: string; type: string; url: string }>> = {
    SP: [
        { name: 'TJSP', type: 'datajud', url: 'https://datajud-wiki.cnj.jus.br/api-publica/api_publica_tjsp' },
        { name: 'DOESP', type: 'scrape', url: 'https://www.imprensaoficial.com.br' },
    ],
    RJ: [
        { name: 'TJRJ', type: 'datajud', url: 'https://datajud-wiki.cnj.jus.br/api-publica/api_publica_tjrj' },
        { name: 'DOERJ', type: 'scrape', url: 'https://www.io.rj.gov.br' },
    ],
    MG: [
        { name: 'TJMG', type: 'datajud', url: 'https://datajud-wiki.cnj.jus.br/api-publica/api_publica_tjmg' },
        { name: 'DOEMG', type: 'scrape', url: 'https://www.iof.mg.gov.br' },
    ],
}

// --- COST TRACKING ---
const COST_PER_1K_TOKENS = {
    gemini_flash: 0.002,
    claude_sonnet: 0.015,
}

interface RunStats {
    items_fetched: number
    items_filtered_out: number
    items_analyzed_light: number
    items_analyzed_deep: number
    alerts_generated: number
    estimated_cost_usd: number
}

// --- CAMADA 1: COLETA ---
async function collectFromSource(source: { name: string; type: string; url: string }): Promise<Array<{ title: string; content: string; url: string; published_at: string }>> {
    try {
        if (source.type === 'datajud') {
            return await collectFromDatajud(source)
        }
        if (source.type === 'api') {
            return await collectFromApi(source)
        }
        // scrape type — simplified placeholder
        return []
    } catch (error) {
        console.error(`[COLLECT] Error from ${source.name}:`, error)
        return []
    }
}

async function collectFromDatajud(source: { name: string; url: string }): Promise<Array<{ title: string; content: string; url: string; published_at: string }>> {
    try {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const dateStr = yesterday.toISOString().split('T')[0]

        const response = await fetch(source.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: {
                    bool: {
                        must: [
                            { match: { 'classe.nome': 'licitação OR pregão OR contratação pública' } },
                            { range: { dataAjuizamento: { gte: dateStr } } },
                        ],
                    },
                },
                size: 20,
            }),
        })

        if (!response.ok) return []
        const data = await response.json()
        return (data.hits?.hits || []).map((hit: any) => ({
            title: hit._source?.classeProcessual || 'Decisão Judicial',
            content: JSON.stringify(hit._source?.movimentos?.slice(0, 3) || {}),
            url: `https://www.cnj.jus.br/processo/${hit._source?.numeroProcesso || ''}`,
            published_at: hit._source?.dataAjuizamento || new Date().toISOString(),
        }))
    } catch {
        return []
    }
}

async function collectFromApi(source: { name: string; url: string }): Promise<Array<{ title: string; content: string; url: string; published_at: string }>> {
    try {
        const response = await fetch(source.url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000),
        })
        if (!response.ok) return []
        const data = await response.json()
        const items = Array.isArray(data) ? data : (data.items || data.data || data.results || [])
        return items.slice(0, 20).map((item: any) => ({
            title: item.titulo || item.title || item.objeto || 'Publicação',
            content: item.descricao || item.description || item.ementa || JSON.stringify(item).slice(0, 1000),
            url: item.url || item.link || source.url,
            published_at: item.data || item.date || item.dataPublicacao || new Date().toISOString(),
        }))
    } catch {
        return []
    }
}

// --- CAMADA 2: FILTRO LEVE (Gemini Flash) ---
async function filterWithGeminiFlash(text: string, apiKey: string): Promise<boolean> {
    try {
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Texto: "${text.slice(0, 500)}"\n\nEste texto trata de licitação pública, contratação pública ou Lei 14.133/2021? Responda APENAS: SIM ou NÃO.`,
                        }],
                    }],
                    generationConfig: { maxOutputTokens: 5, temperature: 0 },
                }),
            }
        )
        if (!response.ok) return false
        const data = await response.json()
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase()
        return answer === 'SIM'
    } catch {
        return false
    }
}

// --- CAMADA 3: ANÁLISE PROFUNDA (Claude Sonnet) ---
async function analyzeWithClaude(text: string, apiKey: string): Promise<{
    summary: string
    affected_doc_types: string[]
    severity: string
    impact_analysis: string
} | null> {
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: `Você é um especialista em licitações públicas (Lei 14.133/2021).

Analise o texto abaixo e responda EXCLUSIVAMENTE em JSON válido:
{
  "summary": "resumo em 1 frase",
  "affected_doc_types": ["dfd","etp","tr","projeto_basico","mapa_risco","edital"],
  "severity": "low|medium|high|critical",
  "impact_analysis": "análise de impacto em 2-3 frases para o gestor público"
}

Texto: ${text.slice(0, 2000)}`,
                }],
            }),
        })
        if (!response.ok) return null
        const data = await response.json()
        const raw = data.content?.[0]?.text || ''
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
        return null
    }
}

// --- MAIN HANDLER ---
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY') ?? Deno.env.get('GEMINI_API_KEY') ?? ''
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') ?? ''

    // Load config
    const { data: config } = await supabase.from('monitoring_config').select('*').single()
    if (!config?.is_active) {
        return new Response(JSON.stringify({ status: 'paused', message: 'Monitoramento desativado.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    // Check monthly cost
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { data: monthlyRuns } = await supabase
        .from('monitoring_runs')
        .select('estimated_cost_usd')
        .gte('started_at', startOfMonth.toISOString())
    const monthlyCost = (monthlyRuns || []).reduce((sum, r) => sum + (r.estimated_cost_usd || 0), 0)

    if (monthlyCost >= (config.cost_limit_usd || 5)) {
        return new Response(JSON.stringify({
            status: 'cost_limit_exceeded',
            monthly_cost: monthlyCost,
            limit: config.cost_limit_usd,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Create run record
    const activeStates: string[] = config.scope?.states || ['SP', 'RJ', 'MG']
    const allSourceNames: string[] = []
    const { data: run } = await supabase.from('monitoring_runs').insert({
        org_id: config.org_id,
        sources_checked: [],
        status: 'running',
    }).select().single()

    const runId = run?.id
    const stats: RunStats = {
        items_fetched: 0,
        items_filtered_out: 0,
        items_analyzed_light: 0,
        items_analyzed_deep: 0,
        alerts_generated: 0,
        estimated_cost_usd: 0,
    }

    try {
        // --- CAMADA 1: COLETA ---
        const allItems: Array<{ title: string; content: string; url: string; published_at: string; source: string }> = []

        // Federal sources
        if (config.scope?.federal !== false) {
            for (const source of SOURCES_FEDERAL) {
                const items = await collectFromSource(source)
                items.forEach(i => allItems.push({ ...i, source: source.name }))
                allSourceNames.push(source.name)
            }
        }

        // State sources
        for (const state of activeStates) {
            const stateSources = SOURCES_STATES[state] || []
            for (const source of stateSources) {
                const items = await collectFromSource(source)
                items.forEach(i => allItems.push({ ...i, source: source.name }))
                allSourceNames.push(source.name)
            }
        }

        stats.items_fetched = allItems.length

        // --- CAMADA 2: FILTRO LEVE ---
        const relevantItems: typeof allItems = []

        for (const item of allItems) {
            // Check cost limit mid-run
            if (stats.estimated_cost_usd + monthlyCost >= (config.cost_limit_usd || 5)) {
                await supabase.from('monitoring_runs').update({
                    ...stats,
                    sources_checked: allSourceNames,
                    status: 'cost_limit_exceeded',
                    finished_at: new Date().toISOString(),
                }).eq('id', runId)
                return new Response(JSON.stringify({ status: 'cost_limit_exceeded', stats }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            const isRelevant = await filterWithGeminiFlash(
                `${item.title} ${item.content}`.slice(0, 500),
                geminiKey
            )

            // Estimate cost: ~100 tokens per filter call
            stats.estimated_cost_usd += (100 / 1000) * COST_PER_1K_TOKENS.gemini_flash
            stats.items_analyzed_light++

            if (isRelevant) {
                relevantItems.push(item)
            } else {
                stats.items_filtered_out++
            }
        }

        // --- CAMADA 3: ANÁLISE PROFUNDA ---
        for (const item of relevantItems) {
            // Check cost limit
            if (stats.estimated_cost_usd + monthlyCost >= (config.cost_limit_usd || 5)) break

            const analysis = await analyzeWithClaude(
                `${item.title}\n\n${item.content}`,
                anthropicKey
            )

            // Estimate cost: ~600 tokens per deep analysis
            stats.estimated_cost_usd += (600 / 1000) * COST_PER_1K_TOKENS.claude_sonnet
            stats.items_analyzed_deep++

            if (analysis) {
                await supabase.from('monitoring_alerts').insert({
                    org_id: config.org_id,
                    source: item.source,
                    source_url: item.url,
                    title: item.title,
                    summary: analysis.summary,
                    impact_analysis: analysis.impact_analysis,
                    affected_doc_types: analysis.affected_doc_types,
                    severity: analysis.severity,
                    is_relevant: true,
                    published_at: item.published_at,
                    raw_content: item.content.slice(0, 5000),
                })
                stats.alerts_generated++
            }
        }

        // Update run with final stats
        await supabase.from('monitoring_runs').update({
            ...stats,
            sources_checked: allSourceNames,
            status: 'completed',
            finished_at: new Date().toISOString(),
        }).eq('id', runId)

        // Update config last_run
        await supabase.from('monitoring_config').update({
            last_run_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }).eq('id', config.id)

        return new Response(JSON.stringify({ status: 'completed', stats }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        await supabase.from('monitoring_runs').update({
            ...stats,
            sources_checked: allSourceNames,
            status: 'failed',
            finished_at: new Date().toISOString(),
        }).eq('id', runId)

        return new Response(JSON.stringify({ status: 'failed', error: String(error), stats }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
