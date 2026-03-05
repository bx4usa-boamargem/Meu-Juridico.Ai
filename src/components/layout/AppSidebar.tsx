import { LayoutDashboard, FolderKanban, FileText, Search, Settings, LogOut, Zap } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import logoIcon from "@/assets/logo-icon.png";
import logoFull from "@/assets/logo-full.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Processos", url: "/processos", icon: FolderKanban },
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Pesquisa", url: "/pesquisa", icon: Search },
  { title: "Base de Conhecimento", url: "/base-conhecimento", icon: BookOpen },
  { title: "Meu Impacto", url: "/meu-impacto", icon: Zap, highlight: "gold" },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Mission Control", url: "/admin/dashboard", icon: Satellite, highlight: true },
];

const impactItem = { title: "Meu Impacto ⚡", url: "/meu-impacto", icon: Zap };

export function AppSidebar() {
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-3">
        <div className="flex items-center gap-2 px-2">
          {collapsed ? (
            <img src={logoIcon} alt="MeuJurídico.ai" className="h-7 w-7 shrink-0 brightness-0 invert" />
          ) : (
            <img src={logoFull} alt="MeuJurídico.ai" className="h-7 shrink-0 brightness-0 invert" />
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={`text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                        (item as any).highlight === "gold" ? "text-amber-500 font-semibold" :
                        (item as any).highlight ? "text-primary font-semibold" : ""
                      }`}
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{(item as any).highlight === "gold" ? `⚡ ${item.title}` : (item as any).highlight ? `🛰️ ${item.title}` : item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={impactItem.title}>
                  <NavLink
                    to={impactItem.url}
                    className="text-[#F59E0B] hover:bg-amber-50 font-semibold"
                    activeClassName="bg-amber-50 text-[#F59E0B] font-bold"
                  >
                    <impactItem.icon className="h-4 w-4 shrink-0 text-[#F59E0B]" />
                    <span>{impactItem.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip="Sair"
              className="text-sidebar-foreground/60 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
