import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabase = createClient(supabaseUrl!, supabaseKey!)

        console.log("Starting Weekly AI Extraction: State Gazettes (SP, MG, RJ, PR)")

        // 1. Weekly Intelligence (Mocked Intelligence Extraction)
        // In a real scenario, this would trigger a crawler per state
        const mockWeeklyIntelligence = [
            {
                orgao_emissor: 'TCE-SP',
                tipo_decisao: 'Acórdão',
                assunto: 'Restrições em Editais de Saúde',
                data_decisao: new Date().toISOString().split('T')[0],
                texto_resumo: 'TCE-SP recomenda que prefeituras evitem exigir marcas específicas em editais de medicamentos sem justificativa técnica robusta.',
                impacto_risco: 'Alto',
                tags: ['Saúde', 'Medicamentos', 'Restrição']
            }
        ]

        await supabase.from('jurisprudencia_espelho').insert(mockWeeklyIntelligence)

        return new Response(
            JSON.stringify({
                message: 'Weekly AI Extraction executed successfully',
                intelligence_records: mockWeeklyIntelligence.length
            }),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error("Weekly Extraction Error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
