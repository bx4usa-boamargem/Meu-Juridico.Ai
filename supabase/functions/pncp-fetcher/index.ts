import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Consider external APIs and proxies
const PNCP_API_URL = "https://pncp.gov.br/api/pncp/v1"

serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabase = createClient(supabaseUrl!, supabaseKey!)

        // Parameters for scraping, default SP
        const uf = 'SP'
        const today = new Date()
        const fromDate = new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0] // Yesterday
        const toDate = new Date().toISOString().split('T')[0]

        // Endpoint for Contratos with status = homologado might be:
        // /contratos?dataInicial={fromDate}&dataFinal={toDate}&uf={uf}
        // Alternatively, fetching through the /orgaos/{cnpj}/contratos or using the latest items API.

        // As a demonstration for the pipeline, we fetch the latest updated items
        const queryUrl = `${PNCP_API_URL}/contratos?dataInicial=${fromDate}20260101&dataFinal=${toDate}&uf=${uf}&pagina=1&tamanhoPagina=50`

        // Log start
        console.log(`Starting PNCP Fetch for ${uf} from ${fromDate} to ${toDate}`)

        // Note: Actual PNCP api fetching code would execute here
        // For this architecture demo, we mock the insertion based on the Horizontina Edital Data
        const mockData = [
            {
                objeto: 'SERVIÇO DE IMPLANTAÇÃO DOS SISTEMAS, MIGRAÇÃO DE DADOS E TREINAMENTO DOS USUÁRIOS (SISTEMAS ADMINISTRATIVOS DA PM, CMV, RPPS, SAÚDE)',
                valor_unitario: 125000.00,
                unidade_medida: 'UN',
                orgao_nome: 'MUNICÍPIO DE HORIZONTINA',
                estado: 'RS',
                data_homologacao: new Date().toISOString(),
                cnpj_vencedor: '87.612.834/0001-36',
                fonte: 'PNCP_MOCK_EXTRACTOR'
            },
            {
                objeto: 'MODULO DE PLANEJAMENTO E ORÇAMENTO - GESTAO PUBLICA',
                valor_unitario: 5400.00,
                unidade_medida: 'MES',
                orgao_nome: 'MUNICÍPIO DE HORIZONTINA',
                estado: 'RS',
                data_homologacao: new Date().toISOString(),
                cnpj_vencedor: '87.612.834/0001-36',
                fonte: 'PNCP_MOCK_EXTRACTOR'
            }
        ]

        // Insert to pncp_price_benchmarks
        const { data: insertedPrices, error: priceError } = await supabase
            .from('pncp_price_benchmarks')
            .insert(mockData)

        if (priceError) throw priceError

        return new Response(
            JSON.stringify({
                message: 'Cron Job executed successfully',
                records_fetched: mockData.length
            }),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error("PNCP Fetcher Error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
