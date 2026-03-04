import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, X } from "lucide-react";

interface TeamMember {
  nome: string;
  cargo: string;
  email: string;
  matricula: string;
}

interface Props {
  value: TeamMember[];
  onChange: (members: TeamMember[]) => void;
}

export function TeamListField({ value, onChange }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TeamMember>({ nome: "", cargo: "", email: "", matricula: "" });

  const members = Array.isArray(value) ? value : [];

  const handleAdd = () => {
    if (!form.nome.trim()) return;
    onChange([...members, { ...form }]);
    setForm({ nome: "", cargo: "", email: "", matricula: "" });
    setDialogOpen(false);
  };

  const handleRemove = (idx: number) => {
    onChange(members.filter((_, i) => i !== idx));
  };

  if (members.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-lg bg-muted/20">
          <Users className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground font-medium">A lista de equipe está vazia</p>
          <p className="text-[10px] text-muted-foreground mt-1">Clique em adicionar para incluir membros</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </Button>

        <AddMemberDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          form={form}
          setForm={setForm}
          onAdd={handleAdd}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {members.map((m, i) => (
          <div key={i} className="flex items-start gap-3 border rounded-lg p-3 bg-card">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{m.nome}</p>
              <p className="text-[11px] text-muted-foreground">{m.cargo}</p>
              {m.email && <p className="text-[10px] text-muted-foreground">{m.email}</p>}
              {m.matricula && <p className="text-[10px] text-muted-foreground">Matrícula: {m.matricula}</p>}
            </div>
            <button onClick={() => handleRemove(i)} className="text-muted-foreground hover:text-destructive shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setDialogOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Adicionar
      </Button>

      <AddMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        onAdd={handleAdd}
      />
    </div>
  );
}

function AddMemberDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  form: TeamMember;
  setForm: (f: TeamMember) => void;
  onAdd: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Adicionar membro</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome *</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="text-sm" />
          </div>
          <div>
            <Label className="text-xs">Cargo</Label>
            <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} className="text-sm" />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="text-sm" type="email" />
          </div>
          <div>
            <Label className="text-xs">Matrícula</Label>
            <Input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} className="text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" onClick={onAdd} disabled={!form.nome.trim()}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}