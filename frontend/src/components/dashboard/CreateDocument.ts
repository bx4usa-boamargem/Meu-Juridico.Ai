import { supabase } from '../../lib/supabase';

export async function createDocument(docType: string, orgId: string, userId: string): Promise<string> {
    // 1. Criar process primeiro
    const { data: process, error: procError } = await supabase
        .from('processes')
        .insert({
            org_id: orgId,
            created_by: userId,
            status: 'ativo',
            tipo_objeto: 'servico_continuo', // default
        })
        .select('id')
        .single();

    if (procError) throw procError;

    // 2. Criar document vinculado ao process
    const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
            org_id: orgId,
            process_id: process.id,
            created_by: userId,
            doc_type: docType,
            status: 'rascunho',
            title: `Novo ${docType} — ${new Date().toLocaleDateString('pt-BR')}`,
        })
        .select('id')
        .single();

    if (docError) throw docError;

    // 3. Log no audit_logs
    await supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: userId,
        action: 'document.created',
        entity_type: 'document',
        entity_id: document.id,
        new_value: { doc_type: docType },
    });

    return document.id;
}
