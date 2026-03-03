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
        const { query, quantidade } = body;

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const limit = quantidade || 5;
        const res = await fetch(`https://dados-abertos.apps.tcu.gov.br/api/acordao/recupera-acordaos?inicio=0&quantidade=${limit}`);

        if (!res.ok) throw new Error('Falha ao buscar TCU');
        const data = await res.json();

        // mock filter
        const qLower = (query || '').toLowerCase();
        let list = (data.itens || data || []).filter((a: any) =>
            String(a.titulo || a.sumario || '').toLowerCase().includes(qLower)
        ).map((a: any) => ({
            numero: a.numeroAcordao,
            ano: a.anoAcordao,
            titulo: a.titulo,
            sumario: a.sumario,
            relator: a.relator,
            data: a.dataSessao,
            urlPDF: a.urlArquivoPDF || `https://pesquisa.apps.tcu.gov.br/#/documento/acordao/${a.numeroAcordao}/${a.anoAcordao}`
        }));

        // Não registra log de auditoria via regra do checklist
        return new Response(JSON.stringify({ acordaos: list }), {
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
