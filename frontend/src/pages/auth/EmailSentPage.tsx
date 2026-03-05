// Email Sent Page
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { CheckCircle } from 'lucide-react';

export function EmailSentPage() {
    return (
        <AuthLayout
            title="E-mail Enviado com Sucesso"
            subtitle="Instruções encaminhadas"
        >
            <div className="text-center space-y-6 flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-green-500" strokeWidth={1.5} />

                <p className="text-gray-600 leading-relaxed text-sm">
                    Enviamos um link de recuperação para o e-mail informado. Por favor, <strong>verifique sua caixa de entrada institucional</strong> e, se necessário, as pastas de spam ou lixo eletrônico.
                </p>

                <div className="w-full pt-4 mt-2">
                    <Link
                        to="/login"
                        className="block w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 rounded-lg transition-colors"
                    >
                        Retornar ao Acesso Restrito
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
