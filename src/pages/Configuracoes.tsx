import { Settings } from "lucide-react";

export default function Configuracoes() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
      <Settings className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">Configurações serão disponibilizadas em breve.</p>
    </div>
  );
}
