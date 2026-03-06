import { supabase } from '../lib/supabase';

export async function submitWizardData(data: any, userId: string, orgId: string) {
    // 1. Iniciar pipeline de criação via serviço (similar à Correção 5, mas com os dados do Wizard e Edge Function)

    // a. processes
    const { data: processData, error: processErr } = await supabase
        .from('processes')
        .insert({
            org_id: orgId,
            status: 'rascunho',
            created_by: userId,
            department_id: data.department_id || null,
            objeto: data.needs_description || 'Objeto não informado',
            tipo_objeto: data.tipo_objeto || 'Serviço',
            // JSONB com todos os campos preenchidos
            dados_base: data
        })
        .select()
        .single();

    if (processErr || !processData) {
        console.error("Falha ao criar Processo:", processErr);
        throw new Error('Falha ao criar Processo (Base)');
    }

    // Fetch the template to get the exact doc_type
    const { data: templateData, error: templateErr } = await supabase
        .from('document_templates')
        .select('doc_type')
        .eq('id', data.template_id)
        .single();

    if (templateErr || !templateData) {
        console.error("Falha ao buscar template:", templateErr);
        throw new Error('Falha ao buscar doc_type do Template selecionado');
    }

    // b. documents (status: 'generating')
    const { data: docData, error: docErr } = await supabase
        .from('documents')
        .insert({
            process_id: processData.id,
            org_id: orgId,
            created_by: userId,
            doc_type: templateData.doc_type,
            title: `Documento - ${data.tipo_objeto}`,
            status: 'em_elaboracao'
        })
        .select()
        .single();

    if (docErr || !docData) {
        console.error("Falha ao criar Entidade Documento:", docErr);
        // Rollback silencioso conceitual (Apenas pra não sujar BD, idealmente via RPC, mantemos split pra simplificar Frontend sem alterar schema via regras)
        await supabase.from('processes').delete().eq('id', processData.id);
        throw new Error('Falha ao criar Entidade Documento');
    }

    // c. audit_logs (Strict tracking)
    const { error: auditErr } = await supabase
        .from('audit_logs')
        .insert({
            org_id: orgId, // Mandatory org_id
            user_id: userId,
            document_id: docData.id,
            action: 'document.generation_started',
            new_value: { template_id: data.template_id, fields_collected: Object.keys(data).length },
            role: 'user' // Hardcoded básico pra MVP frontend (ideal ser pego da config)
        });

    if (auditErr) {
        console.warn('Alerta audit_logs: ', auditErr);
    }

    // d. Invocar Edge Function (orchestrate_document) - Opcional rodando de forma assíncrona/esperando sucesso
    // Não amarramos exception dura do supabase.functions porque localmente pode não ter Edge Container vivo. Mas faremos trigger.
    try {
        await supabase.functions.invoke('orchestrate_document', {
            body: {
                document_id: docData.id,
                process_id: processData.id,
                template_id: data.template_id,
                user_id: userId
            }
        });
    } catch (edgeError) {
        console.warn('Orchestrate falhou (possível dev server indisponível), mas DB foi persistido. ', edgeError);
        // Não jogamos throw; deixamos seguir pro Document UI State (ele ficará 'generating' pra sempre localmente s/ Worker da Supabase).
    }

    return docData.id;
}

export async function createNextDocument(processId: string, docType: string, parentDocId: string, userId: string, orgId: string) {
    // 1. Buscar o template padrão para este tipo
    const { data: templateData, error: templateErr } = await supabase
        .from('document_templates')
        .select('id, name')
        .eq('doc_type', docType.toLowerCase())
        .eq('is_default', true)
        .single();

    if (templateErr || !templateData) {
        throw new Error(`Não foi possível encontrar o template padrão para ${docType}`);
    }

    // 2. Criar o documento
    const { data: docData, error: docErr } = await supabase
        .from('documents')
        .insert({
            process_id: processId,
            org_id: orgId,
            created_by: userId,
            doc_type: docType.toLowerCase(),
            title: `${docType.toUpperCase()} - ${templateData.name}`,
            status: 'em_elaboracao',
            parent_doc_id: parentDocId
        })
        .select()
        .single();

    if (docErr || !docData) {
        throw new Error('Falha ao criar o próximo documento na cadeia.');
    }

    // 3. Auditoria
    await supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: userId,
        document_id: docData.id,
        action: 'document.chain_sequential_created',
        new_value: { parent_doc_id: parentDocId, doc_type: docType },
        role: 'user'
    });

    // 4. Orquestrar seções
    try {
        await supabase.functions.invoke('orchestrate_document', {
            body: {
                document_id: docData.id,
                process_id: processId,
                template_id: templateData.id,
                user_id: userId,
                parent_doc_id: parentDocId
            }
        });
    } catch (e) {
        console.warn('Erro na orquestração:', e);
    }

    return docData.id;
}
