import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/redefinir-senha`,
        });

        if (resetError) {
            setError(resetError.message);
            setLoading(false);
        } else {
            navigate('/email-enviado');
        }
    };

    return (
        <AuthLayout
            title="Recuperação de Acesso"
            subtitle="Informe seu e-mail institucional para receber as instruções de recuperação de senha"
        >
            <form onSubmit={handleReset} className="space-y-5">
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

                {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">{error}</div>}

                <Button
                    type="submit"
                    className="w-full bg-[#1A56DB] hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                    isLoading={loading}
                >
                    Enviar Instruções
                </Button>

                <div className="text-center pt-4 border-t border-gray-100 mt-6">
                    <Link to="/login" className="text-sm text-gray-500 hover:text-[#1A56DB] font-medium transition-colors">
                        ← Voltar para o Login
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}
