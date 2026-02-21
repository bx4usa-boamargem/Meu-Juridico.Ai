import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

function useBreadcrumbs(): BreadcrumbEntry[] {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const crumbs: BreadcrumbEntry[] = [{ label: "Dashboard", href: "/dashboard" }];

  if (segments[0] === "processo" && segments[1]) {
    crumbs.push({ label: `Processo`, href: `/processo/${segments[1]}` });
    if (segments[2] === "documento" && segments[3]) {
      crumbs.push({ label: "Documento" });
    }
  }

  return crumbs;
}

export function TopBar() {
  const { user } = useAuth();
  const crumbs = useBreadcrumbs();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <header className="flex h-12 shrink-0 items-center border-b bg-background px-3 gap-3">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />

      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <BreadcrumbItem key={i}>
                {i > 0 && <BreadcrumbSeparator />}
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
