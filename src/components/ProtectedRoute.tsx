import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // BYPASS TEMPORÁRIO: libera todas as rotas para teste sem autenticação
  return <>{children}</>;
}
