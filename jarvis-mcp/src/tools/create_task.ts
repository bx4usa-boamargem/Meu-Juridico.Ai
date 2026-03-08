import { supabase } from '../lib/supabase.js';

interface CreateTaskArgs {
    project_id: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assigned_agent?: string;
}

export async function createTask(args: CreateTaskArgs) {
    try {
        const { project_id, title, description, priority = 'medium', assigned_agent } = args;

        const { data, error } = await supabase
            .from('jarvis_tasks')
            .insert({
                project_id,
                title,
                description: description ?? null,
                priority,
                assigned_agent: assigned_agent ?? null,
                status: 'pending',
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return {
            content: [
                {
                    type: 'text',
                    text: `✅ Task criada com sucesso!\n\n${JSON.stringify(data, null, 2)}`,
                },
            ],
        };
    } catch (error) {
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Erro ao criar task: ${error}`,
                },
            ],
        };
    }
}
