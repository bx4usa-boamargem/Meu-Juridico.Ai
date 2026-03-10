import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * catalogo-compras-proxy
 * Proxy autenticado entre o Meu Jurídico e o catálogo CATMAT/CATSER.
 *
 * Implementa o BLOCO 10 — Regra Canônica de Exposição de Interface:
 * - Nunca expõe campos técnicos ao front-end
 * - Lê de pncp_catalog com full-text search (índice GIN em descricao_tsv)
 * - Projeta apenas: codigo, item, unidade, grupo
 * - Paginação fixa: 20 itens/página
 * - Mensagem de erro genérica ao usuário
 *
 * Parâmetros de query:
 *   ?q=<texto>       — busca textual (websearch, português)
 *   ?pagina=<n>      — página desejada (default: 1)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PAGE_SIZE = 20

interface CatalogoItem {
  codigo: string
  item: string
  unidade: string
  grupo?: string
}

interface CatalogoResponse {
  items: CatalogoItem[]
  pagina: number
  totalPaginas: number
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q')?.trim() ?? ''
    const pagina = Math.max(1, parseInt(url.searchParams.get('pagina') ?? '1', 10))
    const offset = (pagina - 1) * PAGE_SIZE

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    let query = supabase
      .from('pncp_catalog')
      .select('id, descricao, unidade_medida, categoria', { count: 'exact' })
      .range(offset, offset + PAGE_SIZE - 1)
      .order('descricao', { ascending: true })

    // Busca textual via full-text search (índice GIN em descricao_tsv)
    if (q.length > 0) {
      query = query.textSearch('descricao_tsv', q, {
        type: 'websearch',
        config: 'portuguese',
      })
    }

    const { data, error, count } = await query

    if (error) {
      // Nunca expor detalhes do erro ao usuário — BLOCO 10 §6
      console.error('[catalogo-compras-proxy] DB error:', error.message)
      return new Response(
        JSON.stringify({ error: 'CATALOGO_INDISPONIVEL' }),
        { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Projeção mínima — BLOCO 10 §5
    const items: CatalogoItem[] = (data ?? []).map((row: any) => ({
      codigo: row.id,
      item: row.descricao,
      unidade: row.unidade_medida ?? 'UN',
      grupo: row.categoria ?? undefined,
    }))

    const totalItens = count ?? 0
    const totalPaginas = Math.max(1, Math.ceil(totalItens / PAGE_SIZE))

    const response: CatalogoResponse = {
      items,
      pagina,
      totalPaginas,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[catalogo-compras-proxy] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'CATALOGO_INDISPONIVEL' }),
      { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
