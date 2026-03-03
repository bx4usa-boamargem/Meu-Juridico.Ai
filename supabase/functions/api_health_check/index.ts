import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function checkApi(name: string, p: Promise<Response>): Promise<{ name: string, status: string, latencia_ms: number, erro?: string }> {
    const start = Date.now();
    try {
        const res = await p;
        const lat = Date.now() - start;
        if (!res.ok) return { name, status: 'ERRO', latencia_ms: lat, erro: `HTTP ${res.status}` };
        if (lat > 5000) return { name, status: 'LENTO', latencia_ms: lat };
        return { name, status: 'OK', latencia_ms: lat };
    } catch (err: any) {
        return { name, status: 'ERRO', latencia_ms: Date.now() - start, erro: err.message };
    }
}

function timeout(ms: number) {
    return new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const tests = [
            checkApi('PNCP', Promise.race([fetch('https://pncp.gov.br/api/pncp/v1/orgaos/00394460000141/compras?dataInicial=20240101&dataFinal=20241231&pagina=1'), timeout(8000)])),
            checkApi('ComprasGov', Promise.race([fetch('https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/1_consultarMaterial?pagina=1'), timeout(8000)])),
            checkApi('LexML', Promise.race([fetch('https://www.lexml.gov.br/busca/SRU?operation=searchRetrieve&version=1.1&query=urn+any+14133+and+date+any+2021&maximumRecords=5&startRecord=1'), timeout(8000)])),
            checkApi('TCU', Promise.race([fetch('https://dados-abertos.apps.tcu.gov.br/api/acordao/recupera-acordaos?inicio=0&quantidade=3'), timeout(8000)])),
            checkApi('Planalto', Promise.race([fetch('https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm'), timeout(8000)])),

            // LLMs tests
            checkApi('Anthropic', Promise.race([fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '', 'anthropic-version': '2023-06-01' },
                body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 10, messages: [{ role: 'user', content: 'Test' }] })
            }), timeout(8000)])),
            checkApi('Gemini', Promise.race([fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${Deno.env.get('GOOGLE_GEMINI_API_KEY') || ''}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: 'Test' }] }] })
            }), timeout(8000)])),
            checkApi('Gemini Emb', Promise.race([fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${Deno.env.get('GOOGLE_GEMINI_API_KEY') || ''}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'models/gemini-embedding-001', content: { parts: [{ text: 'test' }] } })
            }), timeout(8000)])),
            checkApi('OpenAI', Promise.race([fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY') || ''}` },
                body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 10, messages: [{ role: 'user', content: 'Test' }] })
            }), timeout(8000)]))
        ];

        const results = await Promise.allSettled(tests);
        const apis = results.map(r => r.status === 'fulfilled' ? r.value : { name: 'Unknown', status: 'ERRO', latencia_ms: 0, erro: 'Fatal' });
        const total_ok = apis.filter(a => a.status === 'OK' || a.status === 'LENTO').length;

        return new Response(JSON.stringify({
            timestamp: new Date().toISOString(),
            apis,
            total_ok,
            total_erro: apis.length - total_ok
        }), {
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
