import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Metadata for rendering standard doc types visually since 'document_templates' now only holds sections
const TEMPLATE_METADATA: Record<string, any> = {
    'dfd': { name: 'Documento de Formalização de Demanda', description: 'Gera DFD com base na solicitação', category: 'planejamento' },
    'etp': { name: 'Estudo Técnico Preliminar', description: 'Realize o levantamento prévio de necessidades, riscos e viabilidade', category: 'planejamento' },
    'tr': { name: 'Termo de Referência', description: 'Defina os parâmetros técnicos, de execução e de gestão do contrato', category: 'licitação' },
    'projeto_basico': { name: 'Projeto Básico', description: 'Projeto básico para serviços de engenharia e obras', category: 'engenharia' },
    'mapa_risco': { name: 'Mapa de Riscos', description: 'Identifique e avalie os riscos do processo de contratação', category: 'planejamento' },
    'edital': { name: 'Edital de Licitação', description: 'Bases para disputa e condições de habilitação', category: 'licitação' },
    'custom': { name: 'Documento Personalizado', description: 'Crie um documento a partir de seções customizadas', category: 'outros' }
};

export function useTemplates(category?: string, search?: string) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true);

            // Gets all doc_types currently registered in the database sections
            const { data, error } = await supabase
                .from('document_templates')
                .select('doc_type');

            if (!error && data) {
                // Get unique doc_types (e.g. 'etp', 'tr', 'dfd')
                const uniqueTypes = Array.from(new Set(data.map((d: any) => d.doc_type)));

                let result = uniqueTypes.map(type => {
                    // Safe lowercase standard
                    const safeType = typeof type === 'string' ? type.toLowerCase() : String(type);
                    const meta = TEMPLATE_METADATA[safeType] || {
                        name: safeType.toUpperCase(),
                        description: `Template padrão para ${safeType}`,
                        category: 'geral'
                    };

                    return {
                        id: safeType, // template_id no Frontend agora será simplesmente a string doc_type ex: 'etp'
                        doc_type: safeType,
                        name: meta.name,
                        description: meta.description,
                        category: meta.category
                    };
                });

                if (category && category !== 'Todos') {
                    result = result.filter(r => r.category.toLowerCase() === category.toLowerCase());
                }

                if (search) {
                    const s = search.toLowerCase();
                    result = result.filter(r =>
                        r.name.toLowerCase().includes(s) ||
                        r.description.toLowerCase().includes(s)
                    );
                }

                setTemplates(result);
            }
            setLoading(false);
        };

        fetchTemplates();
    }, [category, search]);

    return { templates, loading };
}
