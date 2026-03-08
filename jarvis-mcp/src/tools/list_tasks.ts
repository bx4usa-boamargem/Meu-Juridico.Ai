import { supabase } from '../lib/supabase.js';

export async function listTasks(project_id: string, limit: number = 20) {
    try {
        const { data, error } = await supabase
            .from('jarvis_tasks')
            .select('*')
            .eq('project_id', project_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        const summary = data?.length
            ? `Encontradas ${data.length} tasks para o projeto ${project_id}.`
            : `Nenhuma task encontrada para o projeto ${project_id}.`;

        return {
            content: [
                {
                    type: 'text',
                    text: `${summary}\n\n${JSON.stringify(data, null, 2)}`,
                },
            ],
        };
    } catch (error) {
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Erro ao listar tasks do projeto "${project_id}": ${error}`,
                },
            ],
        };
    }
}
