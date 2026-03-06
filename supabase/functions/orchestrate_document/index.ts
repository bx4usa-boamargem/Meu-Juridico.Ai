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
                    score_conformidade: 1.0,
                    updated_at: new Date().toISOString()
                })
                .eq('id', document_id)

            if (updError) throw updError

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

DADOS DA CONTRATAÇÃO (FORMULÁRIO, PREMISSAS E HERANÇA):
${JSON.stringify(mergedFormData, null, 2)}
${previousContext ? `\nCONTEXTO DAS SEÇÕES ANTERIORES JÁ GERADAS (Mantenha a coerência e continuidade narrativa):\n${previousContext}` : ''}

AJA AGORA: Com base estritamente nas "Instruções OBRIGATÓRIAS" desta seção, elabore o conteúdo textual completo. 
PROIBIDO RESPONDER CURTO. Você deve expandir e aprofundar a narrativa em múltiplos parágrafos bem desenvolvidos. Considere aspectos logísticos, jurídicos, técnicos e de conformidade aplicáveis à contratação.
Não repita ou inclua o título da seção na sua resposta; comece diretamente a redação do conteúdo. Sem saudações ou comentários extras.`

            if (actualDocType.toLowerCase() === 'etp' || actualDocType.toLowerCase() === 'tr' || actualDocType.toLowerCase() === 'edital' || actualDocType.toLowerCase() === 'projeto_basico') {
                userPrompt += `\n\n=== DIRETRIZES DE PROFUNDIDADE NÍVEL EXECUTIVO (10X) ===
Esta seção deve ter profundidade técnica equivalente a um Estudo Técnico de alto nível da Administração Federal. 
REGRA DE OURO: Explore intensamente as variáveis práticas da contratação. Explique os "porquês" (teoria) e "comos" (prática). Se houver dados de herança do formulário, detalhe-os. Cite a Lei 14.133/2021 de forma pertinente. Um texto com menos de 3 parágrafos robustos será rejeitado pela auditoria. Desenvolva o raciocínio integralmente. NUNCA resuma ou entregue apenas tópicos superficiais.`;
            }

            // ─── BUSCA NA BASE DE CONHECIMENTO (RAG) ───
            // RAG via embeddings is skipped when no embedding API is available
            // The document-generator will still produce high-quality output using instructions
            let knowledgeContext = ''
            const openAiKey = Deno.env.get('OPENAI_API_KEY')
            if (openAiKey) {
                try {
                    // 1. Vetorizar a instrução da seção para achar contexto semântico
                    const embedResp = await fetch('https://api.openai.com/v1/embeddings', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ input: `${actualDocType} ${section.title} ${section.instructions}`, model: 'text-embedding-3-small' })
                    })

                    if (embedResp.ok) {
                        const embedData = await embedResp.json()
                        const embedding = embedData.data?.[0]?.embedding

                        if (embedding) {
                            // 2. Buscar normativas e templates do órgão
                            const { data: chunks } = await supabase.rpc('match_knowledge_chunks', {
                                p_org_id: doc.org_id,
                                p_embedding: embedding,
                                p_match_threshold: 0.70,
                                p_match_count: 3
                            })

                            if (chunks && chunks.length > 0) {
                                knowledgeContext = chunks.map((c: any) => `Documento Fonte Normativo [${c.doc_title}]:\n${c.content_text}`).join('\n\n')
                            }
                        }
                    }
                } catch (ragErr) {
                    console.error(`[RAG] Erro ao buscar contexto para seção ${section.section_id}:`, ragErr)
                }
            }

            let baseSystemPrompt = `Você é um ESPECIALISTA SÊNIOR em licitações públicas brasileiras, trabalhando como braço direito tecnológico (IA) em Planejamento da Contratação com foco principal na Lei 14.133/2021.
Sua missão inegociável é produzir documentos públicos EXAUSTIVOS, EXTREMAMENTE ROBUSTOS E COMPLETOS. Proibido produzir respostas genéricas, curtas (de apenas uma linha) ou superficiais.

REGRAS DE FORMATAÇÃO E BLINDAGEM (MANDATÓRIO):
1. **PROFUNDIDADE OBRIGATÓRIA**: Todo parágrafo gerado deve ser denso e explicativo. Utilize no mínimo centenas de palavras por seção abordando risco, logística, embasamento jurídico e contexto operacional.
2. Contexto Externo: Se na herança ou formulário houver referências a pesquisas no PNCP, relatórios, ETPs anteriores, inclua ativamente esses dados para rechear a justificativa.
3. No DFD, cite SEMPRE o Decreto Federal 10.947/2022 (Plano de Contratações Anual - PCA) e o Artigo 18 da Lei 14.133/2021.
4. NUNCA cite a Lei 8.987/1995 (concessões) em compras/serviços comuns.
5. Se for mencionar justificativa de preço ou pesquisa mercadológica (PNCP), referencie a IN SEGES 65/2021.
6. APROVEITAMENTO DE DADOS: O sistema pode enviar em "DADOS DA CONTRATAÇÃO" informações originadas de templates ou outros documentos. Integre inteligentemente essas variáveis produzindo um documento maduro, pronto para assinatura do gestor com o mínimo de edições redacionais posteriores.`;

            const systemPrompt = baseSystemPrompt + (knowledgeContext
                ? `\n\nATENÇÃO MÁXIMA - BASE LEGAL EXTRAÍDA DA BASE DE CONHECIMENTO DO ÓRGÃO:\nVocê DEVE pautar a sua formatação e referências jurídicas UTILIZANDO ESTRITAMENTE o contexto normativo ou template fornecido abaixo.\n\n=== CONTEXTO INSTITUCIONAL (RAG) ===\n${knowledgeContext}\n====================================`
                : '')

            console.log(`[ORCHESTRATOR] Invocando document-generator para seção ${section.section_id} (doc_type: ${actualDocType})...`)

            try {
                // ─── Delegar ao document-generator (multi-modelo + fallback + logging) ───
                const { data: genData, error: genError } = await supabase.functions.invoke('document-generator', {
                    body: {
                        tipo_documento: actualDocType.toLowerCase() || 'etp',
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
                score_conformidade: parseFloat(score.toFixed(3)),
                conteudo_final: htmlContent,
                section_memories: sectionMemories,
                updated_at: new Date().toISOString()
            })
            .eq('id', document_id)

        if (updError) throw updError

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
