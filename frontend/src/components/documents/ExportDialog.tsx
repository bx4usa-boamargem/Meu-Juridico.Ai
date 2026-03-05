import { useState } from 'react';
import { Button } from '../ui/Button';
import { exportDocument } from '../../services/exportService';
import { XCircle, Download, FileText, Lock, ShieldCheck } from 'lucide-react';

interface ExportDialogProps {
    documentId: string;
    documentTitle: string;
    onClose: () => void;
}

export function ExportDialog({ documentId, documentTitle, onClose }: ExportDialogProps) {
    const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
    const [isExporting, setIsExporting] = useState(false);
    const [exportResult, setExportResult] = useState<{ url: string; hash: string; format: 'pdf' | 'docx' } | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const handleExport = async () => {
        setIsExporting(true);
        setErrorMsg('');
        try {
            const result = await exportDocument(documentId, format);
            setExportResult(result);
        } catch (error: any) {
            setErrorMsg(error.message || 'Falha ao processar exportação.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownload = () => {
        if (exportResult?.url) {
            window.open(exportResult.url, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-border-base">
                    <h2 className="text-lg font-bold text-brand-dark flex items-center">
                        <Download className="w-5 h-5 mr-2 text-brand-primary" />
                        Exportar Documento
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-brand-dark transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-text-secondary mb-4">
                        Documento: <strong className="text-brand-dark">{documentTitle}</strong>
                    </p>

                    {errorMsg && (
                        <div className="p-3 bg-status-red/10 border border-status-red/20 text-status-red text-sm rounded-md mb-4">
                            {errorMsg}
                        </div>
                    )}

                    {!exportResult ? (
                        <>
                            <label className="block text-sm font-semibold text-brand-dark mb-3">
                                Selecione o Formato
                            </label>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div
                                    onClick={() => setFormat('pdf')}
                                    className={`border p-4 flex flex-col items-center justify-center cursor-pointer rounded-lg transition-colors ${format === 'pdf' ? 'border-brand-primary bg-brand-light/30' : 'border-border-base hover:bg-gray-50'}`}
                                >
                                    <FileText className={`w-8 h-8 mb-2 ${format === 'pdf' ? 'text-brand-primary' : 'text-text-muted'}`} />
                                    <span className={`font-semibold ${format === 'pdf' ? 'text-brand-dark' : 'text-text-secondary'}`}>PDF</span>
                                    <span className="text-xs text-text-muted mt-1 text-center">Formato imutável assinado</span>
                                </div>
                                <div
                                    onClick={() => setFormat('docx')}
                                    className={`border p-4 flex flex-col items-center justify-center cursor-pointer rounded-lg transition-colors ${format === 'docx' ? 'border-brand-primary bg-brand-light/30' : 'border-border-base hover:bg-gray-50'}`}
                                >
                                    <FileText className={`w-8 h-8 mb-2 ${format === 'docx' ? 'text-brand-primary' : 'text-text-muted'}`} />
                                    <span className={`font-semibold ${format === 'docx' ? 'text-brand-dark' : 'text-text-secondary'}`}>DOCX</span>
                                    <span className="text-xs text-text-muted mt-1 text-center">Para Word e editores</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-gray-50 border border-border-base rounded-lg p-5 mb-4 animate-in slide-in-from-bottom-2">
                            <div className="flex items-center text-status-green mb-3">
                                <ShieldCheck className="w-5 h-5 mr-2" />
                                <span className="font-bold">Gerado com Sucesso</span>
                            </div>

                            <div className="bg-white p-3 border border-border-base rounded flex items-start mt-2">
                                <Lock className="w-4 h-4 text-brand-primary mr-2 mt-0.5 flex-shrink-0" />
                                <div className="break-all w-full min-w-0">
                                    <span className="block text-xs font-bold text-text-muted uppercase mb-1">Hash de Integridade (SHA-256)</span>
                                    <code className="text-xs text-brand-dark font-mono bg-gray-100 p-1 rounded block">{exportResult.hash}</code>
                                </div>
                            </div>
                            <p className="text-xs text-text-muted mt-3 text-center">
                                Este hash garante que o arquivo não foi adulterado.
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-border-base bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                    <Button variant="ghost" onClick={onClose} disabled={isExporting}>
                        {exportResult ? 'Fechar' : 'Cancelar'}
                    </Button>

                    {!exportResult ? (
                        <Button
                            variant="primary"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? 'Processando Autoria...' : 'Gerar Arquivo'}
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            className="bg-status-green hover:bg-status-green/90 border-status-green"
                            onClick={handleDownload}
                        >
                            Baixar {exportResult.format.toUpperCase()}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
