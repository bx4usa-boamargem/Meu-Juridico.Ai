import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
        const { query, modalidade, dataInicial, dataFinal } = body;

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const authHeader = req.headers.get('Authorization')!;
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        const hoje = new Date();
        const haUmAno = new Date();
        haUmAno.setFullYear(hoje.getFullYear() - 1);

        const dtInicio = dataInicial || haUmAno.toISOString().split('T')[0].replace(/-/g, '');
        const dtFim = dataFinal || hoje.toISOString().split('T')[0].replace(/-/g, '');

        const pncpUrl = `https://pncp.gov.br/api/pncp/v1/orgaos/00394460000141/compras?dataInicial=${dtInicio}&dataFinal=${dtFim}&pagina=1`;

        const res = await fetch(pncpUrl);
        if (!res.ok) throw new Error('Falha ao conectar na API do PNCP');
        const data = await res.json();

        // mock filtering/mapping
        let resultados = (data.data || data || []).filter((c: any) =>
            String(c.objetoCompra || '').toLowerCase().includes((query || '').toLowerCase())
        ).map((c: any) => ({
            numero: c.numeroCompra,
            objeto: c.objetoCompra,
            valor: c.valorTotalEstimado,
            modalidade: c.modalidadeNome,
            orgao: c.orgaoEntidade?.razaoSocial,
            data: c.dataPublicacaoPncp,
            url: c.linkSistemaOrigem || c.linkPdfAtosOriginais
        }));

        if (user) {
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                org_id: user.user_metadata?.org_id || null,
                action: 'api.pncp.searched',
                entity: 'api_query',
                entity_id: 'pncp',
                new_value: { query, resultados_count: resultados.length },
                ip_address: req.headers.get('x-forwarded-for') || '127.0.0.1'
            });
        }

        return new Response(JSON.stringify({ contratos: resultados, contratacoes: [], total: resultados.length }), {
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
