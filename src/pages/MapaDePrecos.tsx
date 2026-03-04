import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceResearchDrawer } from "@/components/documento/PriceResearchDrawer";
import { useAuth } from "@/hooks/useAuth";

export default function MapaDePrecos() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mapa de Preços</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pesquise preços de mercado em fontes públicas (PNCP, Painel de Preços) conforme IN SEGES 65/2021.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Search className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold">Pesquisa de Preços de Mercado</h2>
          <p className="text-xs text-muted-foreground max-w-md">
            Consulte preços praticados em contratações públicas similares.
            O sistema calcula a mediana saneada e gera relatório pronto para juntar ao processo.
          </p>
        </div>
        <Button onClick={() => setDrawerOpen(true)} className="gap-2">
          <Search className="h-4 w-4" /> Iniciar Pesquisa
        </Button>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <h3 className="text-xs font-semibold">Sobre a metodologia</h3>
        <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
          <li>Fontes: PNCP (Portal Nacional de Contratações Públicas) e Painel de Preços do Governo Federal</li>
          <li>Metodologia: Mediana saneada com remoção de outliers por desvio &gt; 2σ</li>
          <li>Fundamentação: Art. 23, Lei 14.133/2021 e IN SEGES/ME nº 65/2021</li>
          <li>O relatório gerado pode ser baixado em PDF para anexar ao processo</li>
        </ul>
      </div>

      <PriceResearchDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        userName={user?.email ?? undefined}
      />
    </div>
  );
}
