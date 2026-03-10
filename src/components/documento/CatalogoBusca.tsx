import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CatalogoItem {
  codigo: string;
  item: string;
  unidade: string;
  grupo?: string;
}

interface CatalogoBuscaProps {
  /** Callback chamado quando o usuário seleciona um item. */
  onSelect: (item: CatalogoItem) => void;
  /** Controla visibilidade do Sheet (sheet controlado externamente). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Placeholder customizável para o campo de busca. */
  placeholder?: string;
}

interface ApiResponse {
  items: CatalogoItem[];
  pagina: number;
  totalPaginas: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// ─── Componente ───────────────────────────────────────────────────────────────

export function CatalogoBusca({
  onSelect,
  open,
  onOpenChange,
  placeholder = "Buscar material ou serviço...",
}: CatalogoBuscaProps) {
  const [query, setQuery] = useState("");
  const [pagina, setPagina] = useState(1);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Busca ─────────────────────────────────────────────────────────────────

  const buscar = async (q: string, pg: number) => {
    setLoading(true);
    setErro(false);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

      const params = new URLSearchParams({ pagina: String(pg) });
      if (q.length > 0) params.set("q", q);

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/catalogo-compras-proxy?${params.toString()}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            apikey: apiKey,
          },
        }
      );

      if (!res.ok) {
        // Nunca expor status HTTP ao usuário — BLOCO 10 §6
        setErro(true);
        return;
      }

      const dados: ApiResponse = await res.json();
      setItems(dados.items ?? []);
      setTotalPaginas(dados.totalPaginas ?? 1);
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  // ─── Debounce na digitação ─────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPagina(1);
      buscar(query, 1);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  // ─── Busca ao trocar de página ────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    buscar(query, pagina);
    // intencionalmente sem query no deps — só execute quando pagina muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  // ─── Reset ao abrir/fechar ────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      setQuery("");
      setPagina(1);
      setItems([]);
      setTotalPaginas(1);
      setErro(false);
      buscar("", 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSelect = (item: CatalogoItem) => {
    onSelect(item);
    onOpenChange(false);
  };

  const canPrev = pagina > 1;
  const canNext = pagina < totalPaginas;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[520px] max-w-full sm:max-w-[520px] p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-base">
            Catálogo de Materiais e Serviços
          </SheetTitle>
          <SheetDescription className="text-[11px]">
            CATMAT / CATSER — selecione o item para preencher o campo
          </SheetDescription>

          {/* Campo de busca */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="pl-9 text-sm"
              autoFocus
            />
          </div>
        </SheetHeader>

        {/* Lista */}
        <ScrollArea className="flex-1 px-6 py-4">
          {/* Skeleton loader */}
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          )}

          {/* Erro genérico */}
          {!loading && erro && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">
                Não foi possível carregar o catálogo no momento.
              </p>
              <p className="text-xs text-muted-foreground">Tente novamente.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => buscar(query, pagina)}
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Sem resultado */}
          {!loading && !erro && items.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Search className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium">
                Nenhum item encontrado para esta busca.
              </p>
              <p className="text-xs text-muted-foreground">
                Tente usar termos mais genéricos.
              </p>
            </div>
          )}

          {/* Itens */}
          {!loading && !erro && items.length > 0 && (
            <div className="space-y-1.5">
              {items.map((item) => (
                <button
                  key={item.codigo}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left",
                    "hover:border-primary/50 hover:bg-primary/5 active:bg-primary/10",
                    "transition-colors"
                  )}
                >
                  {/* Código */}
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 w-16 truncate">
                    {item.codigo}
                  </span>

                  {/* Nome */}
                  <span className="flex-1 text-[12px] font-medium text-foreground leading-tight">
                    {item.item}
                  </span>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.grupo && (
                      <Badge
                        variant="secondary"
                        className="text-[8px] px-1.5 py-0 bg-blue-500/10 text-blue-700 border-blue-500/20"
                      >
                        {item.grupo}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0 font-mono"
                    >
                      {item.unidade}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Paginação */}
        {!erro && items.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              disabled={!canPrev || loading}
              onClick={() => setPagina((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>
            <span className="text-[10px] text-muted-foreground">
              Página {pagina}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              disabled={!canNext || loading}
              onClick={() => setPagina((p) => p + 1)}
            >
              Próxima
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
