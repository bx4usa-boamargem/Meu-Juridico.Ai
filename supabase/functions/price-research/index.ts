import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PrecoItem {
    orgao: string;
    cnpj_orgao: string;
    estado: string;
    data: string;
    descricao_item: string;
    valor_unitario: number;
    unidade_medida: string;
    quantidade: number;
    fonte: 'ata' | 'contrato' | 'catalogo' | 'base_interna';
    numero_sequencial: string;
    url_fonte: string;
}

interface EstatisticasUnidade {
    unidade_medida: string;
    total_fontes: number;
    minimo: number;
    maximo: number;
    media: number;
    mediana: number;
    desvio_padrao: number;
    outliers_removidos: number;
    preco_referencia: number;
    saneados: number[];
}

interface InputBody {
    objeto: string;
    estado?: string;
    municipio?: string;
    periodo?: string;
    unidade_medida?: string;
    processo_id?: string;
}

// ─── UTILS ──────────────────────────────────────────────────────────────────
function buildDateRange(periodoMeses: number) {
    const now = new Date();
    const from = new Date(now.getTime() - periodoMeses * 30 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return { dataInicial: fmt(from), dataFinal: fmt(now) };
}

function removeAccents(str: string): string {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getTokens(str: string): string[] {
    return removeAccents(str.toLowerCase()).split(/\s+/).filter(w => w.length > 3).slice(0, 5);
}

function keywordsMatch(text: string, keywords: string[]): boolean {
    if (!text) return false;
    const t = removeAccents(text.toLowerCase());
    return keywords.some(k => t.includes(removeAccents(k.toLowerCase())));
}

// Retorna null se não achar unidade clara, senão padroniza.
function padronizarUnidade(unid: string): string {
    if (!unid) return 'unidade';
    let u = removeAccents(unid.toLowerCase()).trim();
    if (u.includes('m2') || u.includes('metro quadrado')) return 'm²';
    if (u.includes('m3') || u.includes('metro cubico')) return 'm³';
    if (u.includes('hora') || u === 'h') return 'hora';
    if (u.includes('mes') || u === 'mensalidade') return 'mês';
    if (u.includes('posto')) return 'posto';
    if (u.includes('diaria')) return 'diária';
    if (u.includes('ano')) return 'ano';
    if (u.includes('sv') || u.includes('servico')) return 'serviço global';
    return u.substring(0, 20); // fallback string curta
}

// ─── COLETA PNCP (ATAS E CONTRATOS - FETCH HEADERS) ─────────────────────────
async function fetchPNCPEndpointHeaders(
    endpoint: 'atas' | 'contratos',
    estado: string,
    periodoMeses: number,
    keywords: string[]
): Promise<any[]> {
    const chunks: { inicio: string; fim: string }[] = [];
    const now = new Date();
    let remainingDays = periodoMeses * 30;
    let currentDate = new Date(now.getTime());
    const fmt = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

    while (remainingDays > 0) {
        const days = Math.min(remainingDays, 365);
        const start = new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000);
        chunks.push({ inicio: fmt(start), fim: fmt(currentDate) });
        currentDate = new Date(start.getTime() - 24 * 60 * 60 * 1000);
        remainingDays -= days;
    }

    let results: any[] = [];
    for (const chunk of chunks) {
        if (results.length > 50) break; // Travar volume de varredura
        const url = `https://pncp.gov.br/api/consulta/v1/${endpoint}?dataInicial=${chunk.inicio}&dataFinal=${chunk.fim}&uf=${estado}&pagina=1&tamanhoPagina=500`;
        try {
            const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
            if (res.ok) {
                const body = await res.json();
                if (Array.isArray(body.data)) {
                    for (const item of body.data) {
                        const txt = (endpoint === 'atas' ? item.objetoContratacao : item.objetoContrato) || '';
                        if (keywordsMatch(txt, keywords)) {
                            results.push(item);
                        }
                    }
                }
            }
        } catch (e) {
            console.warn(`Erro no PNCP Headers ${endpoint}:`, e);
        }
    }
    return results;
}

// ─── N+1 FETCH ITENS DOS CONTRATOS/ATAS ─────────────────────────────────────
async function fetchItemsForContracts(
    contratos: any[],
    endpoint: 'atas' | 'contratos',
    keywords: string[]
): Promise<PrecoItem[]> {
    const resultItens: PrecoItem[] = [];
    // Pegamos apenas primeiros 30 para não causar timeout absoluto (cada api/itens demora 300ms)
    const cToFetch = contratos.slice(0, 30);

    const promises = cToFetch.map(async (c) => {
        const controleCompra = c.numeroControlePncpCompra || c.numeroControlePNCPCompra || '';
        if (!controleCompra || !controleCompra.includes('-') || !controleCompra.includes('/')) return [];

        const parts = controleCompra.split('-');
        const cnpj = parts[0];
        const rightPart = parts[parts.length - 1]; // e.g. "000067/2024" ou "000021/2022-000001"
        const finalParts = rightPart.split('-')[0].split('/');
        const seq = parseInt(finalParts[0], 10);
        const ano = parseInt(finalParts[1], 10);

        if (!cnpj || !ano || isNaN(seq)) return [];

        const urlItens = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj}/compras/${ano}/${seq}/itens`;
        try {
            const res = await fetch(urlItens, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
            if (!res.ok) return [];
            const itensArr = await res.json();

            const extracted: PrecoItem[] = [];
            for (const it of itensArr) {
                const desc = it.descricao || it.descricaoItem || '';
                if (keywordsMatch(desc, keywords) || keywordsMatch(c.objetoContratacao || c.objetoContrato || '', keywords)) {
                    const valor = parseFloat(it.valorUnitarioEstimado || it.valorUnitarioHomologado || '0');
                    if (valor <= 0) continue;

                    let numAta = c.numeroControlePNCPAta || c.numeroAtaRegistroPreco || '';
                    let urlF = endpoint === 'atas'
                        ? `https://pncp.gov.br/app/editais/${cnpj}/1/${numAta.split('-').pop() || ''}`
                        : `https://pncp.gov.br`;

                    extracted.push({
                        orgao: c.nomeOrgao || 'N/I',
                        cnpj_orgao: cnpj,
                        estado: c.ufOrgao || c.uf || 'N/I',
                        data: c.dataAssinatura || c.dataPublicacaoPncp || '',
                        descricao_item: desc,
                        valor_unitario: valor,
                        unidade_medida: padronizarUnidade(it.unidadeMedida || 'unidade'),
                        quantidade: parseFloat(it.quantidade || '1'),
                        fonte: endpoint === 'atas' ? 'ata' : 'contrato',
                        numero_sequencial: seq.toString(),
                        url_fonte: urlF
                    });
                }
            }
            return extracted;
        } catch (e) {
            return [];
        }
    });

    const arrays = await Promise.all(promises);
    for (const arr of arrays) resultItens.push(...arr);
    return resultItens;
}

