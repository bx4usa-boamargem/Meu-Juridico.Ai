import { FileText, Clock } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ApprovalCardProps {
    document: any;
    onActionClick: (doc: any) => void;
}

export function ApprovalCard({ document, onActionClick }: ApprovalCardProps) {
    const process = document.processes;
    const reqName = process?.dados_base?.requester?.name || 'Desconhecido';
    const deptId = process?.dados_base?.requester?.departmentId || 'Geral';

    return (
        <div className="bg-white border text-left border-border-base rounded-lg p-5 hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="flex bg-brand-light p-2 rounded text-brand-primary">
                    <FileText className="w-5 h-5" />
                </div>
                <Badge variant="em-revisao">Aprovação Pendente</Badge>
            </div>

            <h3 className="font-bold text-brand-dark text-lg mb-1 truncate" title={document.title}>
                {document.title}
            </h3>

            <div className="text-sm text-text-secondary space-y-2 mt-3 flex-1">
                <p><strong className="text-text-primary">Requisitante:</strong> {reqName}</p>
                <p><strong className="text-text-primary">Departamento:</strong> {deptId}</p>
                <div className="flex items-center text-xs text-text-muted mt-2">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Criado em: {new Date(document.created_at).toLocaleDateString('pt-BR')}
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border-base flex justify-end">
                <Button variant="primary" onClick={() => onActionClick(document)}>
                    Revisar Documento
                </Button>
            </div>
        </div>
    );
}
