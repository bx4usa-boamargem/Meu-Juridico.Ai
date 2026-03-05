import { useState } from 'react';
import { Tabs } from '../../ui/Tabs';
import { AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const REQ_CATEGORIES = [
    { id: 'negocio', label: 'Necessidades de Negócio' },
    { id: 'tecnologicos', label: 'Tecnológicos' },
    { id: 'legais', label: 'Legais e Gerais' },
    { id: 'seguranca', label: 'Segurança' },
    { id: 'sociais', label: 'Sociais/Ambientais' },
    { id: 'projeto', label: 'Projeto e Implementação' },
    { id: 'garantia', label: 'Garantia Técnica' },
    { id: 'experiencia', label: 'Experiência' }
];

interface Step3Props {
    data: any;
    updateData: (data: any) => void;
    onNext: () => void;
    onBack: () => void;
}

export function Step3({ data, updateData, onNext, onBack }: Step3Props) {
    const [activeTab, setActiveTab] = useState('negocio');

    // Create tabs array including a warning icon if a tab is empty
    const tabs = REQ_CATEGORIES.map(cat => {
        const hasContent = !!data[`req_${cat.id}`]?.trim();
        return {
            id: cat.id,
            label: cat.label,
            icon: !hasContent ? () => <AlertTriangle className="w-3 h-3 text-status-yellow inline ml-1 mb-0.5" /> : undefined
        };
    });

    const activeContent = data[`req_${activeTab}`] || '';

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-brand-dark mb-1">Descrição dos Requisitos</h2>
                <p className="text-sm text-text-secondary">Preencha os requisitos de contratação. Abas vazias apresentarão alerta, mas não impedem o avanço (a IA lidará com os vazios).</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[400px]">
                {/* Vertical Tabs for Desktop, Horizontal for Mobile if adapted */}
                <div className="w-full lg:w-64 flex-shrink-0 flex flex-col space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center text-left px-4 py-3 text-sm rounded-lg transition-colors border",
                                activeTab === tab.id
                                    ? "bg-brand-light text-brand-primary font-bold border-brand-primary/20"
                                    : "bg-white text-text-secondary border-transparent hover:bg-main hover:text-brand-dark"
                            )}
                        >
                            <span className="flex-1">{tab.label}</span>
                            {tab.icon && <tab.icon />}
                        </button>
                    ))}
                </div>

                <div className="flex-1 flex flex-col bg-main rounded-lg border border-border-base p-4">
                    <label className="text-sm font-semibold text-brand-dark mb-2">Descreva os detalhes:</label>
                    <textarea
                        value={activeContent}
                        onChange={e => updateData({ [`req_${activeTab}`]: e.target.value })}
                        className="flex-1 w-full rounded-md border border-border-mid bg-white p-4 text-sm text-text-primary focus-visible:outline-none focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary resize-none placeholder:text-text-muted"
                        placeholder={`Insira os requisitos ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} aqui...`}
                    />
                </div>
            </div>

            <div className="flex justify-between pt-6 mt-6 border-t border-border-base">
                <button
                    onClick={onBack}
                    className="inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 border border-border-mid text-text-primary hover:bg-main"
                >
                    Voltar
                </button>
                <button
                    onClick={onNext}
                    className="inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 bg-brand-primary text-white hover:bg-[#1565A0]"
                >
                    Avançar
                </button>
            </div>
        </div>
    );
}