// ─── COLETA CATÁLOGO PNCP (CATMAT/CATSER) ───────────────────────────────────
async function fetchCatalogoItems(objeto: string): Promise<PrecoItem[]> {
    const result: PrecoItem[] = [];
    const query = encodeURIComponent(objeto.substring(0, 30)); // PNCP truncado
    const url = `https://pncp.gov.br/api/catalogo/v1/itens?q=${query}&pagina=1&tamanhoPagina=50`;
    try {
        const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
        if (!res.ok) return result;
        const body = await res.json();
        for (const item of (body.dados || body.data || [])) {
            if (item.valorReferencia && parseFloat(item.valorReferencia) > 0) {
                result.push({
                    orgao: 'Catálogo Nacional PNCP',
                    cnpj_orgao: '',
                    estado: 'BR',
                    data: new Date().toISOString(),
                    descricao_item: item.descricao || item.nome || '',
                    valor_unitario: parseFloat(item.valorReferencia),
                    unidade_medida: padronizarUnidade(item.unidadeFornecimento || ''),
                    quantidade: 1,
                    fonte: 'catalogo',
                    numero_sequencial: item.codigoItem || '',
                    url_fonte: 'https://pncp.gov.br'
                });
            }
        }
    } catch (e) {
        console.warn("Erro no Catalogo PNCP:", e);
    }
    return result;
}

