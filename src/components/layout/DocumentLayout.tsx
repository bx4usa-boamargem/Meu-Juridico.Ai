import { Link, useNavigate } from "react-router-dom";
import { Home, FilePlus, FileText, BarChart3, HelpCircle, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import logoFull from "@/assets/logo-full.png";

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Criar Documento", href: "/processos", icon: FilePlus },
  { label: "Meus Documentos", href: "/documentos", icon: FileText },
  { label: "Consumo", href: "/configuracoes", icon: BarChart3 },
  { label: "Ajuda", href: "#", icon: HelpCircle },
];

export function DocumentLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <div className="flex flex-col min-h-svh w-full">
      {/* GLOBAL NAV */}
      <header className="h-12 shrink-0 border-b bg-sidebar text-sidebar-foreground flex items-center px-4 gap-1">
        <Link to="/dashboard" className="flex items-center gap-2 mr-6">
          <img src={logoFull} alt="MeuJurídico.ai" className="h-6 brightness-0 invert" />
        </Link>

        <nav className="flex items-center gap-0.5 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/perfil")} className="text-xs">
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/configuracoes")} className="text-xs">
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="text-xs text-destructive">
              <LogOut className="h-3 w-3 mr-1.5" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
