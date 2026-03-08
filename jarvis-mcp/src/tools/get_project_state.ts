import { supabase } from '../lib/supabase.js';

export async function getProjectState(project_name: string) {
    try {
        const { data, error } = await supabase
            .from('jarvis_projects')
            .select('*')
            .ilike('name', `%${project_name}%`)
            .single();

        if (error) throw error;

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    } catch (error) {
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Erro ao buscar estado do projeto "${project_name}": ${error}`,
                },
            ],
        };
    }
}