// ─── ESTATÍSTICAS AGRUPADAS ──────────────────────────────────────────────────
function calcularStatsUnidade(itens: PrecoItem[], unidade: string): EstatisticasUnidade | null {
    if (itens.length === 0) return null;
    const precos = itens.map(i => i.valor_unitario);

    const media = precos.reduce((a, b) => a + b, 0) / precos.length;
    const dp = Math.sqrt(precos.reduce((a, b) => a + Math.pow(b - media, 2), 0) / precos.length);

    // Cutout outliers (2 desvios padrão)
    const saneados = precos.filter(p => Math.abs(p - media) <= 2 * dp);
    const outliers_removidos = precos.length - saneados.length;

    if (saneados.length === 0) return null;

    const sorted = [...saneados].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const mediana = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    const mediaFinal = saneados.reduce((a, b) => a + b, 0) / saneados.length;
    const dpFinal = Math.sqrt(saneados.reduce((a, b) => a + Math.pow(b - mediaFinal, 2), 0) / saneados.length);

    return {
        unidade_medida: unidade,
        total_fontes: saneados.length,
        minimo: Math.round(Math.min(...saneados) * 100) / 100,
        maximo: Math.round(Math.max(...saneados) * 100) / 100,
        media: Math.round(mediaFinal * 100) / 100,
        mediana: Math.round(mediana * 100) / 100,
        desvio_padrao: Math.round(dpFinal * 100) / 100,
        preco_referencia: Math.round(mediana * 100) / 100,
        outliers_removidos,
        saneados
    };
}

// ─── IA ANALISE ─────────────────────────────────────────────────────────────
async function gerarAnaliseIA(
    apiKey: string,
    objeto: string,
    estado: string,
    stats: EstatisticasUnidade[]
): Promise<string> {
    const analiseStr = stats.slice(0, 3).map(s =>
        `- ${s.unidade_medida}: R$ ${s.preco_referencia} (Mediana de ${s.total_fontes} fontes válidas, ${s.outliers_removidos} outliers descartados)`
    ).join('\n');

    const prompt = `Você é um especialista em licitações públicas brasileiras (Lei 14.133/2021).
O usuário pesquisou precos unitários para o objeto "${objeto}" (Estado: ${estado}). 
Nós agrupamos os custos unitários devolvidos em diferentes unidades de medida (m², posto, hora, etc).
Resumo estatístico do sistema:
${analiseStr}

Gere uma análise executiva em NO MÁXIMO 3 PARÁGRAFOS para o Relatório de Pesquisa:
1. Recomendação de uso da Mediana saneada dos itens colhidos;
2. Comente que a variação regional e diferentes unidades de medida exigem que o gestor escolha a unidade pertinente ao seu ETP/TR;
3. Base Legal: Art. 23 Lei 14.133/2021 + IN SEGES 65/2021 + Art. 27 Decreto Municipal 62.100/2022.`;

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 600,
                temperature: 0.3,
            }),
            signal: AbortSignal.timeout(20000),
        });

        if (!res.ok) return 'Análise indisponível no momento. Retorno da API: ' + res.status;
        const result = await res.json();
        return result.choices?.[0]?.message?.content ?? 'Análise não gerada.';
    } catch (err) {
        return 'Falha ao processar texto por IA.';
    }
}

