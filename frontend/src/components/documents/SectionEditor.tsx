import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Wand2, CheckCircle, AlertTriangle, Loader2, Save } from 'lucide-react';
import { aiImproveSection, aiValidateSection } from '../../services/aiService';

interface SectionEditorProps {
    documentId: string;
    section: any;
    onUpdateContent: (id: string, content: string) => Promise<void>;
}

export function SectionEditor({ documentId, section, onUpdateContent }: SectionEditorProps) {
    const [localContent, setLocalContent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [actionMsg, setActionMsg] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Sync local state when section changes
    useEffect(() => {
        setLocalContent(section?.content || '');
    }, [section]);

    if (!section) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white p-8">
                <p className="text-text-muted">Selecione uma seção à esquerda para editar.</p>
            </div>
        );
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdateContent(section.id, localContent);
            setActionMsg('Salvo com sucesso!');
            setTimeout(() => setActionMsg(''), 3000);
        } catch (error) {
            setActionMsg('Erro ao salvar.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAIAction = async (action: 'improve' | 'validate') => {
        setIsProcessing(true);
        setActionMsg(action === 'improve' ? 'Melhorando seção com IA...' : 'Validando seção com IA...');
        try {
            // First save current draft to DB so Edge Function sees the latest
            await onUpdateContent(section.id, localContent);

            if (action === 'improve') {
                await aiImproveSection(documentId, section.id);
                // Note: Realtime subscription in useDocumentSections will update the content automatically 
                // once the Edge Function updates the DB.
            } else {
                await aiValidateSection(documentId, section.id);
            }
            setActionMsg('Operação concluída. Aguardando sync...');
        } catch (error: any) {
            setActionMsg(`Erro: ${error.message}`);
        } finally {
            setIsProcessing(false);
            setTimeout(() => setActionMsg(''), 4000);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border-base bg-main flex-shrink-0">
                <div className="flex flex-col">
                    <h2 className="font-bold text-lg text-brand-dark">{section.title}</h2>
                    {section.has_warnings && (
                        <div className="flex items-center text-status-yellow text-sm mt-1">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Atenção requerida nesta seção
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        
                        onClick={handleSave}
                        disabled={isSaving || localContent === section.content}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar
                    </Button>

                    <Button
                        variant="secondary"
                        
                        onClick={() => handleAIAction('improve')}
                        disabled={isProcessing}
                    >
                        <Wand2 className="w-4 h-4 mr-2 text-brand-primary" />
                        Melhorar Seção
                    </Button>

                    <Button
                        variant="primary"
                        
                        onClick={() => handleAIAction('validate')}
                        disabled={isProcessing}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Validar Seção
                    </Button>
                </div>
            </div>

            {/* Area do actionMsg */}
            {actionMsg && (
                <div className={`px-4 py-2 text-sm text-center font-medium ${actionMsg.includes('Erro') ? 'bg-status-red/10 text-status-red' : 'bg-status-green/10 text-status-green'}`}>
                    {actionMsg}
                </div>
            )}

            <div className="flex-1 p-0 overflow-hidden flex flex-col">
                <textarea
                    value={localContent}
                    onChange={(e) => setLocalContent(e.target.value)}
                    className="flex-1 w-full h-full p-6 text-text-primary text-base leading-relaxed bg-white border-0 resize-none focus:ring-0 focus:outline-none"
                    placeholder="Conteúdo da seção..."
                />
            </div>
        </div>
    );
}
