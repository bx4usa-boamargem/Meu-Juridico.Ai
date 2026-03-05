import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Flame, DollarSign } from "lucide-react";
import { McTheme, formatBrl } from "./types";

function RankCard({ title, emoji, items, mc, valueKey, valueLabel }: {
  title: string; emoji: string; items: any[]; mc: McTheme; valueKey: string; valueLabel: string;
}) {
  const max = items[0]?.[valueKey] || 1;
  return (
    <div className="rounded-xl p-5 border" style={{ background: mc.card, borderColor: mc.border }}>
      <h3 className="text-sm font-semibold mb-4">{emoji} {title}</h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs">
                <span className="font-mono mr-1" style={{ color: mc.accent }}>{i + 1}.</span>
                {item.full_name || "Sem nome"} <span style={{ color: mc.muted }}>({item.orgao || "N/A"})</span>
              </span>
              <span className="text-[11px] font-mono">{typeof item[valueKey] === "number" && valueKey.includes("cost") ? formatBrl(item[valueKey]) : item[valueKey]?.toLocaleString("pt-BR")} {valueLabel}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: mc.border }}>
              <div className="h-full rounded-full" style={{ width: `${(item[valueKey] / max) * 100}%`, background: mc.accent }} />
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-center py-4" style={{ color: mc.muted }}>Sem dados</p>}
      </div>
    </div>
  );
}

export function UsersTab({ mc }: { mc: McTheme }) {
  const { data: userData } = useQuery({
    queryKey: ["admin-users-all"],
    queryFn: async () => {
      const { data: usage } = await supabase.from("ai_usage_log").select("user_id, custo_usd, orgao, tipo_documento, created_at");
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, orgao");
      const { data: docs } = await supabase.from("documentos").select("id, processo_id, gerado_por");

      const userMap = new Map<string, any>();
      (profiles ?? []).forEach(p => userMap.set(p.id, { id: p.id, full_name: p.full_name, orgao: p.orgao, docs: 0, cost: 0, calls: 0, calls_7d: 0 }));

      (docs ?? []).forEach(d => {
        if (d.gerado_por && userMap.has(d.gerado_por)) userMap.get(d.gerado_por)!.docs++;
      });

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      (usage ?? []).forEach(u => {
        if (!userMap.has(u.user_id)) userMap.set(u.user_id, { id: u.user_id, full_name: "Desconhecido", orgao: u.orgao, docs: 0, cost: 0, calls: 0, calls_7d: 0 });
        const entry = userMap.get(u.user_id)!;
        entry.cost += Number(u.custo_usd || 0);
        entry.calls++;
        if (u.orgao && !entry.orgao) entry.orgao = u.orgao;
        if (u.created_at > sevenDaysAgo) entry.calls_7d++;
      });

      return Array.from(userMap.values());
    },
    refetchInterval: 30000,
  });

  const users = userData ?? [];
  const topDocs = [...users].sort((a, b) => b.docs - a.docs).slice(0, 5);
  const topCost = [...users].sort((a, b) => b.cost - a.cost).slice(0, 5);
  const topActive = [...users].sort((a, b) => b.calls_7d - a.calls_7d).slice(0, 5);

  const totalUsers = users.length;
  const activeToday = new Set((userData ?? []).filter(u => u.calls > 0).map(u => u.id)).size;
  const avgDocs = totalUsers > 0 ? Math.round(users.reduce((s, u) => s + u.docs, 0) / totalUsers) : 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { emoji: "👥", label: "Total Usuários", value: totalUsers },
          { emoji: "⚡", label: "Com Atividade", value: activeToday },
          { emoji: "📄", label: "Média Docs/Usuário", value: avgDocs },
          { emoji: "💰", label: "Custo Total", value: formatBrl(users.reduce((s, u) => s + u.cost, 0)) },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4 border" style={{ background: mc.card, borderColor: mc.border }}>
            <span className="text-base">{k.emoji}</span>
            <p className="text-[11px] mt-1" style={{ color: mc.muted }}>{k.label}</p>
            <p className="text-xl font-bold font-mono" style={{ color: mc.text }}>{typeof k.value === "number" ? k.value.toLocaleString("pt-BR") : k.value}</p>
          </div>
        ))}
      </div>

      {/* Rankings */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RankCard title="Mais Documentos" emoji="🏆" items={topDocs} mc={mc} valueKey="docs" valueLabel="docs" />
        <RankCard title="Maior Gasto IA" emoji="💰" items={topCost} mc={mc} valueKey="cost" valueLabel="" />
        <RankCard title="Mais Ativos (7d)" emoji="⚡" items={topActive} mc={mc} valueKey="calls_7d" valueLabel="chamadas" />
      </div>

      {/* User table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: mc.card, borderColor: mc.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${mc.border}`, color: mc.muted }}>
                <th className="text-left px-4 py-2.5 font-medium">Nome</th>
                <th className="text-left px-4 py-2.5 font-medium">Órgão</th>
                <th className="text-right px-4 py-2.5 font-medium">Docs</th>
                <th className="text-right px-4 py-2.5 font-medium">Chamadas IA</th>
                <th className="text-right px-4 py-2.5 font-medium">Custo BRL</th>
              </tr>
            </thead>
            <tbody>
              {[...users].sort((a, b) => b.docs - a.docs).slice(0, 50).map((u, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${mc.border}` }} className="hover:bg-white/5">
                  <td className="px-4 py-2.5 font-medium">{u.full_name || "Sem nome"}</td>
                  <td className="px-4 py-2.5" style={{ color: mc.muted }}>{u.orgao || "N/A"}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{u.docs}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{u.calls}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatBrl(u.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
