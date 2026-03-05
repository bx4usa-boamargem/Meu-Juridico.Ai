import React from 'react';

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle?: string }) {
    return (
        <div className="min-h-screen flex">
            {/* Esquerda - Branding Institucional */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#1E3A5F] flex-col justify-center px-16 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
                <div className="max-w-xl relative z-10">
                    <h1 className="text-4xl font-bold mb-6">Meu Jurídico.ai</h1>
                    <p className="text-xl text-blue-100 leading-relaxed font-light">
                        Plataforma inteligente de gestão e compliance para documentos e contratações públicas, projetada para auditores e gestores exigentes.
                    </p>
                </div>
            </div>

            {/* Direita - Formulário */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-10 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="lg:hidden mb-6">
                            <h2 className="text-2xl font-bold text-[#1E3A5F]">Meu Jurídico.ai</h2>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
