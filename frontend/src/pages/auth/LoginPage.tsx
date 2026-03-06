import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        let signInError = null;

        if (import.meta.env.DEV) {
            // Em ambiente de desenvolvimento (Lovable), bypass simples
            // Tenta logar de verdade, se falhar, logamos apenas no navegador
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            signInError = error;

            // Faz um bypass forte pra testar a aplicação no desenvolvimento
            if (signInError) {
                console.warn("Bypass no Dev: Credenciais simuladas.");
                localStorage.setItem('supabase.auth.token', 'dev-token');
                window.dispatchEvent(new Event('storage'));
                signInError = null;
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            signInError = error;
        }

        if (signInError) {
            setError('Credenciais inválidas. Verifique seu e-mail e senha.');
        } else {
            navigate('/');
        }

        setLoading(false);
    };

    return (
        <AuthLayout
            title="Acesso Restrito"
            subtitle="Insira suas credenciais institucionais para acessar o sistema"
        >
            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Institucional</label>
                    <Input
                        type="email"
                        placeholder="nome.sobrenome@orgao.gov.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                    <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full"
                    />
                </div>

                <div className="flex justify-between items-center text-sm">
                    <label className="flex items-center text-gray-600">
                        <input type="checkbox" className="mr-2 rounded text-[#1A56DB] focus:ring-[#1A56DB]" />
                        Lembrar-me
                    </label>
                    <Link to="/esqueci-senha" className="text-[#1A56DB] hover:underline font-medium">
                        Esqueceu sua senha?
                    </Link>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">{error}</div>}

                <Button
                    type="submit"
                    className="w-full bg-[#1A56DB] hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                    isLoading={loading}
                >
                    Acessar Plataforma
                </Button>

                <p className="text-xs text-center text-gray-400 mt-6 leading-relaxed">
                    Acesso exclusivo a servidores credenciados.<br />
                    Central de Atendimento: Admin TI.
                </p>
            </form>
        </AuthLayout>
    );
}
