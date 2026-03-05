import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, FileText, Search, X } from "lucide-react";
import { McTheme, formatBrl } from "./types";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function ClientsTab({ mc }: { mc: McTheme }) {
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);

  const { data: orgs } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      // Get orgs from org_settings
      const { data: orgList } = await supabase.from("org_settings").select("*");
      // Get usage per org
      const { data: usage } = await supabase.from("ai_usage_log").select("orgao, custo_usd, user_id, tipo_documento");
      // Get docs per orgao
      const { data: processos } = await supabase.from("processos").select("id, orgao, created_by");
      const { data: docs } = await supabase.from("documentos").select("id, processo_id, created_at");

      const orgMap = new Map<string, any>();

      // Build from processos.orgao (the actual org name field)
      (processos ?? []).forEach((p) => {
        const name = p.orgao || "Sem órgão";
        if (!orgMap.has(name)) {
          orgMap.set(name, { nome: name, users: new Set(), docs: 0, cost: 0, calls: 0, lastActivity: "" });
        }
        orgMap.get(name)!.users.add(p.created_by);
      });

      // Count docs per org
      const processoOrgMap = new Map<string, string>();
      (processos ?? []).forEach(p => processoOrgMap.set(p.id, p.orgao || "Sem órgão"));
      (docs ?? []).forEach(d => {
        const orgName = processoOrgMap.get(d.processo_id);
        if (orgName && orgMap.has(orgName)) orgMap.get(orgName)!.docs++;
      });

      // Usage
      (usage ?? []).forEach(u => {
        const name = u.orgao || "Sem órgão";
        if (!orgMap.has(name)) orgMap.set(name, { nome: name, users: new Set(), docs: 0, cost: 0, calls: 0, lastActivity: "" });
        orgMap.get(name)!.cost += Number(u.custo_usd || 0);
        orgMap.get(name)!.calls++;
        if (u.user_id) orgMap.get(name)!.users.add(u.user_id);
      });

      return Array.from(orgMap.values()).map(o => ({
        ...o,
        users: o.users.size,
      })).sort((a, b) => b.docs - a.docs);
    },
    refetchInterval: 30000,
  });

  const { data: orgDetails } = useQuery({
    queryKey: ["admin-org-detail", selectedOrg?.nome],
    enabled: !!selectedOrg,
    queryFn: async () => {
      const orgName = selectedOrg?.nome;
      const { data: usage } = await supabase.from("ai_usage_log").select("*").eq("orgao", orgName).order("created_at", { ascending: false }).limit(50);
      return usage ?? [];
    },
  });

  const filtered = (orgs ?? []).filter(o => o.nome.toLowerCase().includes(search.toLowerCase()));
  const totalOrgs = orgs?.length ?? 0;
  const activeOrgs = (orgs ?? []).filter(o => o.calls > 0).length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { emoji: "🏢", label: "Total de Órgãos", value: totalOrgs },
          { emoji: "✅", label: "Órgãos Ativos", value: activeOrgs },
          { emoji: "📄", label: "Total Documentos", value: (orgs ?? []).reduce((s, o) => s + o.docs, 0) },
          { emoji: "💰", label: "Custo Total", value: formatBrl((orgs ?? []).reduce((s, o) => s + o.cost, 0)) },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4 border" style={{ background: mc.card, borderColor: mc.border }}>
            <span className="text-base">{k.emoji}</span>
            <p className="text-[11px] mt-1" style={{ color: mc.muted }}>{k.label}</p>
            <p className="text-xl font-bold font-mono" style={{ color: mc.text }}>{typeof k.value === "number" ? k.value.toLocaleString("pt-BR") : k.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: mc.muted }} />
        <Input
          placeholder="Buscar órgão..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 border text-sm"
          style={{ background: mc.card, borderColor: mc.border, color: mc.text }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: mc.card, borderColor: mc.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${mc.border}`, color: mc.muted }}>
                <th className="text-left px-4 py-2.5 font-medium">Órgão</th>
                <th className="text-right px-4 py-2.5 font-medium">Usuários</th>
                <th className="text-right px-4 py-2.5 font-medium">Docs</th>
                <th className="text-right px-4 py-2.5 font-medium">Chamadas IA</th>
                <th className="text-right px-4 py-2.5 font-medium">Custo BRL</th>
                <th className="text-center px-4 py-2.5 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${mc.border}` }} className="hover:bg-white/5">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" style={{ color: mc.accent }} />
                      <span className="font-medium">{o.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{o.users}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{o.docs}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{o.calls}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatBrl(o.cost)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => setSelectedOrg(o)} className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: mc.accent, color: mc.accent }}>
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8" style={{ color: mc.muted }}>Sem dados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <Sheet open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto" style={{ background: mc.bg, color: mc.text, borderColor: mc.border }}>
          <SheetHeader>
            <SheetTitle style={{ color: mc.text }}>{selectedOrg?.nome}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3 border" style={{ background: mc.card, borderColor: mc.border }}>
                <p className="text-[10px]" style={{ color: mc.muted }}>Documentos</p>
                <p className="text-lg font-bold font-mono">{selectedOrg?.docs}</p>
              </div>
              <div className="rounded-lg p-3 border" style={{ background: mc.card, borderColor: mc.border }}>
                <p className="text-[10px]" style={{ color: mc.muted }}>Custo Total</p>
                <p className="text-lg font-bold font-mono">{formatBrl(selectedOrg?.cost ?? 0)}</p>
              </div>
            </div>
            <h4 className="text-xs font-semibold mt-4">Histórico de IA (últimas 50)</h4>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {(orgDetails ?? []).map((u: any, i: number) => (
                <div key={i} className="text-[11px] font-mono px-2 py-1 rounded" style={{ background: mc.card }}>
                  {new Date(u.created_at).toLocaleDateString("pt-BR")} — {u.modelo_utilizado} — {u.tipo_documento?.toUpperCase() || "N/A"} — {formatBrl(Number(u.custo_usd || 0))}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
