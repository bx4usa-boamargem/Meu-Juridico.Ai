import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!URL || !KEY) {
    console.log("Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes");
    process.exit(1);
}

const supabase = createClient(URL, KEY);

async function seed() {
    console.log("Iniciando Seed de Documentos...");

    const DFD_ID = '11111111-1111-1111-1111-111111111111';
    const ETP_ID = '22222222-2222-2222-2222-222222222222';
    const TR_ID = '33333333-3333-3333-3333-333333333333';

    try {
        const r1 = await supabase.from('document_templates').upsert([
            { id: DFD_ID, name: 'Documento de Formalização da Demanda (DFD)', doc_type: 'DFD', description: 'Fundamenta o plano de contratações anual.', is_active: true, created_at: new Date().toISOString() },
            { id: ETP_ID, name: 'Estudo Técnico Preliminar (ETP)', doc_type: 'ETP', description: 'Primeira etapa do planejamento de contratação.', is_active: true, created_at: new Date().toISOString() },
            { id: TR_ID, name: 'Termo de Referência (TR)', doc_type: 'TR', description: 'Define as condições para contratação.', is_active: true, created_at: new Date().toISOString() }
        ]);
        console.log("1. Templates inseridos", r1.error || 'OK');

        const sections = [
            { template_id: DFD_ID, section_number: '1', title: 'Informações Gerais', agent: 'document-structure-engine', required: true, section_type: 'form', tab_category: 'negocio' },
            { template_id: DFD_ID, section_number: '2', title: 'Descrição Sucinta do Objeto', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: '1' },
            { template_id: ETP_ID, section_number: '1', title: 'Introdução', agent: 'document-structure-engine', required: true, section_type: 'static', tab_category: 'negocio' },
            { template_id: ETP_ID, section_number: '3', title: 'Descrição da Necessidade', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: '2' },
            { template_id: TR_ID, section_number: '1', title: 'Condições Gerais', agent: 'document-structure-engine', required: true, section_type: 'generated', tab_category: 'negocio' },
            { template_id: TR_ID, section_number: '2', title: 'Quadro de Itens', agent: 'document-structure-engine', required: true, section_type: 'form', tab_category: 'negocio', depends_on: '1' }
        ];

        const r2 = await supabase.from('document_sections').upsert(sections, { onConflict: 'template_id, section_number' });
        console.log("2. Algumas Seções Inseridas", r2.error || 'OK');

    } catch (err) {
        console.error("Erro fatal no seed:", err);
    }
}

seed();
