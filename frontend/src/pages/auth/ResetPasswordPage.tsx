import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';

export function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Verificar se há hash de recuperação na URL (Opcional, pois o Supabase já seta a sessão)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // Se não há sessão, o link pode ser inválido ou expirado. Mas deixamos tentar pelo hash.
                supabase.auth.onAuthStateChange(async (event, _session) => {
                    if (event === "PASSWORD_RECOVERY") {
                        console.log("Recovery session estabilizada");
                    }
                });
            }
        });
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('As senhas digitadas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A nova credencial deve possuir no mínimo 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
        } else {
            navigate('/senha-redefinida');
        }
    };

    return (
        <AuthLayout
            title="Definir Nova Credencial"
            subtitle="Crie uma nova senha de acesso seguro para o sistema"
        >
            <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                    <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                    <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full"
                    />
                </div>

                {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">{error}</div>}

                <Button
                    type="submit"
                    className="w-full bg-[#1A56DB] hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-2"
                    isLoading={loading}
                >
                    Salvar Nova Credencial
                </Button>
            </form>
        </AuthLayout>
    );
}
