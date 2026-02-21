import { useNavigate } from "react-router-dom";
import { Lock, RefreshCw, Download, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Check } from "lucide-react";

interface Props {
  tipo: string | null;
  numero: string | null;
  status: string | null;
  saving: boolean;
  lastSaved: Date | null;
  processoId: string;
  userEmail?: string;
}

export function DocumentMetaBar({ tipo, numero, status, saving, lastSaved, processoId, userEmail }: Props) {
  const navigate = useNavigate();
  const initials = userEmail?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <div className="h-10 shrink-0 border-b bg-card flex items-center px-4 gap-4">
      {/* LEFT */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-foreground">{tipo ?? "Documento"}</span>
        {numero && <span className="text-[10px] text-muted-foreground">• {numero}</span>}
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Pencil className="h-3 w-3" />
        </button>
      </div>

      {/* CENTER */}
      <div className="flex-1 flex items-center justify-center gap-3">
        <button className="text-muted-foreground hover:text-foreground"><Lock className="h-3.5 w-3.5" /></button>
        <button className="text-muted-foreground hover:text-foreground"><RefreshCw className="h-3.5 w-3.5" /></button>
        <button className="text-muted-foreground hover:text-foreground"><Download className="h-3.5 w-3.5" /></button>

        <span className="text-[10px] text-muted-foreground">
          {saving ? (
            <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-success" /> Salvo {lastSaved.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
          ) : null}
        </span>

        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[8px] bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-[10px] text-muted-foreground">{userEmail?.split("@")[0]}</span>
        </div>

        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
          {status ?? "Rascunho"}
        </Badge>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
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
