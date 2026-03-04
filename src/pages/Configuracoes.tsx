import { useState } from "react";
import { Settings, Users, CreditCard, Activity } from "lucide-react";
import { MonitoramentoPanel } from "@/components/configuracoes/MonitoramentoPanel";

const TABS = [
  { id: "grupos", label: "Gestão de Grupos", icon: Settings },
  { id: "usuarios", label: "Gestão de Usuários", icon: Users },
  { id: "creditos", label: "Gestão de Créditos", icon: CreditCard },
  { id: "monitoramento", label: "Monitoramento", icon: Activity },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState<TabId>("monitoramento");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "grupos" && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Settings className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Gestão de Grupos será disponibilizada em breve.</p>
        </div>
      )}
      {activeTab === "usuarios" && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Gestão de Usuários será disponibilizada em breve.</p>
        </div>
      )}
      {activeTab === "creditos" && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CreditCard className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Gestão de Créditos será disponibilizada em breve.</p>
        </div>
      )}
      {activeTab === "monitoramento" && <MonitoramentoPanel />}
    </div>
  );
}
