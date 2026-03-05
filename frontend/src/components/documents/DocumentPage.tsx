import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Send, Layout, FileText, View } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { supabase } from '../../lib/supabase';
import { useDocumentSections } from '../../hooks/useDocumentSections';
import { SectionSidebar } from './SectionSidebar';
import { SectionEditor } from './SectionEditor';
import { DocumentPreview } from './DocumentPreview';
import { ExportDialog } from './ExportDialog';
import { DocumentRightSidebar } from './DocumentRightSidebar';
import { useProcessPipeline } from '../../hooks/useProcessPipeline';
import { useAuth } from '../../hooks/useAuth';
import { createNextDocument } from '../../services/documentCreationService';
import { transitionDocument } from '../../services/workflowService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function DocumentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Módulo 2 States
    const { sections, updateSectionContent } = useDocumentSections(id);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');

    // Módulo C State
    const [activeTool, setActiveTool] = useState('fontes');

    // Módulo 4 State
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const { session } = useAuth();
    const { nextStep, reload: reloadPipeline } = useProcessPipeline(document?.process_id);
    const [isGeneratingNext, setIsGeneratingNext] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const fetchDocument = async () => {
        if (!id) return;
        const { data: doc, error: docErr } = await supabase
            .from('documents')
            .select('*, processes(*), created_by_user:users!documents_created_by_fkey(full_name)')
            .eq('id', id)
            .single();

        if (docErr) {
            setError('Documento não encontrado no banco de dados real.');
            setLoading(false);
            return;
        }
        setDocument(doc);
        setLoading(false);
    };

    const handleGenerateNext = async () => {
        if (!nextStep || !document || !session?.user) return;

        setIsGeneratingNext(true);
        setActionError(null);
        try {
            const newId = await createNextDocument(
                document.process_id,
                nextStep.tipo,
                document.id,
                session.user.id,
                document.org_id
            );
            navigate(`/documentos/${newId}`);
        } catch (err: any) {
            setActionError(err.message || 'Erro ao gerar próxima etapa');
        } finally {
            setIsGeneratingNext(false);
        }
    };

    const handleSubmitForReview = async () => {
        if (!document) return;
        setIsSubmittingReview(true);
        setActionError(null);
        try {
            await transitionDocument(document.id, 'submit_for_review');
            await fetchDocument();
            if (reloadPipeline) await reloadPipeline();
        } catch (err: any) {
            setActionError(err.message || 'Erro ao submeter para revisão');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    useEffect(() => {
        fetchDocument();
    }, [id]);

    useEffect(() => {
        if (sections.length > 0 && !activeSectionId) {
            setActiveSectionId(sections[0].id);
        }
    }, [sections, activeSectionId]);

    const activeSection = sections.find(s => s.id === activeSectionId) || null;

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-gray-50 rounded-xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A56DB]"></div>
            </div>
        );
    }

    if (error || !document) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm text-red-500 p-8">
                <h2 className="font-bold text-xl mb-2">Erro</h2>
                <p>{error}</p>
                <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>Voltar</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] -m-4 sm:-m-8 animate-in fade-in duration-500 bg-white shadow-sm overflow-hidden">
            {/* Cabeçalho do Documento */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3 bg-white z-20 shadow-sm flex-shrink-0">
                <div className="flex items-center space-x-6">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-50 focus:outline-none">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-3 mb-0.5">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none">{document.title}</h1>
                            <Badge variant={document.status as any} className="text-[10px] px-2 py-0">{document.status}</Badge>
                        </div>
                        <div className="flex items-center text-[11px] text-gray-500 space-x-3">
                            <span>Processo: <strong className="text-gray-700">{document.process_number || 'S/N'}</strong></span>
                            <span>•</span>
                            <span>Criado por: <strong className="text-gray-700">{document.created_by_user?.full_name || 'Usuário'}</strong></span>
                            <span>•</span>
                            <span>Última mod: <strong className="text-gray-700">{new Date(document.updated_at).toLocaleString('pt-BR')}</strong></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {/* View Mode Toggles */}
                    <div className="hidden md:flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/60">
                        <button
                            onClick={() => setViewMode('editor')}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-semibold flex items-center transition-all", viewMode === 'editor' ? "bg-white text-[#1A56DB] shadow-sm" : "text-gray-500 hover:text-gray-900")}
                        >
                            <FileText className="w-3.5 h-3.5 mr-1.5" /> HTML
                        </button>
                        <button
                            onClick={() => setViewMode('split')}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-semibold flex items-center transition-all", viewMode === 'split' ? "bg-white text-[#1A56DB] shadow-sm" : "text-gray-500 hover:text-gray-900")}
                        >
                            <Layout className="w-3.5 h-3.5 mr-1.5" /> Split
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-semibold flex items-center transition-all", viewMode === 'preview' ? "bg-white text-[#1A56DB] shadow-sm" : "text-gray-500 hover:text-gray-900")}
                        >
                            <View className="w-3.5 h-3.5 mr-1.5" /> Final
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    <div className="flex space-x-2">
                        {nextStep && (
                            <Button
                                onClick={handleGenerateNext}
                                isLoading={isGeneratingNext}
                                className="bg-[#10B981] hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-all flex items-center shadow-sm"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Gerar {nextStep.tipo.toUpperCase()}
                            </Button>
                        )}
                        <button
                            onClick={() => setIsExportDialogOpen(true)}
                            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center shadow-sm"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Exportar PDF
                        </button>
                        <Button
                            onClick={handleSubmitForReview}
                            isLoading={isSubmittingReview}
                            className="bg-[#1A56DB] text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center shadow-sm hover:shadow"
                            disabled={document.status === 'em_revisao' || document.status === 'aprovado'}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {document.status === 'em_revisao' ? 'Em Revisão' : 'Submeter Avaliação'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Split View Container - Three Column Layout */}
            <div className="flex flex-1 overflow-hidden relative bg-gray-50/50">
                {actionError && (
                    <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-red-700 text-xs flex items-center justify-between">
                        <span>{actionError}</span>
                        <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600">×</button>
                    </div>
                )}

                {/* Left Sidebar (Seções) */}
                <SectionSidebar
                    sections={sections}
                    activeSectionId={activeSectionId}
                    onSelect={setActiveSectionId}
                />

                {/* 2. Área de Trabalho Central (Editor + Preview) */}
                <div className="flex-1 flex overflow-hidden shadow-inner border-r border-l border-gray-200 z-10 bg-white">
                    {(viewMode === 'editor' || viewMode === 'split') && (
                        <div className={cn("flex-1 h-full min-w-0 border-r border-gray-100", viewMode === 'split' && "max-w-[50%]")}>
                            <SectionEditor
                                documentId={document.id}
                                section={activeSection}
                                onUpdateContent={updateSectionContent}
                            />
                        </div>
                    )}

                    {(viewMode === 'preview' || viewMode === 'split') && (
                        <div className="flex-1 h-full min-w-0 bg-[#F9FAFB] shadow-inner">
                            <DocumentPreview section={activeSection} />
                        </div>
                    )}
                </div>

                {/* 3. Right Sidebar (Tools) */}
                <DocumentRightSidebar
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                />
            </div>

            {isExportDialogOpen && (
                <ExportDialog
                    documentId={document.id}
                    documentTitle={document.title}
                    onClose={() => setIsExportDialogOpen(false)}
                />
            )}
        </div>
    );
}
