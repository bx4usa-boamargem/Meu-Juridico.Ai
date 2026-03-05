import { supabase } from '../lib/supabase';

interface ExportResult {
    url: string;
    hash: string;
    format: 'pdf' | 'docx';
}

export async function exportDocument(documentId: string, format: 'pdf' | 'docx'): Promise<ExportResult> {
    const { data, error } = await supabase.functions.invoke('export_document', {
        body: { document_id: documentId, format }
    });

    if (error) throw new Error(error.message || 'Erro ao exportar documento.');

    // Supondo que a edge function retorna url assinada e hash
    return {
        url: data.url,
        hash: data.hash,
        format
    };
}
