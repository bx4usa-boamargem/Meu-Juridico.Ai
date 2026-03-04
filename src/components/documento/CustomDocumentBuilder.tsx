import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface CustomSection {
  id: string;
  title: string;
  instructions: string;
}

interface CustomDocumentBuilderProps {
  onConfirm: (sections: { section_id: string; title: string; order_index: number; required: boolean; instructions: string }[]) => void;
  onBack: () => void;
}

export function CustomDocumentBuilder({ onConfirm, onBack }: CustomDocumentBuilderProps) {
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingInstructions, setEditingInstructions] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (!editingTitle.trim()) {
      toast.error("Informe o título da seção");
      return;
    }
    const newSection: CustomSection = {
      id: `custom_${Date.now()}`,
      title: editingTitle.trim(),
      instructions: editingInstructions.trim(),
    };
    setSections((prev) => [...prev, newSection]);
    setEditingTitle("");
    setEditingInstructions("");
    setShowForm(false);
  };

  const handleRemove = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleConfirm = () => {
    if (sections.length === 0) {
      toast.error("Adicione pelo menos uma seção");
      return;
    }
    onConfirm(
      sections.map((s, i) => ({
        section_id: s.id,
        title: s.title,
        order_index: i,
        required: true,
        instructions: s.instructions,
      }))
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Monte seu documento</h1>
          <p className="text-sm text-muted-foreground">
            Defina as seções que compõem o seu documento personalizado
          </p>
        </div>
      </div>

      {/* Existing sections */}
      {sections.length > 0 && (
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <Card key={section.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-semibold truncate">{section.title}</h3>
                  </div>
                  {section.instructions && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {section.instructions}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(section.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add section form */}
      {showForm ? (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Título da seção</label>
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Ex: Análise de Viabilidade"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Instruções para a IA</label>
              <Textarea
                value={editingInstructions}
                onChange={(e) => setEditingInstructions(e.target.value)}
                placeholder="Descreva o que deve ser abordado nesta seção..."
                className="text-sm min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive"
                onClick={() => { setShowForm(false); setEditingTitle(""); setEditingInstructions(""); }}
              >
                Cancelar
              </Button>
              <Button size="sm" className="text-xs gap-1" onClick={handleAdd}>
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full text-xs gap-1 border-dashed"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar seção
        </Button>
      )}

      {/* Confirm */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleConfirm} disabled={sections.length === 0} className="gap-2">
          Iniciar documento ({sections.length} {sections.length === 1 ? "seção" : "seções"})
        </Button>
      </div>
    </div>
  );
}
