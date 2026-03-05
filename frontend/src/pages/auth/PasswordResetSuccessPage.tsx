// Success Page
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { CheckCircle } from 'lucide-react';

export function PasswordResetSuccessPage() {
    return (
        <AuthLayout
            title="Credencial Atualizada"
            subtitle="Sua senha foi redefinida com extremo sucesso operacional."
        >
            <div className="text-center space-y-6 flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-green-500" strokeWidth={1.5} />

                <p className="text-gray-600 leading-relaxed text-sm">
                    Sua nova senha de acesso já está sincronizada e ativa nos servidores do Meu Jurídico. Você já pode utilizar a plataforma clicando abaixo.
                </p>

                <div className="w-full pt-4 mt-2">
                    <Link
                        to="/login"
                        className="block w-full bg-[#1E3A5F] hover:bg-[#152c48] text-white font-medium py-2.5 rounded-lg transition-colors"
                    >
                        Acessar Plataforma Oficial
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