// ─── MAIN HANDLER ───────────────────────────────────────────────────────────
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const body: InputBody = await req.json();
        const { objeto, estado = 'BR', periodo = '24m' } = body;

        // Converter período string (ex: "6m") para número de meses
        const periodo_meses = parseInt(periodo.replace('m', '')) || 24;

        if (!objeto?.trim()) {
            return new Response(JSON.stringify({ error: '`objeto` é obrigatório' }), { status: 400, headers: corsHeaders });
        }

        const keywords = getTokens(objeto);

        // 1. Coletar cabeçalhos (até 50 de cada)
        const [cAtas, cContratos, cCatalogo] = await Promise.all([
            fetchPNCPEndpointHeaders('atas', estado, periodo_meses, keywords),
            fetchPNCPEndpointHeaders('contratos', estado, periodo_meses, keywords),
            fetchCatalogoItems(objeto)
        ]);

        // 2. Coletar N+1 dos Itens de forma protegida / concorrente
        const [itensAtas, itensContratos] = await Promise.all([
            fetchItemsForContracts(cAtas, 'atas', keywords),
            fetchItemsForContracts(cContratos, 'contratos', keywords)
        ]);

        const allItems: PrecoItem[] = [...itensAtas, ...itensContratos, ...cCatalogo];

        // 3. Agrupamento e Cálculo
        const porUnidade: Record<string, PrecoItem[]> = {};
        for (const item of allItems) {
            if (!porUnidade[item.unidade_medida]) porUnidade[item.unidade_medida] = [];
            porUnidade[item.unidade_medida].push(item);
        }

        const resultadosDeUnidade: EstatisticasUnidade[] = [];
        for (const [unidade, vals] of Object.entries(porUnidade)) {
            const st = calcularStatsUnidade(vals, unidade);
            if (st && st.total_fontes > 0) resultadosDeUnidade.push(st);
        }

        // Sort array by count of sources (to surface the most relevant robust units)
        resultadosDeUnidade.sort((a, b) => b.total_fontes - a.total_fontes);

        // 4. Análise de Texto Gen IA
        const openAiKey = Deno.env.get('OPENAI_API_KEY') || '';
        const analiseStr = openAiKey
            ? await gerarAnaliseIA(openAiKey, objeto, estado, resultadosDeUnidade)
            : "Configuração OPENAI_API_KEY pendente.";

        const nowStr = new Date().toISOString();

        const responseJSON = {
            objeto,
            estado,
            periodo_consultado: `${periodo_meses} meses`,
            total_contratos_consultados: cAtas.length + cContratos.length,
            total_itens_encontrados: allItems.length,
            total_itens_utilizados: resultadosDeUnidade.reduce((acc, curr) => acc + curr.total_fontes, 0),

            resultados_por_unidade: resultadosDeUnidade.map(r => {
                const { saneados, ...rest } = r;
                return {
                    unidade: rest.unidade_medida,
                    menor: rest.minimo,
                    mediana: rest.mediana,
                    maior: rest.maximo,
                    total: rest.total_fontes,
                    outliers: rest.outliers_removidos,
                    itens: allItems.filter(i => i.unidade_medida === rest.unidade_medida).slice(0, 20)
                };
            }),

            itens_detalhados: allItems.slice(0, 50).map(i => { // Retorna top 50 p/ tabela por peso de trafego
                return {
                    ...i,
                    valor_unitario: Math.round(i.valor_unitario * 100) / 100
                }
            }),

            memoria_calculo: {
                fontes_consultadas: ["API PNCP Atas", "API PNCP Contratos", "Catálogo V1 PNCP"],
                metodologia: "Mediana saneada conforme IN SEGES 65/2021 e Decreto 62.100/2022",
                criterio_exclusao: "Outliers com desvio paramétrico > 2σ da média do grupo unificado",
                fundamentacao_legal: "Art. 23 Lei 14.133/2021 + IN SEGES 65/2021 + Art. 27 Decreto Municipal 62.100/2022"
            },

            analise_ia: analiseStr,
            data_pesquisa: nowStr
        };

        return new Response(JSON.stringify(responseJSON), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err: any) {
        console.error('ERROR price-research v2:', err);
        return new Response(JSON.stringify({ error: err.message || 'Erro Interno do Engine de Preços' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
