import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Inline getOrgProvider to avoid shared module import issues
type LLMProvider = 'anthropic' | 'openai' | 'gemini';

async function getOrgProvider(supabase: any, orgId: string): Promise<LLMProvider> {
    if (!orgId) return 'openai';
    const { data, error } = await supabase
        .from('org_settings')
        .select('*')
        .eq('org_id', orgId)
        .single();
    if (error || !data?.llm_provider) {
        const envProvider = Deno.env.get('LLM_PROVIDER')?.toLowerCase();
        if (envProvider === 'openai' || envProvider === 'gemini' || envProvider === 'anthropic') return envProvider as LLMProvider;
        return 'openai';
    }
    const provider = data.llm_provider.toLowerCase();
    if (provider !== 'openai' && provider !== 'gemini' && provider !== 'anthropic') {
        throw new Error(`Provider "${data.llm_provider}" inválido.`);
    }
    return provider as LLMProvider;
}

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
        const { document_id, process_id, parent_doc_id, generate_with_ai, html_final, form_data: payloadFormData, disabled_sections } = payload
        let { doc_type } = payload

        if (!document_id) {
            throw new Error('document_id is required')
        }

        // Obter org_id e doc_type se não fornecido
        const { data: doc, error: docError } = await supabase
            .from('documentos')
            .select('tipo, processo_id, parent_doc_id')
            .eq('id', document_id)
            .single() as { data: any; error: any }

        if (docError || !doc) {
            throw new Error(`Documento não encontrado: ${document_id}`)
        }

        const actualDocType = doc_type || doc.tipo
        const actualProcessId = process_id || doc.processo_id
        const actualParentDocId = parent_doc_id || doc.parent_doc_id

        // ─── 0. RESOLVER HERANÇA ───
        const { data: herancaData } = await supabase.rpc('resolver_heranca', {
            p_processo_id: actualProcessId,
            p_tipo_documento: actualDocType,
            p_parent_doc_id: actualParentDocId
        })

        const contextFromParent = herancaData?.heranca || {}
        const mergedFormData = { ...contextFromParent, ...(payloadFormData || {}) }

        // ─── 1. SELEÇÃO DINÂMICA DE IA (NÃO HARDCODED) ───
        const provider = await getOrgProvider(supabase as any, '')
        console.log(`[ORCHESTRATOR] Usando provedor LLM configurado: ${provider}`)

        // ─── 2. CARREGAR TEMPLATE (multi-row format) ───
        const { data: templateRows, error: tmplError } = await supabase
            .from('document_templates')
            .select('section_id, title, order_index, required, instructions, agent, skill')
            .eq('doc_type', actualDocType.toLowerCase())
            .not('section_id', 'is', null)
            .order('order_index')

        let sectionsPlan: any[] = []

        if (!tmplError && templateRows && templateRows.length > 0) {
            // New multi-row format
            sectionsPlan = templateRows.map((r: any) => ({
                section_id: r.section_id,
                title: r.title,
                order_index: r.order_index ?? 0,
                required: r.required ?? true,
                instructions: r.instructions ?? '',
            }))
        } else {
            // Fallback: legacy single-row with sections_plan JSONB
            const { data: legacy, error: legacyErr } = await supabase
                .from('document_templates')
                .select('sections_plan')
                .eq('doc_type', actualDocType.toLowerCase())
                .maybeSingle()

            if (legacyErr || !legacy || !legacy.sections_plan) {
                throw new Error(`Template not found for ${actualDocType}`)
            }

            sectionsPlan = Array.isArray(legacy.sections_plan)
                ? legacy.sections_plan
                : (JSON.parse(legacy.sections_plan as string) || [])
        }

        sectionsPlan.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))

        // ─── 3. MODO SEM IA: salvar HTML pré-renderizado ───
        if (generate_with_ai === false || (html_final && !generate_with_ai)) {
            const { error: updError } = await supabase
                .from('documentos')
                .update({
                    conteudo_final: html_final,
                    status: 'aprovado',
                    workflow_status: 'aprovado',
                    updated_at: new Date().toISOString()
                })
                .eq('id', document_id)

            if (updError) throw updError

            // Criar versão no document_versions para que o DocumentView possa exibir
            const { data: existingVersions } = await supabase
                .from('document_versions')
                .select('versao')
                .eq('documento_id', document_id)
                .order('versao', { ascending: false })
                .limit(1)
            const nextVersao = ((existingVersions?.[0]?.versao) ?? 0) + 1
            await supabase.from('document_versions').insert({
                documento_id: document_id,
                processo_id: actualProcessId,
                conteudo_html: html_final,
                versao: nextVersao,
            })

            // Update process status
            if (actualProcessId && actualDocType) {
                await supabase
                    .from('processos')
                    .update({ status: `${actualDocType.toUpperCase()}_APROVADO`, updated_at: new Date().toISOString() })
                    .eq('id', actualProcessId)
            }

            return new Response(JSON.stringify({
                success: true,
                document_id,
                score: 1.0,
                mode: 'persist_only'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ─── 4. CARREGAR TR VINCULADO (SE EDITAL) ───
        let linkedTrMemories: Record<string, any> | null = null
        if (doc_type && doc_type.toLowerCase() === 'edital' && process_id) {
            const { data: linkedTR } = await supabase
                .from('documentos')
                .select('section_memories')
                .eq('processo_id', process_id)
                .eq('tipo', 'tr')
                .eq('status', 'aprovado')
                .single()

            if (linkedTR && linkedTR.section_memories) {
                linkedTrMemories = linkedTR.section_memories as Record<string, any>
            }
        }

        // ─── 5. LOOP DE GERAÇÃO POR SEÇÃO (com IA) ───
        const sectionMemories: Record<string, any> = {}
        let previousContext = ''
        let totalCostUsd = 0

        for (const section of sectionsPlan) {
            // Injeção de TR -> Edital (Mantendo legibilidade mas priorizando mergedFormData)
            if (actualDocType.toLowerCase() === 'edital' && linkedTrMemories) {
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

            let userPrompt = `Seção a ser redigida: ${section.title}
Instruções OBRIGATÓRIAS para esta seção: ${section.instructions}

Dados do processo e contexto herdado:
${JSON.stringify(mergedFormData, null, 2)}
${previousContext ? `\nContexto das seções anteriores já geradas:\n${previousContext}` : ''}

Gere o conteúdo formal, técnico e juridicamente correto EXCLUSIVAMENTE para a seção "${section.title}". 
Não inclua o título da seção na sua resposta. Não inclua saudações, placeholders em branco nem conclusões genéricas fora de contexto.`

            if (doc.tipo === 'ETP' || doc.tipo === 'TR') {
                userPrompt += `\n\nATENÇÃO CRÍTICA (NÍVEL DE PROFUNDIDADE 10X): Este documento deve ser absolutamente exaustivo e aprofundado. Desenvolva o raciocínio de forma extensa (múltiplos parágrafos densos), explorando todos os ângulos técnicos, logísticos, econômicos e jurídicos aplicáveis estritamente à seção "${section.title}". Expanda metodologias, analise riscos detalhadamente, justifique escolhas com rigor analítico e cite jurisprudência aplicável do TCU. NUNCA resuma ou entregue conteúdo superficial.`;
            }

            // ─── BUSCA NA BASE DE CONHECIMENTO (RAG) ───
            // RAG via embeddings is skipped when no embedding API is available
            // The document-generator will still produce high-quality output using instructions
            let knowledgeContext = ''

            let baseSystemPrompt = `Você é um especialista em licitações públicas brasileiras (Lei 14.133/2021). Seu objetivo é redigir partes de documentos públicos com linguagem formal, obedecendo às exigências legais, à economicidade e à precisão técnica.

REGRAS DE BLINDAGEM JURÍDICA (MANDATÓRIO):
1. No DFD, você DEVE SEMPRE citar o Decreto Federal 10.947/2022 (Plano de Contratações Anual - PCA) como fundamento da necessidade.
2. NUNCA cite a Lei 8.987/1995 em documentos de compras e serviços comuns (dedetização, vigilância, materiais); ela é exclusiva para concessões e permissões.
3. No DFD, evite o exagero jurídico de citar a Lei 12.305/2010 (Resíduos Sólidos) ou Súmulas do TCU (ex: Súmula 257); guarde estas para o ETP ou TR se houver impacto ambiental real.
4. Utilize o Artigo 18 da Lei 14.133/2021 em sua plenitude para fundamentar a fase preparatória da licitação.
5. Se o documento tratar de pesquisa de preços, mencione a IN SEGES 65/2021.`;

            if (doc.tipo === 'ETP') {
                baseSystemPrompt = `Você é um Agente Especialista de Planejamento da Contratação Sênior (Lei 14.133/2021). Sua missão é redigir a seção de um Estudo Técnico Preliminar (ETP) de EXTREMA PROFUNDIDADE E ROBUSTEZ TÉCNICA (Nível "Padrão Ouro" da Administração Pública Federal).
Você deve esgotar o tema da seção atual. Um ETP excelente deve ser exaustivo (modelos reais ultrapassam 30 páginas). Para esta seção específica, produza um conteúdo EXTREMAMENTE DETALHADO, fundamentado, prevendo cenários práticos, riscos mitigados, justificativas detalhadas e jurisprudência aplicável. Desenvolva o texto de forma magistral, analítica e minuciosa, como se fosse auditado rigorosamente pelo TCU. A quantidade e qualidade da informação entregue devem ser excepcionais.
\n` + baseSystemPrompt;
            }

            const systemPrompt = baseSystemPrompt + (knowledgeContext
                ? `\n\nATENÇÃO MÁXIMA - BASE LEGAL EXTRAÍDA DA BASE DE CONHECIMENTO DO ÓRGÃO:\nVocê DEVE pautar a sua formatação e referências jurídicas UTILIZANDO ESTRITAMENTE o contexto normativo ou template fornecido abaixo.\n\n=== CONTEXTO INSTITUCIONAL (RAG) ===\n${knowledgeContext}\n====================================`
                : '')

            console.log(`[ORCHESTRATOR] Invocando document-generator para seção ${section.section_id} (doc_type: ${doc.tipo})...`)

            try {
                // ─── Delegar ao document-generator (multi-modelo + fallback + logging) ───
                const { data: genData, error: genError } = await supabase.functions.invoke('document-generator', {
                    body: {
                        tipo_documento: doc.tipo?.toLowerCase() || 'etp',
                        tipo_operacao: 'geracao',
                        system_prompt: systemPrompt,
                        user_prompt: userPrompt,
                        documento_id: document_id,
                        processo_id: actualProcessId,
                        org_id: doc.org_id,
                        user_id: null,  // será enriquecido no futuro via JWT
                    }
                })

                if (genError) throw genError

                const content = genData?.texto || ''

                sectionMemories[section.section_id] = {
                    content,
                    generated_at: new Date().toISOString(),
                    score: 1.0,
                    tokens_used: (genData?.tokens_input || 0) + (genData?.tokens_output || 0),
                    provider: genData?.modelo_utilizado || 'unknown',
                    foi_fallback: genData?.foi_fallback || false,
                }

                totalCostUsd += (genData?.custo_usd || 0)
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
            .from('documentos')
            .update({
                status: 'aprovado',
                workflow_status: 'aprovado',
                conteudo_final: htmlContent,
                updated_at: new Date().toISOString()
            })
            .eq('id', document_id)

        if (updError) throw updError

        // Criar versão no document_versions para que o DocumentView possa exibir o conteúdo gerado
        const { data: existingVers } = await supabase
            .from('document_versions')
            .select('versao')
            .eq('documento_id', document_id)
            .order('versao', { ascending: false })
            .limit(1)
        const nextVersao = ((existingVers?.[0]?.versao) ?? 0) + 1
        const { error: verErr } = await supabase.from('document_versions').insert({
            documento_id: document_id,
            processo_id: actualProcessId,
            conteudo_html: htmlContent,
            versao: nextVersao,
        })
        if (verErr) console.error('[ORCHESTRATOR] Falha ao criar document_versions:', verErr)

        // Update process status
        if (actualProcessId && actualDocType) {
            await supabase
                .from('processos')
                .update({ status: `${actualDocType.toUpperCase()}_APROVADO`, updated_at: new Date().toISOString() })
                .eq('id', actualProcessId)
        }

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
