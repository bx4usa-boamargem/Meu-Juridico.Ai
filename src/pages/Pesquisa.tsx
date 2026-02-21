import { Search } from "lucide-react";

export default function Pesquisa() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
      <Search className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">Pesquisa de referência será disponibilizada em breve.</p>
    </div>
  );
}
