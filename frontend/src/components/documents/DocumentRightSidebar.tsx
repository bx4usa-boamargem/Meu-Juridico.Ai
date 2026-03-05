import { Database, Sparkles, MessageSquare, ShieldCheck, History } from 'lucide-react';

interface DocumentRightSidebarProps {
    activeTool: string;
    setActiveTool: (tool: string) => void;
}

export function DocumentRightSidebar({ activeTool, setActiveTool }: DocumentRightSidebarProps) {
    const tools = [
        { id: 'fontes', icon: Database, label: 'Fontes em Tempo Real' },
        { id: 'sugestao', icon: Sparkles, label: 'Sugestão IA' },
        { id: 'chat', icon: MessageSquare, label: 'Chat Assistente' },
        { id: 'regras', icon: ShieldCheck, label: 'Validador de Regras' },
        { id: 'historico', icon: History, label: 'Histórico e Versões' },
    ];

    return (
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full flex-shrink-0">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex space-x-2 overflow-x-auto no-scrollbar">
                {tools.map(tool => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`p-2 rounded-lg flex-shrink-0 transition-colors ${isActive ? 'bg-[#1A56DB] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'}`}
                            title={tool.label}
                        >
                            <Icon className="h-5 w-5" />
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                {activeTool === 'fontes' && (
                    <div className="flex flex-col space-y-4 animate-in fade-in">
                        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2">Fontes Conectadas</h3>

                        <div className="bg-white border text-left border-gray-200 rounded-lg p-3 shadow-sm">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-xs font-bold text-gray-700">Lei 14.133/2021</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">Art. 18. A fase preparatória do processo licitatório é caracterizada pelo planejamento...</p>
                        </div>

                        <div className="bg-white border text-left border-gray-200 rounded-lg p-3 shadow-sm">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-xs font-bold text-gray-700">IN 05/2017</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">Dispõe sobre as regras e diretrizes do procedimento de contratação de serviços...</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-4 flex items-start space-x-3">
                            <Database className="h-4 w-4 text-[#1A56DB] mt-0.5" />
                            <p className="text-xs text-blue-800">A IA está utilizando estas bases normativas para gerar e validar as seções atuais do seu documento.</p>
                        </div>
                    </div>
                )}

                {activeTool === 'sugestao' && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                        <Sparkles className="h-8 w-8 text-gray-400" />
                        <p className="text-sm text-gray-500">Sugestões contextuais aparecerão aqui enquanto você edita.</p>
                    </div>
                )}

                {activeTool === 'chat' && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                        <p className="text-sm text-gray-500">Converse com a IA sobre esta seção do documento.</p>
                    </div>
                )}

                {activeTool === 'regras' && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                        <ShieldCheck className="h-8 w-8 text-gray-400" />
                        <p className="text-sm text-gray-500">Nenhuma violação de regra detectada nesta seção.</p>
                    </div>
                )}

                {activeTool === 'historico' && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                        <History className="h-8 w-8 text-gray-400" />
                        <p className="text-sm text-gray-500">Histórico de versões salvo automaticamente.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
