import { useState, useEffect } from 'react';
import { useTemplates } from '../../../hooks/useTemplates';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Step4Props {
    data: any;
    updateData: (data: any) => void;
    onSubmit: () => Promise<void>;
    onBack: () => void;
}

export function Step4({ data, updateData, onSubmit, onBack }: Step4Props) {
    const { templates, loading } = useTemplates('Todos', '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!data.template_id) {
            setError('Selecione um modelo de documento.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await onSubmit();
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar documento');
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col animate-in fade-in duration-300">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-brand-dark mb-1">Confirmação e Modelo</h2>
                <p className="text-sm text-text-secondary">Revise as informações e selecione o modelo de documento para geração via Inteligência Artificial.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Resumo Esquerdo */}
                <div className="w-full lg:w-1/3 flex flex-col space-y-4">
                    <div className="bg-main border border-border-base rounded-lg p-4">
                        <h3 className="font-bold text-sm text-brand-dark border-b border-border-mid pb-2 mb-3">Resumo da Demanda</h3>

                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-text-muted text-xs">Tipo de Objeto</p>
                                <p className="font-medium text-brand-dark">{data.tipo_objeto || 'Não informado'}</p>
                            </div>
                            <div>
                                <p className="text-text-muted text-xs">Área Requisitante (ID)</p>
                                <p className="font-medium text-brand-dark">{data.department_id || 'Não informado'}</p>
                            </div>
                            <div>
                                <p className="text-text-muted text-xs">Responsável</p>
                                <p className="font-medium text-brand-dark truncate">{data.responsible_name} ({data.responsible_email})</p>
                            </div>
                            <div>
                                <p className="text-text-muted text-xs">Requisitos Preenchidos</p>
                                <p className="font-medium text-brand-dark">
                                    {Object.keys(data).filter(k => k.startsWith('req_') && data[k]?.trim()).length} de 8 categorias
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seleção de Template Direita */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-brand-dark mb-3">Selecione o Modelo <span className="text-status-red">*</span></h3>

                    {loading ? (
                        <div className="flex items-center justify-center p-8 border border-border-base rounded-lg bg-main">
                            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => {
                                        updateData({ template_id: t.id });
                                        if (error) setError('');
                                    }}
                                    className={cn(
                                        "cursor-pointer border rounded-lg p-4 transition-all relative overflow-hidden flex flex-col h-32",
                                        data.template_id === t.id
                                            ? "border-brand-primary ring-1 ring-brand-primary bg-brand-light shadow-sm"
                                            : "border-border-base bg-white hover:border-brand-primary/50 hover:bg-main"
                                    )}
                                >
                                    {data.template_id === t.id && (
                                        <div className="absolute top-3 right-3 text-brand-primary">
                                            <CheckCircle2 className="w-5 h-5 fill-brand-primary text-white" />
                                        </div>
                                    )}
                                    <div className="flex items-center mb-2 pr-6">
                                        <FileText className={cn("w-4 h-4 mr-2", data.template_id === t.id ? "text-brand-primary" : "text-text-secondary")} />
                                        <Badge variant="publicado">{t.category}</Badge>
                                    </div>
                                    <h4 className="font-bold text-sm text-brand-dark line-clamp-2">{t.name}</h4>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <div className="mt-4 p-3 bg-status-red/10 animate-in slide-in-from-top-2 border border-status-red/20 text-status-red text-sm rounded-md">{error}</div>}
                </div>
            </div>

            <div className="flex justify-between pt-6 mt-8 border-t border-border-base">
                <button
                    onClick={onBack}
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 border border-border-mid text-text-primary hover:bg-main disabled:opacity-50"
                >
                    Voltar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-lg px-8 py-2 text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 bg-brand-primary text-white shadow-sm hover:shadow-md hover:bg-[#1565A0] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Gerando Documento...
                        </>
                    ) : 'Gerar Documento (IA)'}
                </button>
            </div>
        </div>
    );
}
