import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceEntry {
    orgao: string;
    estado: string;
    data: string;
    valor_unitario: number;
    unidade: string;
    fonte: string;
    url: string;
}

interface InputBody {
    objeto: string;
    estado?: string;
    municipio?: string;
    periodo_meses?: number;
    unidade_medida?: string;
}

// ───────────────────────────────────────────────
// PASSO 1 — Buscar no PNCP
// ───────────────────────────────────────────────
async function fetchPNCP(objeto: string, estado: string, periodoMeses: number): Promise<PriceEntry[]> {
    const results: PriceEntry[] = [];

    try {
        const keywords = objeto.split(' ').filter(w => w.length > 3).slice(0, 3).join(' ');
        const dataFim = new Date().toISOString().split('T')[0];
        const dataIni = new Date(Date.now() - periodoMeses * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const url = `https://pncp.gov.br/api/pncp/v1/orgaos/compras?descricaoObjeto=${encodeURIComponent(keywords)}&uf=${estado}&dataInicio=${dataIni}&dataFim=${dataFim}&pagina=1&tamanhoPagina=50`;

        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
            console.warn('PNCP não retornou 200:', res.status);
            return results;
        }

        const data = await res.json();
        const items = data.data || data.items || data || [];

        for (const item of (Array.isArray(items) ? items.slice(0, 30) : [])) {
            const valor = parseFloat(item.valorUnitarioEstimado || item.valorTotalEstimado || '0');
            if (valor > 0) {
                results.push({
                    orgao: item.orgaoEntidade?.razaoSocial || item.orgao || 'N/I',
                    estado: item.uf || estado,
                    data: item.dataPublicacao || item.dataCriacao || new Date().toISOString().split('T')[0],
                    valor_unitario: valor,
                    unidade: item.unidadeMedida || 'unidade',
                    fonte: 'PNCP',
                    url: item.linkSistemaOrigem || `https://pncp.gov.br`,
                });
            }
        }
    } catch (err) {
        console.warn('Erro ao buscar PNCP:', err);
    }

    return results;
}

// ───────────────────────────────────────────────
// PASSO 2 — Buscar no Painel de Preços
// ───────────────────────────────────────────────
async function fetchPainelPrecos(objeto: string, estado: string): Promise<PriceEntry[]> {
    const results: PriceEntry[] = [];

    try {
        const url = `https://paineldeprecos.planejamento.gov.br/api/precos?descricao=${encodeURIComponent(objeto)}&uf=${estado}&pagina=1&quantidade=50`;
        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
            console.warn('Painel de Preços não retornou 200:', res.status);
            return results;
        }

        const data = await res.json();
        const items = data.resultado || data.data || data.items || [];

        for (const item of (Array.isArray(items) ? items.slice(0, 30) : [])) {
            const valor = parseFloat(item.precoUnitario || item.valorUnitario || '0');
            if (valor > 0) {
                results.push({
                    orgao: item.orgao || 'N/I',
                    estado: item.uf || estado,
                    data: item.dataReferencia || item.data || new Date().toISOString().split('T')[0],
                    valor_unitario: valor,
                    unidade: item.unidade || 'unidade',
                    fonte: 'Painel de Preços',
                    url: item.url || 'https://paineldeprecos.planejamento.gov.br',
                });
            }
        }
    } catch (err) {
        console.warn('Erro ao buscar Painel de Preços:', err);
    }

    return results;
}

