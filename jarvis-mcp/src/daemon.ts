import { supabase } from './lib/supabase.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runDaemon() {
    console.log('Antigravity Daemon started. Polling for tasks...');

    while (true) {
        try {
            // 1. Fetch pending tasks
            const { data: task, error } = await supabase
                .from('jarvis_tasks')
                .select('*, jarvis_projects(path)')
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (task) {
                console.log(`Executing task: ${task.action} (${task.id})`);

                // 2. Mark as running
                await supabase.from('jarvis_tasks').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', task.id);
                await supabase.from('jarvis_logs').insert({ task_id: task.id, message: `Action ${task.action} started.` });

                try {
                    // 3. Command dispatcher (Simulated for MVP, triggers local python/bun scripts)
                    let command = '';
                    switch (task.action) {
                        case 'security_scan':
                            command = `echo "Running security scan in ${task.jarvis_projects.path}"`; // Simulação
                            break;
                        case 'lint_check':
                            command = `echo "Running lint check in ${task.jarvis_projects.path}"`;
                            break;
                        case 'run_tests':
                            command = `echo "Running unit tests in ${task.jarvis_projects.path}"`;
                            break;
                        case 'ui_audit':
                            command = `echo "Starting UI Design audit in ${task.jarvis_projects.path}"`;
                            break;
                        default:
                            throw new Error(`Action ${task.action} not recognized by daemon.`);
                    }

                    const { stdout, stderr } = await execAsync(command);

                    // 4. Log results
                    if (stdout) await supabase.from('jarvis_logs').insert({ task_id: task.id, message: stdout });
                    if (stderr) await supabase.from('jarvis_logs').insert({ task_id: task.id, message: stderr, level: 'warn' });

                    // 5. Mark as completed
                    await supabase.from('jarvis_tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', task.id);
                    await supabase.from('jarvis_logs').insert({ task_id: task.id, message: `Action ${task.action} completed successfully.` });

                } catch (execError: any) {
                    console.error(`Task failed: ${execError.message}`);
                    await supabase.from('jarvis_tasks').update({ status: 'failed', completed_at: new Date().toISOString() }).eq('id', task.id);
                    await supabase.from('jarvis_logs').insert({ task_id: task.id, message: `Error: ${execError.message}`, level: 'error' });
                }
            }

        } catch (pollError: any) {
            console.error('Polling error:', pollError.message);
        }

        // Wait 5 seconds before next poll
        await new Promise(r => setTimeout(r, 5000));
    }
}

runDaemon().catch(err => {
    console.error('Fatal Daemon error:', err);
    process.exit(1);
});
