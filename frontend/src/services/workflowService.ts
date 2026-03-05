import { supabase } from '../lib/supabase';

export async function transitionDocument(documentId: string, action: string, comment?: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sessão expirada');

    const { data, error } = await supabase.rpc('transition_document_status', {
        p_document_id: documentId,
        p_action: action,
        p_user_id: session.user.id,
        p_comment: comment
    });

    if (error) throw new Error(error.message || 'Erro ao realizar transição do documento');
    return data;
}

export async function getTransitionHistory(documentId: string) {
    const { data, error } = await supabase
        .from('workflow_transitions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
