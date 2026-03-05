import { useState } from 'react';
import { Button } from '../ui/Button';
import { transitionDocument } from '../../services/workflowService';
import { CheckCircle, XCircle, Search } from 'lucide-react';
import { TransitionHistory } from './TransitionHistory';

interface ApprovalModalProps {
    document: any;
    onClose: () => void;
    onSuccess: () => void;
}

export function ApprovalModal({ document, onClose, onSuccess }: ApprovalModalProps) {
    const [actionMsg, setActionMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [comment, setComment] = useState('');
    const [mode, setMode] = useState<'view' | 'reject'>('view');

    if (!document) return null;

    const handleAction = async (action: 'approve' | 'reject') => {
        if (action === 'reject' && !comment.trim()) {
            setActionMsg('Erro: Comentário é obrigatório para solicitar ajustes.');
            return;
        }

        setIsSubmitting(true);
        setActionMsg('Processando...');

        try {
            await transitionDocument(document.id, action, comment);
            setActionMsg(action === 'approve' ? 'Documento Aprovado!' : 'Ajustes Solicitados!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (error: any) {
            setActionMsg(`Erro: ${error.message}`);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">

                <div className="flex items-center justify-between p-6 border-b border-border-base">
                    <div>
                        <h2 className="text-xl font-bold text-brand-dark">Revisão de Documento</h2>
                        <p className="text-sm text-text-secondary mt-1">{document.title}</p>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-brand-dark transition-colors">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">

                    {actionMsg && (
                        <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${actionMsg.includes('Erro') ? 'bg-status-red/10 text-status-red border border-status-red/20' : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'}`}>
                            {actionMsg}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Dados Base */}
                        <div className="bg-gray-50 border border-border-base rounded-lg p-4">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Contexto</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-text-secondary mb-1">Requisitante</p>
                                    <p className="font-medium text-brand-dark">{document.processes?.dados_base?.requester?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-text-secondary mb-1">Departamento</p>
                                    <p className="font-medium text-brand-dark">{document.processes?.dados_base?.requester?.departmentId || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-text-secondary mb-1">Justificativa</p>
                                    <p className="font-medium text-brand-dark line-clamp-2">{document.processes?.dados_base?.needs?.justification || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Preview Rapido ou Link */}
                        <div className="flex items-center justify-between p-4 border border-border-base rounded-lg">
                            <div className="flex items-center">
                                <Search className="w-5 h-5 text-brand-primary mr-3" />
                                <div>
                                    <h4 className="font-bold text-brand-dark text-sm">Conteúdo do Documento</h4>
                                    <p className="text-xs text-text-muted">Acesse a página completa para ler todas as seções.</p>
                                </div>
                            </div>
                            <Button variant="secondary" onClick={() => window.open(`/documentos/${document.id}`, '_blank')}>
                                Abrir Documento Completo
                            </Button>
                        </div>

                        {/* Rejeição Form */}
                        {mode === 'reject' && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-bold text-brand-dark mb-2">Comentário (Obrigatório)</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full h-24 p-3 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                                    placeholder="Descreva o que precisa ser ajustado..."
                                />
                            </div>
                        )}

                        <TransitionHistory documentId={document.id} />
                    </div>
                </div>

                <div className="p-6 border-t border-border-base bg-gray-50 flex justify-end space-x-3 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>

                    {mode === 'view' ? (
                        <>
                            <Button
                                variant="secondary"
                                className="border-status-red text-status-red hover:bg-status-red/10"
                                onClick={() => setMode('reject')}
                                disabled={isSubmitting}
                            >
                                Solicitar Ajuste
                            </Button>
                            <Button
                                variant="primary"
                                className="bg-status-green hover:bg-status-green/90 border-status-green"
                                onClick={() => handleAction('approve')}
                                disabled={isSubmitting}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Aprovar Documento
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="primary"
                            className="bg-status-red hover:bg-status-red/90 border-status-red"
                            onClick={() => handleAction('reject')}
                            disabled={isSubmitting}
                        >
                            Confirmar Devolução
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
