import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PipelineStep {
    tipo: string;
    posicao: number;
    doc_id: string | null;
    status: string | null;
    desbloqueado: boolean;
}

export function useProcessPipeline(processId: string | undefined) {
    const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPipeline = async () => {
        if (!processId) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('obter_pipeline_processo', {
            p_processo_id: processId
        });

        if (!error && data) {
            setPipeline(data as PipelineStep[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPipeline();
    }, [processId]);

    // Encontrar o próximo passo que pode ser gerado
    const nextStep = pipeline.find(step => !step.doc_id && step.desbloqueado);

    return {
        pipeline,
        nextStep,
        loading,
        reload: fetchPipeline
    };
}
