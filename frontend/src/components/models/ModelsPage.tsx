import { useState, useMemo } from 'react';
import { Search, FileText } from 'lucide-react';
import { useTemplates } from '../../hooks/useTemplates';
import { useNavigate } from 'react-router-dom';
import { Tabs } from '../ui/Tabs';

export function ModelsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todos');

    const { templates, loading } = useTemplates('Todos', '');

    const categories = useMemo(() => {
        const cats = new Set(templates.map(t => t.category).filter(Boolean));
        return ['Todos', ...Array.from(cats)];
    }, [templates]);

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            const matchesCategory = activeCategory === 'Todos' || t.category === activeCategory;
            const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [templates, activeCategory, searchTerm]);

    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
            <div className="flex flex-col space-y-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">Modelos de documentos</h1>
                    <p className="text-gray-500 mt-2">Navegue por nossa biblioteca de modelos oficiais e inicie a confecção estruturada de documentos governamentais.</p>
                </div>

                <div className="w-full max-w-xl pt-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Pesquise pelo documento..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Tabs
                        tabs={categories.map(c => ({ id: c, label: c }))}
                        activeTab={activeCategory}
                        onChange={setActiveCategory}
                        variant="pill"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-500 text-sm">Recuperando modelos oficiais do acervo...</div>
            ) : filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTemplates.map(t => (
                        <div
                            key={t.id}
                            onClick={() => navigate('/criar')}
                            className="flex flex-col h-[220px] bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-[#1A56DB]/30 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1A56DB]/10 text-[#1A56DB]">
                                    {t.category || 'Geral'}
                                </span>
                            </div>
                            <h3 className="font-bold text-[17px] text-gray-900 mb-2 group-hover:text-[#1A56DB] transition-colors line-clamp-2 leading-snug">{t.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{t.description}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200 mt-4">
                    <FileText className="h-16 w-16 text-gray-300 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum modelo encontrado</h2>
                    <p className="text-gray-500 text-center max-w-md text-sm">Não encontramos documentos que correspondam aos filtros selecionados no acervo atual.</p>
                </div>
            )}
        </div>
    );
}
