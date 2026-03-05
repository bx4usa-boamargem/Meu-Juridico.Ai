import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, X } from "lucide-react";
import { McTheme, formatBrl } from "./types";
import { toast } from "sonner";

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

function InviteUserDialog({ mc, open, onClose }: { mc: McTheme; open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgao, setOrgao] = useState("");
  const [cargo, setCargo] = useState("");
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email, full_name: fullName, orgao, cargo },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success(`Convite enviado para ${email}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users-all"] });
      setEmail(""); setFullName(""); setOrgao(""); setCargo("");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao enviar convite");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-2xl border p-6 w-full max-w-md shadow-2xl" style={{ background: mc.card, borderColor: mc.border }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: mc.text }}>
            <UserPlus className="h-5 w-5" style={{ color: mc.accent }} />
            Convidar Usuário
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" style={{ color: mc.muted }} />
          </button>
        </div>

        <p className="text-xs mb-5" style={{ color: mc.muted }}>
          O usuário receberá um e-mail com link para definir sua senha de acesso à plataforma.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium mb-1 block" style={{ color: mc.muted }}>E-mail *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@orgao.gov.br"
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500/30"
              style={{ background: mc.bg, borderColor: mc.border, color: mc.text }}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium mb-1 block" style={{ color: mc.muted }}>Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Maria da Silva"
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500/30"
              style={{ background: mc.bg, borderColor: mc.border, color: mc.text }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium mb-1 block" style={{ color: mc.muted }}>Órgão</label>
              <input
                type="text"
                value={orgao}
                onChange={e => setOrgao(e.target.value)}
                placeholder="Câmara Municipal"
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500/30"
                style={{ background: mc.bg, borderColor: mc.border, color: mc.text }}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium mb-1 block" style={{ color: mc.muted }}>Cargo</label>
              <input
                type="text"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                placeholder="Analista"
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500/30"
                style={{ background: mc.bg, borderColor: mc.border, color: mc.text }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-white/5 transition-colors"
            style={{ borderColor: mc.border, color: mc.muted }}
          >
            Cancelar
          </button>
          <button
            onClick={() => inviteMutation.mutate()}
            disabled={!email || inviteMutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: mc.accent }}
          >
            {inviteMutation.isPending ? "Enviando..." : "Enviar Convite"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UsersTab({ mc }: { mc: McTheme }) {
  const [inviteOpen, setInviteOpen] = useState(false);

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

      {/* Invite button */}
      <div className="flex justify-end">
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ background: mc.accent }}
        >
          <UserPlus className="h-4 w-4" />
          Convidar Usuário
        </button>
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

      <InviteUserDialog mc={mc} open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
