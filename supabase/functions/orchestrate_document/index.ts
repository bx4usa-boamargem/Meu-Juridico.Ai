import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getOrgProvider } from '../../skills/llm_provider.ts'
import { callLLM } from '../../skills/_base.ts'

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
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const payload = await req.json()
        const { document_id, process_id, doc_type, form_data } = payload

        if (!document_id || !doc_type) {
            throw new Error('document_id and doc_type are required')
        }

        // Obter org_id do documento para descobrir a IA configurada
        const { data: doc, error: docError } = await supabase
            .from('documents')
            .select('org_id')
            .eq('id', document_id)
            .single()

        if (docError || !doc) {
            throw new Error(`Documento não encontrado: ${document_id}`)
        }

        // ─── 1. SELEÇÃO DINÂMICA DE IA (NÃO HARDCODED) ───
        const provider = await getOrgProvider(supabase, doc.org_id)
        console.log(`[ORCHESTRATOR] Usando provedor LLM configurado: ${provider}`)

        // ─── 2. CARREGAR TEMPLATE ───
        const { data: template, error: tmplError } = await supabase
            .from('document_templates')
            .select('sections_plan')
            .eq('doc_type', doc_type)
            .single()

        if (tmplError || !template) {
            throw new Error(`Template not found for ${doc_type}`)
        }

        const sectionsPlan = Array.isArray(template.sections_plan)
            ? template.sections_plan
            : (JSON.parse(template.sections_plan as string) || [])

        sectionsPlan.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))

        // ─── 3. CARREGAR TR VINCULADO (SE EDITAL) ───
        let linkedTrMemories: Record<string, any> | null = null
        if (doc_type.toLowerCase() === 'edital' && process_id) {
            const { data: linkedTR } = await supabase
                .from('documents')
                .select('section_memories')
                .eq('process_id', process_id)
                .in('doc_type', ['tr', 'TR'])
                .eq('status', 'approved')
                .single()

            if (linkedTR && linkedTR.section_memories) {
                linkedTrMemories = linkedTR.section_memories
            }
        }

        // ─── 4. LOOP DE GERAÇÃO POR SEÇÃO ───
        const sectionMemories: Record<string, any> = {}
        let previousContext = ''
        let totalCostUsd = 0

        for (const section of sectionsPlan) {
            // Injeção de TR -> Edital
            if (doc_type.toLowerCase() === 'edital' && linkedTrMemories) {
                if (section.section_id === 'ed_02' && linkedTrMemories['tr_01']) {
                    sectionMemories[section.section_id] = linkedTrMemories['tr_01']
                    previousContext += `\n\n=== ${section.title} ===\n${linkedTrMemories['tr_01'].content}`
                    continue
                }
                if (section.section_id === 'ed_05' && linkedTrMemories['tr_08']) {
                    sectionMemories[section.section_id] = linkedTrMemories['tr_08']
                    previousContext += `\n\n=== ${section.title} ===\n${linkedTrMemories['tr_08'].content}`
                    continue
                }
            }

            const userPrompt = `Seção a ser redigida: ${section.title}
Instruções OBRIGATÓRIAS para esta seção: ${section.instructions}

Dados do processo (input do usuário):
${JSON.stringify(form_data, null, 2)}
${previousContext ? `\nContexto das seções anteriores já geradas:\n${previousContext}` : ''}

Gere o conteúdo formal, técnico e juridicamente correto EXCLUSIVAMENTE para a seção "${section.title}". 
Não inclua o título da seção na sua resposta. Não inclua saudações, placeholders em branco nem conclusões genéricas fora de contexto.`

            const systemPrompt = 'Você é um especialista em licitações públicas brasileiras (Lei 14.133/2021). Seu objetivo é redigir partes de documentos públicos com linguagem formal, obedecendo às exigências legais, à economicidade e à precisão técnica.'

            console.log(`[ORCHESTRATOR] Gerando seção ${section.section_id} via ${provider}...`)

            try {
                const llmResult = await callLLM({
                    provider,
                    system: systemPrompt,
                    user: userPrompt,
                    max_tokens: 2000
                })

                const content = llmResult.text || ''

                sectionMemories[section.section_id] = {
                    content,
                    generated_at: new Date().toISOString(),
                    score: 1.0, // Sucesso bruto
                    tokens_used: llmResult.tokens_used?.completion || 0,
                    provider: llmResult.provider
                }

                totalCostUsd += (llmResult.cost_usd || 0)
                previousContext += `\n\n=== ${section.title} ===\n${content}`
            } catch (err: any) {
                console.error(`Erro ao gerar seção ${section.section_id}:`, err)
                sectionMemories[section.section_id] = {
                    content: 'Erro ao gerar conteúdo: ' + String(err.message),
                    generated_at: new Date().toISOString(),
                    score: 0.0,
                    error: true
                }
            }
        }

        // ─── 5. SCORE DE CONFORMIDADE E HTML ───
        const requiredSections = sectionsPlan.filter((s: any) => s.required)
        const completedRequired = requiredSections.filter((s: any) =>
            !sectionMemories[s.section_id]?.error && sectionMemories[s.section_id]?.content?.length > 100
        )
        const score = requiredSections.length > 0
            ? completedRequired.length / requiredSections.length
            : 1.0

        const htmlContent = sectionsPlan.map((s: any) => {
            const content = sectionMemories[s.section_id]?.content
            if (!content || sectionMemories[s.section_id]?.error) return ''
            return `<h2>${s.title}</h2>\n` + content.split('\n').map((p: string) => `<p>${p}</p>`).join('\n')
        }).join('\n<hr>\n')

        // ─── 6. SALVAR NO DB ───
        const { error: updError } = await supabase
            .from('documents')
            .update({
                status: 'generated',
                score_conformidade: parseFloat(score.toFixed(3)),
                content_html: htmlContent,
                section_memories: sectionMemories,
                updated_at: new Date().toISOString()
            })
            .eq('id', document_id)

        if (updError) throw updError

        return new Response(JSON.stringify({
            success: true,
            document_id,
            score: parseFloat(score.toFixed(3)),
            sections_generated: Object.keys(sectionMemories).length,
            estimated_cost_usd: totalCostUsd,
            provider_used: provider
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('[ORCHESTRATOR] Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
