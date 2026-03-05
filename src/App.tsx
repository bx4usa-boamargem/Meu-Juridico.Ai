import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { DocumentLayout } from "@/components/layout/DocumentLayout";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Processos from "./pages/Processos";
import Processo from "./pages/Processo";
import Documentos from "./pages/Documentos";
import Documento from "./pages/Documento";
import DocumentView from "./pages/DocumentView";
import Pesquisa from "./pages/Pesquisa";
import Configuracoes from "./pages/Configuracoes";
import SharedDocument from "./pages/SharedDocument";
import SelecionarTipoDocumento from "./pages/SelecionarTipoDocumento";
import Perfil from "./pages/Perfil";
import BaseConhecimento from "./pages/BaseConhecimento";
import AdminMonitoramento from "./pages/AdminMonitoramento";
import AdminDashboard from "./pages/AdminDashboard";
import MeuImpacto from "./pages/MeuImpacto";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/shared/:token" element={<SharedDocument />} />
          <Route
            path="/processo/:processoId/novo-documento"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SelecionarTipoDocumento />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/processo/:processoId/documento/:docId"
            element={
              <ProtectedRoute>
                <DocumentLayout>
                  <Documento />
                </DocumentLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/processo/:processoId/documento/:docId/view"
            element={
              <ProtectedRoute>
                <DocumentLayout>
                  <DocumentView />
                </DocumentLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/processos" element={<Processos />} />
                    <Route path="/processo/:id" element={<Processo />} />
                    <Route path="/documentos" element={<Documentos />} />
                    <Route path="/pesquisa" element={<Pesquisa />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="/meu-impacto" element={<MeuImpacto />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
