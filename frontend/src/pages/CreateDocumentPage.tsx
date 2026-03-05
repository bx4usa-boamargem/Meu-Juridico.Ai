import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepIndicator } from '../components/wizard/StepIndicator';
import { Step1 } from '../components/wizard/steps/Step1';
import { Step2 } from '../components/wizard/steps/Step2';
import { Step3 } from '../components/wizard/steps/Step3';
import { Step4 } from '../components/wizard/steps/Step4';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { submitWizardData } from '../services/documentCreationService';
import { Loader2 } from 'lucide-react';

const STEPS = [
    { id: 1, label: 'Necessidade' },
    { id: 2, label: 'Requisitante' },
    { id: 3, label: 'Requisitos' },
    { id: 4, label: 'Confirmação' },
];

export function CreateDocumentPage() {
    const navigate = useNavigate();
    const { session } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [wizardData, setWizardData] = useState<any>({
        tipo_objeto: 'Serviço',
        department_id: '',
        responsible_name: '',
        responsible_email: '',
        needs_description: '',
        justification: ''
    });

    useEffect(() => {
        if (!session?.user?.id) return;
        supabase
            .from('users')
            .select('org_id')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => setOrgId(data?.org_id || null));
    }, [session]);

    const updateData = (newData: any) => {
        setWizardData((prev: any) => ({ ...prev, ...newData }));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        if (!session?.user?.id || !orgId) throw new Error('Usuário sem organização vinculada');

        const docId = await submitWizardData(wizardData, session.user.id, orgId);
        // Redireciona para exibir status generating
        navigate(`/documentos/${docId}`);
    };

    if (!orgId) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col max-w-5xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-brand-dark">Novo Documento</h1>
                <p className="text-text-secondary mt-2">Crie a documentação inicial guiada por IA a partir das necessidades e requisitos básicos.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border-base p-8">
                <StepIndicator steps={STEPS} currentStep={currentStep} />

                <div className="mt-8">
                    {currentStep === 1 && (
                        <Step1 data={wizardData} updateData={updateData} onNext={nextStep} />
                    )}
                    {currentStep === 2 && (
                        <Step2 data={wizardData} updateData={updateData} onNext={nextStep} onBack={prevStep} />
                    )}
                    {currentStep === 3 && (
                        <Step3 data={wizardData} updateData={updateData} onNext={nextStep} onBack={prevStep} />
                    )}
                    {currentStep === 4 && (
                        <Step4 data={wizardData} updateData={updateData} onSubmit={handleSubmit} onBack={prevStep} />
                    )}
                </div>
            </div>
        </div>
    );
}
