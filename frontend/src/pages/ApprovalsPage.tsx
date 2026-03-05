import { useState } from 'react';
import { useApprovals } from '../hooks/useApprovals';
import { ApprovalCard } from '../components/approvals/ApprovalCard';
import { ApprovalModal } from '../components/approvals/ApprovalModal';
import { CheckSquare, Filter, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function ApprovalsPage() {
    const { documents, loading, reload } = useApprovals();
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark flex items-center">
                        <CheckSquare className="w-6 h-6 mr-3 text-brand-primary" />
                        Aprovações Pendentes
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Gerencie documentos que aguardam revisão final da sua área.
                    </p>
                </div>

                <div className="flex space-x-3">
                    <Button variant="secondary" onClick={reload} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button variant="ghost">
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                    </Button>
                </div>
            </div>

            {loading && documents.length === 0 ? (
                <div className="flex h-64 items-center justify-center bg-white border border-border-base rounded-lg shadow-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                </div>
            ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center bg-white border border-border-base rounded-lg shadow-sm p-16 text-center">
                    <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mb-6">
                        <CheckSquare className="w-8 h-8 text-brand-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-brand-dark mb-2">Caixa Limpa!</h2>
                    <p className="text-text-secondary max-w-md">
                        Nenhum documento aguardando aprovação no momento. Você está em dia.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {documents.map((doc) => (
                        <ApprovalCard
                            key={doc.id}
                            document={doc}
                            onActionClick={setSelectedDoc}
                        />
                    ))}
                </div>
            )}

            {selectedDoc && (
                <ApprovalModal
                    document={selectedDoc}
                    onClose={() => setSelectedDoc(null)}
                    onSuccess={reload}
                />
            )}
        </div>
    );
}
