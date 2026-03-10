import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de doc_type → benchmark keys
const DOC_TYPE_MAP: Record<string, { manual: string; ia: string }> = {
    dfd: { manual: 'tempo_dfd_manual_horas', ia: 'tempo_dfd_ia_minutos' },
    etp: { manual: 'tempo_etp_manual_horas', ia: 'tempo_etp_ia_minutos' },
    tr: { manual: 'tempo_tr_manual_horas', ia: 'tempo_tr_ia_minutos' },
    mapa_risco: { manual: 'tempo_mapa_risco_manual_horas', ia: 'tempo_mapa_risco_ia_minutos' },
    pesquisa_precos: { manual: 'tempo_pesquisa_precos_manual_horas', ia: 'tempo_pesquisa_precos_ia_minutos' },
    edital: { manual: 'tempo_edital_manual_horas', ia: 'tempo_edital_ia_minutos' },
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const { org_id, periodo_dias } = await req.json()
        if (!org_id) throw new Error('org_id é obrigatório')

        // ── 1. Carregar benchmarks ──
        const { data: benchmarks } = await supabase
            .from('roi_benchmarks')
            .select('indicador, valor')

        const bm: Record<string, number> = {}
        for (const b of benchmarks || []) bm[b.indicador] = Number(b.valor)

        // ── 2. Buscar documentos do órgão ──
        const dateFilter = periodo_dias
            ? new Date(Date.now() - periodo_dias * 86_400_000).toISOString()
            : null

        // Buscar processos do org_id (created_by ou org_id nos metadados do user)
        let docsQuery = supabase
            .from('documentos')
            .select('id, tipo, status, created_at, processo_id')

        if (dateFilter) docsQuery = docsQuery.gte('created_at', dateFilter)

        // Filtrar por processos vinculados ao org
        const { data: processoIds } = await supabase
            .from('processos')
            .select('id')
            .eq('created_by', org_id)

        if (processoIds && processoIds.length > 0) {
            const ids = processoIds.map((p: any) => p.id)
            docsQuery = docsQuery.in('processo_id', ids)
        }

        const { data: docs } = await docsQuery
        const totalDocs = docs?.length ?? 0

        // ── 3. Calcular por tipo ──
        const countsByType: Record<string, number> = {}
        for (const doc of docs || []) {
            const t = (doc.tipo || 'other').toLowerCase()
            countsByType[t] = (countsByType[t] || 0) + 1
        }

        const porTipo: Array<{
            tipo: string
            quantidade: number
            tempo_manual_horas: number
            tempo_ia_horas: number
            economia_horas: number
            economia_brl: number
        }> = []

        let totalHorasManual = 0
        let totalHorasIA = 0
        const custoServidor = bm['custo_hora_servidor_brl'] || 85

        for (const [tipo, qty] of Object.entries(countsByType)) {
            const keys = DOC_TYPE_MAP[tipo]
            if (!keys) continue

            const manualHoras = (bm[keys.manual] || 4) * qty
            const iaHoras = ((bm[keys.ia] || 30) / 60) * qty
            const economiaH = manualHoras - iaHoras
            const economiaBrl = economiaH * custoServidor

            totalHorasManual += manualHoras
            totalHorasIA += iaHoras

            porTipo.push({
                tipo: tipo.toUpperCase(),
                quantidade: qty,
                tempo_manual_horas: Math.round(manualHoras * 10) / 10,
                tempo_ia_horas: Math.round(iaHoras * 10) / 10,
                economia_horas: Math.round(economiaH * 10) / 10,
                economia_brl: Math.round(economiaBrl),
            })
        }
        porTipo.sort((a, b) => b.economia_horas - a.economia_horas)

        // ── 4. Métricas globais ──
        const horasEconomizadas = totalHorasManual - totalHorasIA
        const diasUteisEquivalentes = Math.round((horasEconomizadas / 8) * 10) / 10
        const valorTempoEconomizado = Math.round(horasEconomizadas * custoServidor)
        const multiplicador = totalHorasIA > 0
            ? Math.round((totalHorasManual / totalHorasIA) * 10) / 10
            : 1

        // Impugnações evitadas
        const taxaImpugSem = (bm['taxa_impugnacao_sem_ia_pct'] || 12) / 100
        const taxaImpugCom = (bm['taxa_impugnacao_com_ia_pct'] || 2) / 100
        const custoImpug = bm['custo_medio_impugnacao_brl'] || 8500
        const impugsEvitadas = Math.max(0, Math.round((taxaImpugSem - taxaImpugCom) * totalDocs))
        const economiaImpugs = Math.round(impugsEvitadas * custoImpug)

        // Retrabalho evitado
        const pctRet = ((bm['taxa_retrabalho_sem_ia_pct'] || 35) - (bm['taxa_retrabalho_com_ia_pct'] || 5)) / 100
        const custRet = bm['custo_medio_retrabalho_brl'] || 2500
        const econRetrab = Math.round(pctRet * totalDocs * custRet)

        const economiaTotal = valorTempoEconomizado + economiaImpugs + econRetrab

        // ── 5. Métricas de qualidade (heurística baseada em status dos documentos) ──
        const totalCitacoes = Math.floor(totalDocs * 3.2) // estimativa média de citações por doc
        const docsComFundamentacao = (docs || []).filter((d: any) => d.status !== 'rascunho').length

        // ── 6. Cadeia temporal (últimos 6 meses por mês) ──
        const historico: Array<{ mes: string; documentos: number; horas_economizadas: number; economia_brl: number }> = []
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const label = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
            const nextM = new Date(d.getFullYear(), d.getMonth() + 1, 1)
            const docsNoMes = (docs || []).filter(doc => {
                const c = new Date(doc.created_at)
                return c >= d && c < nextM
            })
            const hEco = (docsNoMes.length * horasEconomizadas) / Math.max(totalDocs, 1)
            historico.push({
                mes: label,
                documentos: docsNoMes.length,
                horas_economizadas: Math.round(hEco * 10) / 10,
                economia_brl: Math.round(hEco * custoServidor),
            })
        }

        // ── 7. Meta mensal (simples) ──
        const mesAtual = new Date()
        const inicioDeMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1)
        const docsMes = (docs || []).filter(d => new Date(d.created_at) >= inicioDeMes).length
        const metaProcessosMes = 10

        return new Response(
            JSON.stringify({
                // Tempo
                horas_economizadas_total: Math.round(horasEconomizadas),
                dias_uteis_equivalentes: diasUteisEquivalentes,
                valor_tempo_economizado_brl: valorTempoEconomizado,

                // Financeiro
                economia_retrabalho_brl: econRetrab,
                economia_impugnacoes_brl: economiaImpugs,
                economia_total_brl: economiaTotal,

                // Produtividade
                multiplicador_produtividade: multiplicador,
                documentos_gerados: totalDocs,
                tempo_que_levaria_sem_ia_dias: Math.round((totalHorasManual / 8) * 10) / 10,
                tempo_com_ia_dias: Math.round((totalHorasIA / 8) * 100) / 100,

                // Qualidade
                impugnacoes_estimadas_evitadas: impugsEvitadas,
                artigos_lei_citados_total: totalCitacoes,
                conformidade_score: 94,
                documentos_com_fundamentacao_completa: docsComFundamentacao,

                // por tipo
                por_tipo: porTipo,

                // histórico
                historico,

                // metas
                meta_processos_mes: metaProcessosMes,
                processos_concluidos_mes: docsMes,
                pct_meta: Math.round((docsMes / metaProcessosMes) * 100),

                // benchmarks disponíveis para exibição
                benchmarks: {
                    custo_hora_servidor: custoServidor,
                    processos_sem_ia_mes: bm['processos_servidor_mes_sem_ia'] || 2.5,
                    processos_com_ia_mes: bm['processos_servidor_mes_com_ia'] || 9,
                    taxa_retrabalho_sem_ia: bm['taxa_retrabalho_sem_ia_pct'] || 35,
                    taxa_retrabalho_com_ia: bm['taxa_retrabalho_com_ia_pct'] || 5,
                    taxa_impugnacao_sem_ia: bm['taxa_impugnacao_sem_ia_pct'] || 12,
                    taxa_impugnacao_com_ia: bm['taxa_impugnacao_com_ia_pct'] || 2,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err: any) {
        console.error('[roi-calculator]', err)
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
