import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { query, numero, ano } = body;

        let queryStr = `operation=searchRetrieve&version=1.1&query=urn+any+14133+and+date+any+2021`;
        if (numero) queryStr = `operation=searchRetrieve&version=1.1&query=urn+any+${numero}+and+date+any+${ano || 2021}`;

        const res = await fetch(`https://www.lexml.gov.br/busca/SRU?${queryStr}&maximumRecords=5&startRecord=1`);
        if (!res.ok) throw new Error('Falha ao processar LexML');
        const xmlText = await res.text();

        // mock parse xml to simple array for frontend
        const normas = [];
        if (xmlText.includes('14.133')) {
            normas.push({
                titulo: 'Lei 14.133/2021 - Lei de Licitações e Contratos',
                tipo: 'Lei',
                numero: '14133',
                ano: 2021,
                urn: 'urn:lex:br:federal:lei:2021-04-01;14133',
                descricao: 'Lei de Licitações e Contratos Administrativos.',
                url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm'
            });
        }

        return new Response(JSON.stringify({ normas }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
