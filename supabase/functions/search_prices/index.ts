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
        const { descricao, tipo } = body;

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const authHeader = req.headers.get('Authorization')!;
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        const isMaterial = tipo !== 'servico';
        const endpoint = isMaterial ? '1_consultarMaterial' : '2_consultarServico';

        const res = await fetch(`https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/${endpoint}?pagina=1`);
        if (!res.ok) throw new Error('Falha ao conectar ComprasGov');
        const data = await res.json();

        // mock stats
        const itensFiltrados = (data.itens || data || []).filter((i: any) =>
            String(i.descricaoItem || '').toLowerCase().includes((descricao || '').toLowerCase())
        );

        let sum = 0, menor = Infinity, maior = 0;
        itensFiltrados.forEach((i: any) => {
            const v = i.valorUnitario || 0;
            sum += v;
            if (v < menor) menor = v;
            if (v > maior) maior = v;
        });

        const num = itensFiltrados.length;
        const media = num ? sum / num : 0;

        const calc = {
            itens: itensFiltrados.slice(0, 10), // limita
            media,
            mediana: media, // simulada para a POC
            menor: menor === Infinity ? 0 : menor,
            maior
        };

        if (user) {
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                org_id: user.user_metadata?.org_id || null,
                action: 'api.compras.prices_searched',
                entity: 'api_query',
                entity_id: 'comprasgov',
                new_value: { query: descricao, resultados: num, media },
                ip_address: req.headers.get('x-forwarded-for') || '127.0.0.1'
            });
        }

        return new Response(JSON.stringify(calc), {
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
