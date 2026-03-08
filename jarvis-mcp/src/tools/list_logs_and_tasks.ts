import { supabase } from '../lib/supabase.js';

export async function listLogsAndTasks(project_id: string, limit: number = 5) {
    try {
        const { data: tasks, error: tasksError } = await supabase
            .from('jarvis_tasks')
            .select('*')
            .eq('project_id', project_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (tasksError) throw tasksError;

        const taskIds = tasks.map(t => t.id);
        const { data: logs, error: logsError } = await supabase
            .from('jarvis_logs')
            .select('*')
            .in('task_id', taskIds)
            .order('created_at', { ascending: false })
            .limit(limit * 2);

        if (logsError) throw logsError;

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ tasks, logs }, null, 2)
                }
            ]
        };
    } catch (error) {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: `Error listing logs/tasks for ${project_id}: ${error}`
                }
            ]
        };
    }
}
