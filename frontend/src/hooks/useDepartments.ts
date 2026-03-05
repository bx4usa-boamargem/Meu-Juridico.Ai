import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useDepartments() {
    const { session } = useAuth();
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.user?.id) return;

        async function fetchDeps() {
            setLoading(true);

            // Primeiro pegar a org do usuario pra filtrar certo
            const { data: orgUser } = await supabase
                .from('organization_users')
                .select('org_id')
                .eq('user_id', session!.user.id)
                .single();

            if (!orgUser) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('departments')
                .select('id, name')
                .eq('org_id', orgUser.org_id)
                .order('name');

            setDepartments(data || []);
            setLoading(false);
        }

        fetchDeps();
    }, [session]);

    return { departments, loading };
}
