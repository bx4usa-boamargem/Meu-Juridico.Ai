import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/Users/severinobione/Antigravity -meu-juridico-ai';

export interface ProjectState {
    project_name: string;
    current_state: string;
    source: string;
    active_task: string;
    git_status: string;
    recent_changes: string[];
    last_logs: string[];
}

export async function scanProjectState(projectName: string): Promise<ProjectState> {
    const projectPath = path.join(PROJECT_ROOT, projectName === 'MeuJuridico' ? 'antigravity-kit/Meu-Juridico.Ai' : '');

    // 1. Placeholder for State file (canonical)
    let state = "Plan-based status";
    let source = "Inferred";
    let activeTask = "N/A";

    // 2. Read task.md or implementation_plan.md
    const taskPath = path.join(PROJECT_ROOT, 'antigravity-kit/task.md'); // Adjust as needed
    if (fs.existsSync(taskPath)) {
        const content = fs.readFileSync(taskPath, 'utf-8');
        const match = content.match(/\[\/\]\s*(.*)/);
        if (match) {
            activeTask = match[1].trim();
            source = "task.md";
        }
    }

    // 3. Git Status
    let gitStatus = "Unknown";
    try {
        gitStatus = execSync('git status --short', { cwd: PROJECT_ROOT }).toString() || "Clean";
    } catch (e) {
        gitStatus = "Error reading git";
    }

    // 4. Recent Changes
    const recentChanges: string[] = [];
    try {
        const gitLog = execSync('git log -n 5 --pretty=format:"%s"', { cwd: PROJECT_ROOT }).toString();
        recentChanges.push(...gitLog.split('\n'));
    } catch (e) { }

    return {
        project_name: projectName,
        current_state: state,
        source,
        active_task: activeTask,
        git_status: gitStatus,
        recent_changes: recentChanges.slice(0, 3),
        last_logs: ["Local logs synchronized"]
    };
}
