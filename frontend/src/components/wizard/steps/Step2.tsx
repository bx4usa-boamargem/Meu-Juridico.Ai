import { useState } from 'react';
import { AutosizeTextarea } from '../../ui/AutosizeTextarea';
import { useDepartments } from '../../../hooks/useDepartments';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Step2Props {
    data: any;
    updateData: (data: any) => void;
    onNext: () => void;
    onBack: () => void;
}

export function Step2({ data, updateData, onNext, onBack }: Step2Props) {
    const { departments, loading } = useDepartments();
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleNext = () => {
        const newErrors: { [key: string]: string } = {};
        if (!data.department_id) newErrors.department_id = 'Obrigatório';
        if (!data.responsible_name?.trim()) newErrors.responsible_name = 'Obrigatório';
        if (!data.responsible_email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.responsible_email)) {
            newErrors.responsible_email = 'Email inválido ou obrigatório';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onNext();
    };

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-300">
            <div>
                <h2 className="text-xl font-bold text-brand-dark mb-1">Área Requisitante</h2>
                <p className="text-sm text-text-secondary">Informe o setor e o responsável por esta demanda.</p>
            </div>

            <div className="flex flex-col space-y-4 max-w-xl">
                <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-semibold text-brand-dark">Departamento Requisitante <span className="text-status-red">*</span></label>
                    <div className="relative">
                        <select
                            value={data.department_id || ''}
                            onChange={e => {
                                updateData({ department_id: e.target.value });
                                if (errors.department_id) setErrors({ ...errors, department_id: '' });
                            }}
                            disabled={loading}
                            className={`flex h-10 w-full rounded-md border ${errors.department_id ? 'border-status-red' : 'border-border-base'} bg-white px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 transition-all ${loading ? 'opacity-50' : ''}`}
                        >
                            <option value="" disabled>Selecione um departamento...</option>
                            {departments.map(dep => (
                                <option key={dep.id} value={dep.id}>{dep.name}</option>
                            ))}
                        </select>
                        {loading && <Loader2 className="w-4 h-4 animate-spin absolute right-8 top-3 text-text-muted" />}
                    </div>
                    {errors.department_id && <span className="text-xs text-status-red">{errors.department_id}</span>}
                </div>

                <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-semibold text-brand-dark">Nome do Responsável <span className="text-status-red">*</span></label>
                    <AutosizeTextarea
                        placeholder="Ex: Maria Luiza Silva"
                        value={data.responsible_name || ''}
                        onChange={e => {
                            updateData({ responsible_name: e.target.value });
                            if (errors.responsible_name) setErrors({ ...errors, responsible_name: '' });
                        }}
                        className={cn(
                            "flex w-full rounded-md border bg-white px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20",
                            errors.responsible_name ? 'border-status-red' : 'border-border-base'
                        )}
                        minRows={1}
                    />
                    {errors.responsible_name && <span className="text-xs text-status-red">{errors.responsible_name}</span>}
                </div>

                <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-semibold text-brand-dark">E-mail do Responsável <span className="text-status-red">*</span></label>
                    <AutosizeTextarea
                        placeholder="Ex: maria.silva@orgao.gov.br"
                        value={data.responsible_email || ''}
                        onChange={e => {
                            updateData({ responsible_email: e.target.value });
                            if (errors.responsible_email) setErrors({ ...errors, responsible_email: '' });
                        }}
                        className={cn(
                            "flex w-full rounded-md border bg-white px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20",
                            errors.responsible_email ? 'border-status-red' : 'border-border-base'
                        )}
                        minRows={1}
                    />
                    {errors.responsible_email && <span className="text-xs text-status-red">{errors.responsible_email}</span>}
                </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border-base">
                <button
                    onClick={onBack}
                    className="inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 border border-border-mid text-text-primary hover:bg-main"
                >
                    Voltar
                </button>
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
