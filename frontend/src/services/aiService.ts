import { supabase } from '../lib/supabase';

// Chamadas às Edge Functions de IA
export async function aiImproveSection(documentId: string, sectionId: string) {
    const { data, error } = await supabase.functions.invoke('ai_improve_section', {
        body: { document_id: documentId, section_id: sectionId }
    });

    if (error) throw new Error(error.message || 'Erro ao invocar melhoria por IA');
    return data;
}

export async function aiValidateSection(documentId: string, sectionId: string) {
    const { data, error } = await supabase.functions.invoke('ai_validate_section', {
        body: { document_id: documentId, section_id: sectionId }
    });

    if (error) throw new Error(error.message || 'Erro ao invocar validação por IA');
    return data;
}

// Futuras chamadas podem ser adicionadas aqui
