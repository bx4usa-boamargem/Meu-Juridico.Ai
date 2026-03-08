import { supabase } from '../lib/supabase.js';
import { getInitialStatus } from '../lib/security.js';

export async function createAntigravityTask(project_id: string, action: string, params: any = {}) {
    try {
        const status = getInitialStatus(action);
        const requires_approval = status === 'approval_required';

        const { data, error } = await supabase
            .from('jarvis_tasks')
            .insert({
                project_id,
                action,
                params,
                status
            })
            .select('id')
            .single();

        if (error) throw error;

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        task_id: data.id,
                        status,
                        requires_approval,
                        message: requires_approval
                            ? "Action requires manual approval before execution."
                            : "Task queued for execution by Antigravity Daemon."
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: `Error creating task ${action} for ${project_id}: ${error}`
                }
            ]
        };
    }
}
