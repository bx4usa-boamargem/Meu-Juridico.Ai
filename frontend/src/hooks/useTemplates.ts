import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useTemplates(category?: string, search?: string) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let query = supabase
            .from('document_templates')
            .select('id, name, description, doc_type, category, is_default, chain_position')
            .order('chain_position');

        if (category && category !== 'Todos') {
            query = query.eq('category', category.toLowerCase());
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        query.then(({ data, error }) => {
            if (!error) setTemplates(data ?? []);
            setLoading(false);
        });
    }, [category, search]);

    return { templates, loading };
}
