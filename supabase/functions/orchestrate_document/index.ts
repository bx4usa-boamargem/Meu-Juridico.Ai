// ============================================================
// MEUJURÍDICO.AI — Edge Function: orchestrate_document
// Entry point para o Supabase Edge Functions
//
// Responsabilidade:
// - Receber request HTTP
// - Validar autenticação e payload
// - Delegar ao orchestrator
// - Retornar status da execução
//
// NENHUMA chamada direta à Claude nesta camada.
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { orchestrateDocument } from '../../orchestrator/index.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Preflight CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Criar cliente Supabase autenticado
        const supabaseUrl = Deno.env.get('MEUJURIDICO_URL') || Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('MEUJURIDICO_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const authHeader = req.headers.get('Authorization')!;

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } },
        });

        // 2. Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Não autorizado', details: authError?.message }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. Validar payload
        const body = await req.json();
        const { document_id, force_regenerate, section_ids } = body;

        if (!document_id) {
            return new Response(
                JSON.stringify({ error: 'document_id é obrigatório' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 4. Verificar se o usuário pertence ao mesmo org do documento
        const { data: docCheck, error: docError } = await supabase
            .from('documents')
            .select('org_id')
            .eq('id', document_id)
            .single();

        if (docError || !docCheck) {
            return new Response(
                JSON.stringify({ error: 'Documento não encontrado', details: docError }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { data: userCheck } = await supabase
            .from('users')
            .select('org_id, role')
            .eq('id', user.id)
            .single();

        if (!userCheck || userCheck.org_id !== docCheck.org_id) {
            return new Response(
                JSON.stringify({ error: 'Acesso negado: documento pertence a outro órgão' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 5. Executar pipeline via orchestrator (NENHUMA chamada direta à Claude)
        const result = await orchestrateDocument(
            supabase,
            document_id,
            user.id,
            {
                forceRegenerate: force_regenerate || false,
                sectionIds: section_ids,
            }
        );

        // 6. Retornar resultado
        return new Response(
            JSON.stringify(result),
            {
                status: result.success ? 200 : 207, // 207 = Multi-Status (parcialmente ok)
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (err) {
        console.error('orchestrate_document error:', err);
        return new Response(
            JSON.stringify({ error: 'Erro interno', details: String(err) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
