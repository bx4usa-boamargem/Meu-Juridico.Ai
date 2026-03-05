import { useState } from 'react';
import { AutosizeTextarea } from '../../ui/AutosizeTextarea';
import { cn } from '../../../lib/utils';

interface Step1Props {
    data: any;
    updateData: (data: any) => void;
    onNext: () => void;
}

export function Step1({ data, updateData, onNext }: Step1Props) {
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleNext = () => {
        const newErrors: { [key: string]: string } = {};
        if (!data.needs_description?.trim()) newErrors.needs_description = 'Obrigatório';
        if (!data.justification?.trim()) newErrors.justification = 'Obrigatório';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onNext();
    };

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-300">
            <div>
                <h2 className="text-xl font-bold text-brand-dark mb-1">Descrição e Justificativa</h2>
                <p className="text-sm text-text-secondary">Descreva a base do seu processo e o tipo de objeto que será licitado ou adquirido.</p>
            </div>

            <div className="flex flex-col space-y-4">
                <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-semibold text-brand-dark">Tipo de Objeto</label>
                    <select
                        value={data.tipo_objeto || 'Serviço'}
                        onChange={e => updateData({ tipo_objeto: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-border-base bg-white px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 transition-all"
                    >
                        <option value="Serviço">Serviço</option>
                        <option value="Bem">Bem</option>
                        <option value="Obra">Obra</option>
                        <option value="TI">Tecnologia da Informação (TI)</option>
                    </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-semibold text-brand-dark">Descrição da Necessidade <span className="text-status-red">*</span></label>
                    <AutosizeTextarea
                        value={data.needs_description || ''}
                        onChange={e => {
                            updateData({ needs_description: e.target.value });
                            if (errors.needs_description) setErrors({ ...errors, needs_description: '' });
                        }}
                        className={cn(
                            "flex w-full rounded-md border bg-white px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20",
                            errors.needs_description ? 'border-status-red' : 'border-border-base'
                        )}
                        placeholder="Ex: Aquisição de 50 notebooks para o setor técnico..."
                        minRows={3}
                    />
                    {errors.needs_description && <span className="text-xs text-status-red">{errors.needs_description}</span>}
                </div>

                <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-semibold text-brand-dark">Justificativa <span className="text-status-red">*</span></label>
                    <AutosizeTextarea
                        value={data.justification || ''}
                        onChange={e => {
                            updateData({ justification: e.target.value });
                            if (errors.justification) setErrors({ ...errors, justification: '' });
                        }}
                        className={cn(
                            "flex w-full rounded-md border bg-white px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20",
                            errors.justification ? 'border-status-red' : 'border-border-base'
                        )}
                        placeholder="Ex: A renovação do parque tecnológico é essencial pois os atuais tem mais de 5 anos..."
                        minRows={3}
                    />
                    {errors.justification && <span className="text-xs text-status-red">{errors.justification}</span>}
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border-base">
                <button
                    onClick={handleNext}
                    className="inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 bg-brand-primary text-white hover:bg-[#1565A0]"
                >
                    Avançar
                </button>
            </div>
        </div>
    );
}
