import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ModelsPage } from './components/models/ModelsPage';
import { DocumentPage } from './components/documents/DocumentPage';
import { AuthGuard } from './components/layout/AuthGuard';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { EmailSentPage } from './pages/auth/EmailSentPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { PasswordResetSuccessPage } from './pages/auth/PasswordResetSuccessPage';
import { CreateDocumentPage } from './pages/CreateDocumentPage';
import { ApprovalsPage } from './pages/ApprovalsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Flow GovTech */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/email-enviado" element={<EmailSentPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/senha-redefinida" element={<PasswordResetSuccessPage />} />

        <Route path="/" element={<AuthGuard><MainLayout /></AuthGuard>}>
          <Route index element={<DashboardPage />} />
          <Route path="modelos" element={<ModelsPage />} />
          <Route path="documentos/:id" element={<DocumentPage />} />
          <Route path="criar" element={<CreateDocumentPage />} />
          <Route path="documentos" element={<DashboardPage />} />
          <Route path="aprovacoes" element={<ApprovalsPage />} />
          <Route path="ajuda" element={<div className="p-8"><h1>Ajuda</h1></div>} />
          <Route path="consumo" element={<div className="p-8"><h1>Meu Consumo</h1></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
