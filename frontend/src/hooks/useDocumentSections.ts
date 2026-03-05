import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useDocumentSections(documentId: string | undefined) {
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSections = async () => {
        if (!documentId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('document_sections')
            .select('*')
            .eq('document_id', documentId)
            .order('order_index', { ascending: true }); // Assumindo order_index

        if (!error && data) {
            setSections(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSections();

        // Polling/Subscrição simples via Realtime para tracking contínuo (se a Edge alterar por background)
        if (!documentId) return;

        const channel = supabase
            .channel(`public:document_sections:document_id=eq.${documentId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'document_sections',
                filter: `document_id=eq.${documentId}`
            }, () => {
                fetchSections(); // Re-fetch completo p/ re-render
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [documentId]);

    const updateSectionContent = async (sectionId: string, content: string) => {
        const { error } = await supabase
            .from('document_sections')
            .update({ content, has_warnings: false }) // Reset warnings no manual edit
            .eq('id', sectionId);

        if (error) throw error;
        // The real-time subscription will pick up the change, but we can do optimistic update
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, content, has_warnings: false } : s));
    };

    return {
        sections,
        loading,
        reload: fetchSections,
        updateSectionContent
    };
}
