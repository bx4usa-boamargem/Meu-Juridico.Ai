import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================
// MONITORING SCHEDULER — Cron diário (6h UTC)
// Verifica se é hora de executar conforme frequência configurada
// e dispara monitoring_agent se necessário.
// ============================================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        const { data: config } = await supabase
            .from('monitoring_config')
            .select('id, frequency, next_run_at, is_active')
            .single()

        if (!config) {
            return new Response(
                JSON.stringify({ status: 'no_config', message: 'Nenhuma configuração de monitoramento encontrada.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!config.is_active) {
            return new Response(
                JSON.stringify({ status: 'paused', message: 'Monitoramento pausado pelo administrador.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const now = new Date()
        const shouldRun = !config.next_run_at || new Date(config.next_run_at) <= now

        if (!shouldRun) {
            return new Response(
                JSON.stringify({
                    status: 'skipped',
                    message: 'Ainda não é hora de executar.',
                    next_run_at: config.next_run_at,
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Disparar o monitoring_agent
        const { data, error } = await supabase.functions.invoke('monitoring_agent')

        if (error) {
            console.error('[SCHEDULER] Error invoking monitoring_agent:', error)
            return new Response(
                JSON.stringify({ status: 'error', message: String(error) }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Calcular próxima execução conforme frequência
        const nextRun = new Date()
        switch (config.frequency) {
            case 'daily':
                nextRun.setDate(nextRun.getDate() + 1)
                break
            case 'weekly':
                nextRun.setDate(nextRun.getDate() + 7)
                break
            case 'monthly':
                nextRun.setMonth(nextRun.getMonth() + 1)
                break
            default:
                nextRun.setDate(nextRun.getDate() + 7) // fallback semanal
        }

        // Atualizar config com próxima execução
        await supabase
            .from('monitoring_config')
            .update({
                last_run_at: now.toISOString(),
                next_run_at: nextRun.toISOString(),
                updated_at: now.toISOString(),
            })
            .eq('id', config.id)

        return new Response(
            JSON.stringify({
                status: 'executed',
                last_run: now.toISOString(),
                next_run: nextRun.toISOString(),
                agent_result: data,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('[SCHEDULER] Unexpected error:', error)
        return new Response(
            JSON.stringify({ status: 'error', message: String(error) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
