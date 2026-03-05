import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

type View = "form" | "success";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("form");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived via recovery link — form is ready
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setView("success");
    } catch (err: any) {
      toast.error(err.message || "Erro ao redefinir senha");
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "success") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <div className="w-full max-w-md text-center space-y-6">
          {/* Lock icon */}
          <div className="flex justify-center">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="24" y="36" width="32" height="24" rx="4" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="none" />
              <path d="M30 36V28a10 10 0 0120 0v8" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="none" />
              <circle cx="40" cy="48" r="3" fill="hsl(var(--primary))" />
              <line x1="40" y1="51" x2="40" y2="55" stroke="hsl(var(--primary))" strokeWidth="2" />
              <rect x="28" y="62" width="24" height="6" rx="1" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" />
              <text x="33" y="67" fontSize="5" fill="hsl(var(--primary))" fontFamily="monospace">****_</text>
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Senha redefinida!</h1>
            <p className="text-muted-foreground mt-2">
              Sua senha foi alterada com sucesso. Click em continuar para
              <br />
              fazer login em sua conta do Meu Jurídico
            </p>
          </div>

          <button
            onClick={() => navigate("/auth")}
            className="w-full max-w-xs mx-auto py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors block"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Definir nova senha</h1>
          <p className="text-muted-foreground mt-2">
            Cria uma nova senha para acesso ao seu sistema
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Digite uma nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 pr-11 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirme sua nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 pr-11 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "Redefinindo..." : "Redefinir senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
