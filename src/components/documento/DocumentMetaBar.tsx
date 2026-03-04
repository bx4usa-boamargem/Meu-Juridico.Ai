import { useNavigate } from "react-router-dom";
import { Pencil, Menu, Calendar, Loader2, Check, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface Props {
  tipo: string | null;
  numero: string | null;
  status: string | null;
  saving: boolean;
  lastSaved: Date | null;
  processoId: string;
  docId?: string;
  userEmail?: string;
  conformityScore?: number | null;
}

export function DocumentMetaBar({ tipo, numero, status, saving, lastSaved, processoId, docId, userEmail, conformityScore }: Props) {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const initials = userEmail?.slice(0, 2).toUpperCase() ?? "U";
  const displayName = userEmail?.split("@")[0] ?? "Usuário";
  const statusLabel = status ?? "Rascunho";
  const canExport = status === "gerado" || status === "aprovado";

  const scoreColor = conformityScore != null
    ? conformityScore > 0.8 ? "text-success" : conformityScore >= 0.6 ? "text-warning" : "text-destructive"
    : null;

  async function handleExportDocx() {
    if (!docId) return;
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export_docx", {
        body: { document_id: docId },
      });
      if (error) throw error;
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tipo ?? "documento"}-${docId}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error("Erro ao exportar: " + (err?.message ?? "erro desconhecido"));
    } finally {
      setExporting(false);
    }
  }

  const formattedDate = lastSaved
    ? lastSaved.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formattedTime = lastSaved
    ? lastSaved.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="h-12 shrink-0 border-b bg-card flex items-center px-4 gap-3">
      {/* LEFT — Title + edit + menu */}
      <div className="flex items-center gap-2 min-w-0">
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground truncate">
          {tipo ?? "Documento"}
        </span>
        {numero && (
          <span className="text-xs text-muted-foreground shrink-0">• {numero}</span>
        )}
        <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <Pencil className="h-3 w-3" />
        </button>
      </div>

      {/* CENTER — Meta info */}
      <div className="flex-1 flex items-center justify-center gap-4">
        {/* Last modified */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-[11px]">
            Última alteração: {formattedDate}
            {formattedTime && ` às ${formattedTime}`}
          </span>
        </div>

        {/* Save status */}
        <span className="text-[11px] text-muted-foreground">
          {saving ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Salvando...
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1 text-success">
              <Check className="h-3 w-3" /> Salvo
            </span>
          ) : null}
        </span>

        {/* Edited by */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Editado por</span>
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[8px] bg-secondary text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] font-medium text-foreground">{displayName}</span>
        </div>

        {/* Status badge */}
        <Badge
          className="text-[10px] px-2 py-0.5 bg-warning/15 text-warning border-warning/30 hover:bg-warning/20"
          variant="outline"
        >
          {statusLabel}
        </Badge>

        {/* Conformity score */}
        {conformityScore != null && (
          <Badge
            className={`text-[10px] px-2 py-0.5 ${scoreColor}`}
            variant="outline"
          >
            Conformidade: {Math.round(conformityScore * 100)}%
          </Badge>
        )}
      </div>

      {/* RIGHT — Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {canExport && docId && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleExportDocx}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Exportar DOCX
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => navigate(`/processo/${processoId}`)}
        >
          Sair
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => navigate("/processos")}
        >
          Criar Documento
        </Button>
      </div>
    </div>
  );
}
