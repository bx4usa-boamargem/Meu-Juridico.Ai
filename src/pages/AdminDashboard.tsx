import { useState, useEffect } from "react";
import { Satellite } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { ClientsTab } from "@/components/admin/ClientsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { CostsTab } from "@/components/admin/CostsTab";
import { AgentsTab } from "@/components/admin/AgentsTab";
import { HealthTab } from "@/components/admin/HealthTab";
import { RankingsTab } from "@/components/admin/RankingsTab";
import { ExportTab } from "@/components/admin/ExportTab";

const MC = {
  bg: "#0A0E1A",
  card: "#111827",
  border: "#1E2D45",
  accent: "#0077FE",
  green: "#06C270",
  text: "#E2E8F0",
  muted: "#6B7588",
};

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: MC.green }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: MC.green }} />
      </span>
      <span style={{ color: MC.green }}>LIVE</span>
    </span>
  );
}

const TABS = [
  { value: "overview", label: "🏠 Visão Geral" },
  { value: "clients", label: "🏢 Clientes" },
  { value: "users", label: "👥 Usuários" },
  { value: "costs", label: "💰 Custos IA" },
  { value: "agents", label: "🤖 Agentes IA" },
  { value: "health", label: "❤️ Saúde" },
  { value: "regions", label: "🌍 Regiões" },
  { value: "rankings", label: "🏆 Rankings" },
  { value: "export", label: "📤 Exportar" },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen p-6" style={{ background: MC.bg, color: MC.text }}>
      <div className="flex items-center gap-3 mb-4">
        <Satellite className="h-6 w-6" style={{ color: MC.accent }} />
        <h1 className="text-xl font-bold tracking-tight">Painel Administrativo</h1>
        <LiveBadge />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto mb-6 -mx-2 px-2">
          <TabsList className="inline-flex h-auto gap-1 p-1 rounded-lg border" style={{ background: MC.card, borderColor: MC.border }}>
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="text-xs px-3 py-2 whitespace-nowrap rounded-md data-[state=active]:shadow-none transition-colors"
                style={{ color: MC.muted }}
              >
                <span className="data-[state=active]:text-[#0F6FDE]">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview"><OverviewTab mc={MC} /></TabsContent>
        <TabsContent value="clients"><ClientsTab mc={MC} /></TabsContent>
        <TabsContent value="users"><UsersTab mc={MC} /></TabsContent>
        <TabsContent value="costs"><CostsTab mc={MC} /></TabsContent>
        <TabsContent value="agents"><AgentsTab mc={MC} /></TabsContent>
        <TabsContent value="health"><HealthTab mc={MC} /></TabsContent>
        <TabsContent value="regions"><OverviewTab mc={MC} showRegionsOnly /></TabsContent>
        <TabsContent value="rankings"><RankingsTab mc={MC} /></TabsContent>
        <TabsContent value="export"><ExportTab mc={MC} /></TabsContent>
      </Tabs>
    </div>
  );
}
