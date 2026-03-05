import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { McTheme, formatBrl } from "./types";

const PERIODS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "Todo período", days: 9999 },
];

function Leaderboard({ title, emoji, items, mc, columns }: {
  title: string; emoji: string; items: any[]; mc: McTheme;
  columns: { key: string; label: string; format?: (v: any) => string }[];
}) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: mc.card, borderColor: mc.border }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: mc.border }}>
        <h3 className="text-sm font-semibold">{emoji} {title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${mc.border}`, color: mc.muted }}>
              <th className="text-center px-3 py-2 font-medium w-8">#</th>
              {columns.map(c => (
                <th key={c.key} className={`${c.key === "name" ? "text-left" : "text-right"} px-4 py-2 font-medium`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${mc.border}` }} className="hover:bg-white/5">
                <td className="px-3 py-2.5 text-center">{medals[i] || i + 1}</td>
                {columns.map(c => (
                  <td key={c.key} className={`${c.key === "name" ? "text-left font-medium" : "text-right font-mono"} px-4 py-2.5`}>
                    {c.format ? c.format(item[c.key]) : item[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="text-center py-6" style={{ color: mc.muted }}>Sem dados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RankingsTab({ mc }: { mc: McTheme }) {
  const [period, setPeriod] = useState(30);

  const { data } = useQuery({
    queryKey: ["admin-rankings", period],
    queryFn: async () => {
      const since = period < 9999 ? new Date(Date.now() - period * 86400000).toISOString() : "2000-01-01";

      const { data: usage } = await supabase.from("ai_usage_log").select("user_id, orgao, custo_usd, tipo_documento, estado, created_at").gte("created_at", since);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, orgao");
      const { data: docs } = await supabase.from("documentos").select("id, processo_id, gerado_por, tipo, created_at").gte("created_at", since);

      const profileMap = new Map<string, any>();
      (profiles ?? []).forEach(p => profileMap.set(p.id, p));

      // Top orgs by docs
      const orgDocMap = new Map<string, number>();
      const { data: processos } = await supabase.from("processos").select("id, orgao");
      const procOrgMap = new Map<string, string>();
      (processos ?? []).forEach(p => procOrgMap.set(p.id, p.orgao || "N/A"));
      (docs ?? []).forEach(d => { const org = procOrgMap.get(d.processo_id) || "N/A"; orgDocMap.set(org, (orgDocMap.get(org) || 0) + 1); });
      const topOrgs = Array.from(orgDocMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

      // Top users by docs
      const userDocMap = new Map<string, number>();
      (docs ?? []).forEach(d => { if (d.gerado_por) userDocMap.set(d.gerado_por, (userDocMap.get(d.gerado_por) || 0) + 1); });
      const topUserDocs = Array.from(userDocMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, count]) => {
        const p = profileMap.get(id);
        return { name: p?.full_name || "Desconhecido", orgao: p?.orgao || "N/A", count };
      });

      // Top users by cost
      const userCostMap = new Map<string, number>();
      (usage ?? []).forEach(u => userCostMap.set(u.user_id, (userCostMap.get(u.user_id) || 0) + Number(u.custo_usd || 0)));
      const topUserCost = Array.from(userCostMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, cost]) => {
        const p = profileMap.get(id);
        return { name: p?.full_name || "Desconhecido", orgao: p?.orgao || "N/A", cost };
      });

      // Top doc types
      const typeMap = new Map<string, number>();
      (docs ?? []).forEach(d => { const t = d.tipo || "N/A"; typeMap.set(t, (typeMap.get(t) || 0) + 1); });
      const topTypes = Array.from(typeMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name: name.toUpperCase(), count }));

      // Top states
      const stateMap = new Map<string, number>();
      (usage ?? []).forEach(u => { const s = u.estado || "N/A"; if (s !== "N/A") stateMap.set(s, (stateMap.get(s) || 0) + 1); });
      const topStates = Array.from(stateMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

      return { topOrgs, topUserDocs, topUserCost, topTypes, topStates };
    },
  });

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex gap-2">
        {PERIODS.map(p => (
          <button
            key={p.days}
            onClick={() => setPeriod(p.days)}
            className="text-xs px-3 py-1.5 rounded-md transition-colors"
            style={{
              background: period === p.days ? "white" : "transparent",
              color: period === p.days ? "#0F6FDE" : mc.muted,
              boxShadow: period === p.days ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Leaderboard title="TOP 10 Órgãos — Mais Documentos" emoji="🥇" mc={mc}
          items={data?.topOrgs ?? []}
          columns={[{ key: "name", label: "Órgão" }, { key: "count", label: "Documentos" }]}
        />
        <Leaderboard title="TOP 10 Usuários — Mais Documentos" emoji="🥇" mc={mc}
          items={data?.topUserDocs ?? []}
          columns={[{ key: "name", label: "Nome" }, { key: "orgao", label: "Órgão" }, { key: "count", label: "Docs" }]}
        />
        <Leaderboard title="TOP 10 Usuários — Maior Gasto IA" emoji="💰" mc={mc}
          items={data?.topUserCost ?? []}
          columns={[{ key: "name", label: "Nome" }, { key: "orgao", label: "Órgão" }, { key: "cost", label: "Custo", format: (v: number) => formatBrl(v) }]}
        />
        <Leaderboard title="TOP 5 Tipos de Documento" emoji="📄" mc={mc}
          items={data?.topTypes ?? []}
          columns={[{ key: "name", label: "Tipo" }, { key: "count", label: "Total" }]}
        />
      </div>

      <Leaderboard title="TOP 5 Estados — Maior Uso" emoji="🌍" mc={mc}
        items={data?.topStates ?? []}
        columns={[{ key: "name", label: "Estado" }, { key: "count", label: "Chamadas" }]}
      />
    </div>
  );
}
