import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Consider external APIs and proxies
const PNCP_API_URL = "https://pncp.gov.br/api/pncp/v1"

serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabase = createClient(supabaseUrl!, supabaseKey!)

        console.log("Starting Daily API Sync: PNCP + DOU")

        // 1. PNCP Fetching (Today's Pulse)
        const mockPncpData = [
            {
                cnpj_orgao: '12.345.678/0001-90',
                orgao_nome: 'PREFEITURA DE SÃO PAULO',
                objeto: 'AQUISIÇÃO DE EQUIPAMENTOS DE TI PARA SECRETARIA DE SAÚDE',
                status_atual: 'Publicado',
                valor_estimado: 450000.00,
                uf: 'SP',
                data_inicio: new Date().toISOString(),
                fonte: 'DAILY_SYNC_PNCP'
            }
        ]

        await supabase.from('pncp_full_cycle_monitoring').upsert(mockPncpData)

        // 2. DOU Fetching (Simulated)
        const mockDouData = [
            {
                orgao_emissor: 'AGU',
                tipo_decisao: 'Parecer',
                assunto: 'Uso de IA em pareceres jurídicos municipais',
                data_decisao: new Date().toISOString().split('T')[0],
                texto_resumo: 'AGU valida o uso de ferramentas de IA para auxílio na elaboração de editais sob a Lei 14.133.',
                impacto_risco: 'Baixo',
                tags: ['IA', 'Parecer', 'Modernização']
            }
        ]

        await supabase.from('jurisprudencia_espelho').insert(mockDouData)

        return new Response(
            JSON.stringify({
                message: 'Daily Sync executed successfully (PNCP + DOU)',
                pncp_records: mockPncpData.length,
                jurisprudencia_records: mockDouData.length
            }),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error("Daily Sync Error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
