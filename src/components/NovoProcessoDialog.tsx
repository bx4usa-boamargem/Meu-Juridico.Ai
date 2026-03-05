import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NovoProcessoDialog({ open, onOpenChange, onSuccess }: Props) {
  const navigate = useNavigate();
  const [numero, setNumero] = useState("");
  const [orgao, setOrgao] = useState("");
  const [objeto, setObjeto] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [cadeiaId, setCadeiaId] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: cadeias } = useQuery({
    queryKey: ["cadeias_documentais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cadeias_documentais")
        .select("*")
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  const filteredCadeias = cadeias?.filter(
    (c) => !modalidade || c.modalidade === modalidade
  );

  const modalidades = [...new Set(cadeias?.map((c) => c.modalidade).filter(Boolean))];

  const handleSave = async () => {
    if (!numero || !orgao || !objeto || !modalidade || !cadeiaId) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);
    try {
      const { data: processoId, error } = await supabase.rpc("create_processo_com_documento_raiz", {
        p_numero_processo: numero,
        p_orgao: orgao,
        p_objeto: objeto,
        p_modalidade: modalidade,
        p_cadeia_id: cadeiaId,
      });
      if (error) throw error;

      // Retry up to 2 times to find the DFD document
      let docId: string | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 300));
        const { data: doc } = await supabase
          .from("documentos")
          .select("id")
          .eq("processo_id", processoId)
          .eq("tipo", "dfd")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (doc?.id) {
          docId = doc.id;
          break;
        }
      }

      if (!docId) {
        toast.error("DFD não encontrado. Reabra o processo.");
        setSaving(false);
        return;
      }

      toast.success("Processo criado com sucesso!");
      onOpenChange(false);
      navigate(`/processo/${processoId}/documento/${docId}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar processo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Processo</DialogTitle>
          <DialogDescription>Preencha os dados para criar um novo processo administrativo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Número do Processo</Label>
            <Input placeholder="Ex: 001/2026" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Órgão</Label>
            <Input placeholder="Ex: Prefeitura Municipal" value={orgao} onChange={(e) => setOrgao(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Objeto</Label>
            <Input placeholder="Descrição do objeto da contratação" value={objeto} onChange={(e) => setObjeto(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Modalidade</Label>
            <Select value={modalidade} onValueChange={(v) => { setModalidade(v); setCadeiaId(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a modalidade" />
              </SelectTrigger>
              <SelectContent>
                {modalidades.map((m) => (
                  <SelectItem key={m} value={m!}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {modalidade && (
            <div className="space-y-2">
              <Label>Cadeia Documental</Label>
              <Select value={cadeiaId} onValueChange={setCadeiaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cadeia" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCadeias?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Criando..." : "Criar Processo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
