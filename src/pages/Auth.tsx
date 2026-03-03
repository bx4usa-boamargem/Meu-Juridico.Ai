import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import logoIcon from "@/assets/logo-icon.png";
import { Eye, EyeOff, User, Lock, Mail } from "lucide-react";

type AuthView = "login" | "forgot" | "email-sent";

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Erro na autenticação");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Informe seu e-mail");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setView("email-sent");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar e-mail");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("E-mail reenviado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao reenviar");
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "email-sent") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <div className="w-full max-w-md text-center space-y-6">
          {/* Envelope icon */}
          <div className="flex justify-center">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="16" y="28" width="48" height="32" rx="3" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="none" />
              <path d="M16 31L40 48L64 31" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="none" />
              <rect x="30" y="18" width="24" height="18" rx="2" stroke="hsl(var(--primary))" strokeWidth="2" fill="hsl(var(--background))" />
              <line x1="35" y1="24" x2="49" y2="24" stroke="hsl(var(--primary))" strokeWidth="2" />
              <line x1="35" y1="29" x2="45" y2="29" stroke="hsl(var(--primary))" strokeWidth="2" />
              <circle cx="28" cy="28" r="3" fill="hsl(var(--primary))" opacity="0.3" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Email enviado!</h1>
            <p className="text-muted-foreground mt-2">
              Clique no link enviado para o e-mail{" "}
              <span className="font-semibold text-primary">{email}</span>
              <br />
              e crie uma nova senha de acesso ao Meu Jurídico
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border text-primary font-medium hover:bg-accent transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Abrir Gmail
            </a>
            <button
              onClick={handleResendEmail}
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Reenviar email
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "forgot") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Esqueceu sua senha?</h1>
            <p className="text-muted-foreground mt-2">
              Insira seu e-mail para receber o link de redefinição de senha
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="Endereço de email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Recuperar minha senha"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <button
              onClick={() => setView("login")}
              className="text-primary font-medium hover:underline"
            >
              Conecte-se
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Login view
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={logoIcon} alt="MeuJurídico.ai" className="h-16 w-16" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Faça login na sua conta</h1>
          <p className="text-muted-foreground mt-1">
            Bem vindo de volta! Selecione o método para fazer login
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email / CPF field */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* Password field */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-11 pr-11 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Remember me + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
              />
              Lembre-se da senha
            </label>
            <button
              type="button"
              onClick={() => setView("forgot")}
              className="text-sm text-primary font-medium hover:underline"
            >
              Esqueceu a senha?
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "Entrando..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
