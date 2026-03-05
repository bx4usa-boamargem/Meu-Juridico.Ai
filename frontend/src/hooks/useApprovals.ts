import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useApprovals() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchApprovals = async () => {
        setLoading(true);
        // Supabase RLS deve garantir que apenas docs do mesmo org sejam listados.
        // E idealmente, você também pode filtrar via função caso necessário.
        const { data, error } = await supabase
            .from('documents')
            .select('*, processes(*)')
            .eq('status', 'review')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setDocuments(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchApprovals();

        const channel = supabase
            .channel('public:documents:review')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'documents'
            }, () => {
                fetchApprovals();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { documents, loading, reload: fetchApprovals };
}
