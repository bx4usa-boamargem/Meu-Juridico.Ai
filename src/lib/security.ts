export const WHITELIST_ACTIONS = [
    'security_scan',
    'lint_check',
    'run_tests',
    'ui_audit'
];

export function isActionAllowed(action: string): boolean {
    return WHITELIST_ACTIONS.includes(action);
}

export function getInitialStatus(action: string): 'pending' | 'approval_required' {
    return isActionAllowed(action) ? 'pending' : 'approval_required';
}