// ───────────────────────────────────────────────
// PASSO 3 — Buscar na tabela interna price_references
// ───────────────────────────────────────────────
async function fetchInternal(
    supabase: ReturnType<typeof createClient>,
    objeto: string,
    estado: string,
    periodoMeses: number
): Promise<PriceEntry[]> {
    const termo = objeto.split(' ').filter(w => w.length > 3)[0] || objeto;

    const { data, error } = await supabase
        .from('price_references')
        .select('*')
        .ilike('objeto_normalizado', `%${termo}%`)
        .eq('estado', estado)
        .gte('data_contratacao', new Date(Date.now() - periodoMeses * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('data_contratacao', { ascending: false })
        .limit(50);

    if (error) {
        console.warn('Erro ao buscar price_references:', error.message);
        return [];
    }

    return (data || []).map((r: any) => ({
        orgao: r.orgao,
        estado: r.estado,
        data: r.data_contratacao,
        valor_unitario: parseFloat(r.valor_unitario),
        unidade: r.unidade_medida || 'unidade',
        fonte: r.fonte,
        url: r.url_fonte || '',
    }));
}

// ───────────────────────────────────────────────
// PASSO 4 — Calcular estatísticas com remoção de outliers
// ───────────────────────────────────────────────
function calcularEstatisticas(precos: number[]): {
    minimo: number; maximo: number; media: number;
    mediana: number; desvio_padrao: number; preco_referencia: number;
    outliers_removidos: number; precos_utilizados: number[];
} {
    if (precos.length === 0) {
        return {
            minimo: 0, maximo: 0, media: 0, mediana: 0,
            desvio_padrao: 0, preco_referencia: 0,
            outliers_removidos: 0, precos_utilizados: [],
        };
    }

    const media = precos.reduce((a, b) => a + b, 0) / precos.length;
    const variancia = precos.reduce((a, b) => a + Math.pow(b - media, 2), 0) / precos.length;
    const desvioPadrao = Math.sqrt(variancia);

    // Remover outliers: fora de 2 desvios padrão
    const saneados = precos.filter(p => Math.abs(p - media) <= 2 * desvioPadrao);
    const outliers_removidos = precos.length - saneados.length;

    if (saneados.length === 0) {
        return {
            minimo: 0, maximo: 0, media: 0, mediana: 0,
            desvio_padrao: 0, preco_referencia: 0,
            outliers_removidos, precos_utilizados: [],
        };
    }

    const sorted = [...saneados].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const mediana = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

    const mediaFinal = saneados.reduce((a, b) => a + b, 0) / saneados.length;
    const varianciaFinal = saneados.reduce((a, b) => a + Math.pow(b - mediaFinal, 2), 0) / saneados.length;

    return {
        minimo: Math.min(...saneados),
        maximo: Math.max(...saneados),
        media: Math.round(mediaFinal * 100) / 100,
        mediana: Math.round(mediana * 100) / 100,
        desvio_padrao: Math.round(Math.sqrt(varianciaFinal) * 100) / 100,
        preco_referencia: Math.round(mediana * 100) / 100,
        outliers_removidos,
        precos_utilizados: saneados,
    };
}

// ───────────────────────────────────────────────
// PASSO 5 — Análise com Claude Sonnet via AI Gateway
// ───────────────────────────────────────────────
async function gerarAnaliseIA(
    apiKey: string,
    objeto: string,
    estado: string,
    stats: ReturnType<typeof calcularEstatisticas>,
    precos: PriceEntry[]
): Promise<string> {
    const prompt = `Você é um especialista em licitações públicas brasileiras. Com base nos seguintes preços coletados para "${objeto}" no estado de ${estado}, gere uma análise de no máximo 3 parágrafos explicando: o valor de referência sugerido, a variação regional observada, e a fundamentação legal para uso da mediana como metodologia. Use linguagem técnica administrativa.

Dados:
- Preço de referência (mediana saneada): R$ ${stats.preco_referencia}
- Mínimo: R$ ${stats.minimo} | Máximo: R$ ${stats.maximo}
- Média: R$ ${stats.media} | Desvio padrão: R$ ${stats.desvio_padrao}
- Total de preços utilizados: ${stats.precos_utilizados.length}
- Outliers removidos: ${stats.outliers_removidos}
- Amostras: ${JSON.stringify(precos.slice(0, 10))}`;

    try {
        const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4-5',
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                max_tokens: 600,
            }),
            signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) {
            console.warn('IA não retornou 200:', res.status);
            return 'Análise automática indisponível no momento. Consulte os dados estatísticos acima.';
        }

        const result = await res.json();
        return result.choices?.[0]?.message?.content ?? 'Análise não disponível.';
    } catch (err) {
        console.warn('Erro ao chamar IA:', err);
        return 'Análise automática indisponível no momento.';
    }
}

// ───────────────────────────────────────────────
// HANDLER PRINCIPAL
// ───────────────────────────────────────────────
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body: InputBody = await req.json();
        const {
            objeto,
            estado = 'DF',
            municipio = '',
            periodo_meses = 6,
            unidade_medida = 'unidade',
        } = body;

        if (!objeto?.trim()) {
            return new Response(
                JSON.stringify({ error: '`objeto` é obrigatório' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const apiKey = Deno.env.get('LOVABLE_API_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Coletar preços das 3 fontes em paralelo
        const [pncp, painel, interno] = await Promise.all([
            fetchPNCP(objeto, estado, periodo_meses),
            fetchPainelPrecos(objeto, estado),
            fetchInternal(supabase, objeto, estado, periodo_meses),
        ]);

        const todosPrecos: PriceEntry[] = [...pncp, ...painel, ...interno];
        const todosValores = todosPrecos.map(p => p.valor_unitario);
        const stats = calcularEstatisticas(todosValores);

        // Filtrar os preços saneados para enviar no output
        const precosUtilizadosSet = new Set(stats.precos_utilizados);
        const precosDetalhados = todosPrecos
            .filter(p => precosUtilizadosSet.has(p.valor_unitario))
            .slice(0, 100);

        // Análise via IA
        const analiseIA = apiKey
            ? await gerarAnaliseIA(apiKey, objeto, estado, stats, precosDetalhados)
            : 'LOVABLE_API_KEY não configurado.';

        const dataInicio = new Date(Date.now() - periodo_meses * 30 * 24 * 60 * 60 * 1000);
        const dataFim = new Date();
        const periodoConsultado = `${dataInicio.toLocaleDateString('pt-BR')} a ${dataFim.toLocaleDateString('pt-BR')}`;

        const response = {
            objeto,
            estado,
            municipio: municipio || undefined,
            unidade_medida,
            periodo_consultado: periodoConsultado,
            total_precos_encontrados: todosPrecos.length,
            total_precos_utilizados: stats.precos_utilizados.length,
            estatisticas: {
                minimo: stats.minimo,
                maximo: stats.maximo,
                media: stats.media,
                mediana: stats.mediana,
                desvio_padrao: stats.desvio_padrao,
                preco_referencia: stats.preco_referencia,
            },
            precos_detalhados: precosDetalhados,
            analise_ia: analiseIA,
            fundamentacao_legal: 'Art. 23 Lei 14.133/2021 + IN SEGES 65/2021',
            data_pesquisa: new Date().toISOString(),
            outliers_removidos: stats.outliers_removidos,
        };

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err: any) {
        console.error('price-research error:', err);
        return new Response(
            JSON.stringify({ error: err.message || 'Erro interno' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
