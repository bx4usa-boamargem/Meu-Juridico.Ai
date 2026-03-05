import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskInput {
    objeto: string;
    doc_type: 'tr' | 'etp' | 'contrato';
    valor_estimado: number;
    modalidade: string;
    processo_id: string;
}

// Handler Principal
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body: RiskInput = await req.json();
        const { objeto, doc_type, valor_estimado, modalidade, processo_id } = body;

        if (!objeto?.trim()) {
            return new Response(JSON.stringify({ error: '`objeto` é obrigatório' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const openAiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('ANTHROPIC_API_KEY');

        // Conectar ao Supabase
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Buscar na base de conhecimento (modelos similares)
        // Faremos uma busca textual simples por aproximação no objeto
        const termoBusca = objeto.split(/\s+/).filter(w => w.length > 3)[0] || objeto;

        const { data: modelos, error: errModelos } = await supabase
            .from('document_templates')
            .select('conteudo_texto')
            .eq('tipo', 'Mapa de Riscos')
            .ilike('objeto', `%${termoBusca}%`)
            .limit(3);

        let contextoModelos = '';
        if (modelos && modelos.length > 0) {
            contextoModelos = "\nModelos de referência na base de conhecimento:\n" +
                modelos.map((m, i) => `Modelo ${i + 1}: ${m.conteudo_texto.substring(0, 1000)}...`).join('\n\n');
        }

        // 2. Buscar alertas de monitoramento (radar_intelligence) simulado ou real
        let contextoAlertas = '';
        try {
            const { data: alertas } = await supabase
                .from('monitoring_alerts')
                .select('summary')
                .ilike('title', `%${termoBusca}%`)
                .limit(2);

            if (alertas && alertas.length > 0) {
                contextoAlertas = "\nAlertas recentes do TCU/Órgãos de Controle (Radar):\n" +
                    alertas.map((a: any) => `- ${a.summary}`).join('\n');
            }
        } catch (_) {
            // Ignora erro se a tabela não existir ainda
        }

        // 3. Chamar AI usando o modelo adequado (usando OpenAI como fallback se configurado no projeto)
        if (!openAiKey) {
            throw new Error("Chave de API não configurada (OPENAI_API_KEY ou ANTHROPIC_API_KEY).");
        }

        const prompt = `Você é um especialista em licitações públicas brasileiras, atuando como consultor de riscos.
Gere uma Matriz de Riscos detalhada para a contratação abaixo.
A saída deve ser EXATAMENTE um JSON, sem markdown ou texto fora do JSON.

Contexto da Contratação:
- Objeto: ${objeto}
- Tipo de Documento-Base: ${doc_type.toUpperCase()}
- Valor Estimado: R$ ${valor_estimado}
- Modalidade: ${modalidade}
${contextoModelos}
${contextoAlertas}

Estrutura JSON esperada:
{
  "riscos": [
    {
      "id": "R01",
      "categoria": "técnico" /* ou financeiro, jurídico, operacional, ambiental */,
      "descricao": "...",
      "causa": "...",
      "consequencia": "...",
      "probabilidade": "baixa" /* media, alta */,
      "impacto": "baixo" /* medio, alto */,
      "nivel": "baixo" /* medio, alto, critico */,
      "responsavel": "contratante" /* contratado, compartilhado */,
      "mitigacao": "Ação preventiva...",
      "contingencia": "Ação reativa...",
      "base_legal": "Referência legal (ex: Art... da Lei 14.133)"
    }
  ],
  "resumo_executivo": "Resumo de 1 a 2 parágrafos sobre os principais riscos...",
  "total_criticos": 0,
  "total_altos": 0
}

Mapeie os 5 principais riscos mais prováveis para esse objeto.`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o', // Sonnet ou GPT-4o equivalente
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.3,
            }),
            signal: AbortSignal.timeout(45000),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Erro na API de AI: ${res.status} - ${errorText}`);
        }

        const aiResult = await res.json();
        const content = aiResult.choices?.[0]?.message?.content;

        if (!content) throw new Error("Resposta vazia da IA");

        let parsedJson;
        try {
            parsedJson = JSON.parse(content);
        } catch (e) {
            throw new Error("A IA não retornou um JSON válido.");
        }

        return new Response(JSON.stringify(parsedJson), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err: any) {
        console.error('risk-map error:', err);
        return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
