import { useEffect, useState } from 'react';
import { getTransitionHistory } from '../../services/workflowService';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export function TransitionHistory({ documentId }: { documentId: string }) {
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        getTransitionHistory(documentId).then(data => setHistory(data || []));
    }, [documentId]);

    if (history.length === 0) return null;

    return (
        <div className="mt-6 border-t border-border-base pt-4">
            <h4 className="text-sm font-bold text-brand-dark mb-3">Histórico de Alterações</h4>
            <div className="space-y-3">
                {history.map((log) => (
                    <div key={log.id} className="flex gap-3 text-sm">
                        <div className="mt-0.5">
                            {log.to_status === 'approved' && <CheckCircle className="w-4 h-4 text-status-green" />}
                            {log.to_status === 'revision_requested' && <XCircle className="w-4 h-4 text-status-yellow" />}
                            {log.to_status !== 'approved' && log.to_status !== 'revision_requested' && <Clock className="w-4 h-4 text-text-muted" />}
                        </div>
                        <div>
                            <p className="text-text-primary">
                                <span className="font-semibold">{log.performed_by || 'Sistema'}</span> mudou status de <span className="font-medium text-text-muted">{log.from_status}</span> para <span className="font-medium text-brand-dark">{log.to_status}</span>
                            </p>
                            {log.comment && (
                                <p className="text-text-secondary mt-1 italic border-l-2 border-border-base pl-2">"{log.comment}"</p>
                            )}
                            <p className="text-xs text-text-muted mt-1">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
