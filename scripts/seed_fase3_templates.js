import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as vars
dotenv.config({ path: '../.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://uiqdpbegaowiowkwiyzr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY não definida. Verifique seu .env');
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function runSeed() {
    console.log('Iniciando Seed de Templates - Módulo A (Fase 3)...');

    // --- DFD ---
    console.log('1. Inserindo Template DFD...');
    const dfdPlan = [
        { section_id: 'dfd_01', section_number: '1', title: 'Informações Gerais', agent: 'document-structure-engine', required: true, section_type: 'form', tab_category: 'negocio', depends_on: [] },
        { section_id: 'dfd_02', section_number: '2', title: 'Descrição Sucinta do Objeto', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['dfd_01'] },
        { section_id: 'dfd_03', section_number: '3', title: 'Grau de Prioridade', agent: 'document-structure-engine', required: true, section_type: 'form', tab_category: 'negocio', depends_on: ['dfd_01'] },
        { section_id: 'dfd_04', section_number: '4', title: 'Justificativa da Necessidade da Contratação', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'juridico', depends_on: ['dfd_02'] },
        { section_id: 'dfd_05', section_number: '5', title: 'Estimativa de Quantidades e Valores', agent: 'technical-expansion-engine', required: false, section_type: 'generated', tab_category: 'negocio', depends_on: ['dfd_04'] },
        { section_id: 'dfd_06', section_number: '6', title: 'Identificação da Área Requisitante e Responsáveis', agent: 'document-structure-engine', required: true, section_type: 'form', tab_category: 'negocio', depends_on: [] },
        { section_id: 'dfd_07', section_number: '7', title: 'Despacho', agent: 'legal-argumentation-engine', required: true, section_type: 'generated', tab_category: 'juridico', depends_on: ['dfd_04'] }
    ];

    let { data: existingDfd } = await supabaseAdmin.from('document_templates').select('id').eq('doc_type', 'DFD').single();
    if (existingDfd) {
        const res = await supabaseAdmin.from('document_templates').update({
            name: 'Documento de Formalização da Demanda (DFD)',
            description: 'Fundamenta o plano de contratações anual. A área requisitante evidencia e detalha a necessidade de contratação conforme Lei 14.133/2021.',
            is_default: true,
            sections_plan: dfdPlan
        }).eq('id', existingDfd.id);
        if (res.error) console.error('ERRO DFD UPDATE:', res.error);
        else console.log('DFD Atualizado com Sucesso.');
    } else {
        const res = await supabaseAdmin.from('document_templates').insert({
            name: 'Documento de Formalização da Demanda (DFD)',
            doc_type: 'DFD',
            description: 'Fundamenta o plano de contratações anual. A área requisitante evidencia e detalha a necessidade de contratação conforme Lei 14.133/2021.',
            is_default: true,
            sections_plan: dfdPlan
        });
        if (res.error) console.error('ERRO DFD INSERT:', res.error);
        else console.log('DFD Inserido com Sucesso.');
    }


    // --- ETP ---
    console.log('2. Inserindo Template ETP...');
    const etpPlan = [
        { section_id: 'etp_01', section_number: '1', title: 'Introdução', agent: 'document-structure-engine', required: true, section_type: 'static', tab_category: 'negocio', depends_on: [] },
        { section_id: 'etp_02', section_number: '2', title: 'Informações Básicas', agent: 'document-structure-engine', required: true, section_type: 'form', tab_category: 'negocio', depends_on: [] },
        { section_id: 'etp_03', section_number: '3', title: 'Descrição da Necessidade / Justificativa', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['etp_02'] },
        { section_id: 'etp_04', section_number: '4', title: 'Equipe de Planejamento', agent: 'document-structure-engine', required: true, section_type: 'form', tab_category: 'negocio', depends_on: [] },
        { section_id: 'etp_05', section_number: '5', title: 'Necessidades de Negócio', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['etp_03'] },
        { section_id: 'etp_06', section_number: '6', title: 'Necessidades Tecnológicas', agent: 'technical-expansion-engine', required: false, section_type: 'generated', tab_category: 'tecnologico', depends_on: ['etp_05'] },
        { section_id: 'etp_07', section_number: '7', title: 'Requisitos Legais', agent: 'normative-compliance-engine', required: true, section_type: 'generated', tab_category: 'legal', depends_on: ['etp_02'] },
        { section_id: 'etp_08', section_number: '8', title: 'Requisitos Gerais', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['etp_05'] },
        { section_id: 'etp_09', section_number: '9', title: 'Requisitos Temporais', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['etp_02'] },
        { section_id: 'etp_10', section_number: '10', title: 'Requisitos de Segurança', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'seguranca', depends_on: ['etp_02'] },
        { section_id: 'etp_11', section_number: '11', title: 'Requisitos Sociais, Ambientais e Culturais', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'social', depends_on: ['etp_02'] },
        { section_id: 'etp_12', section_number: '12', title: 'Requisitos de Projeto e Implementação', agent: 'technical-expansion-engine', required: false, section_type: 'generated', tab_category: 'projeto', depends_on: ['etp_05'] },
        { section_id: 'etp_13', section_number: '13', title: 'Requisitos de Garantia Técnica', agent: 'technical-expansion-engine', required: false, section_type: 'generated', tab_category: 'garantia', depends_on: ['etp_05'] },
        { section_id: 'etp_14', section_number: '14', title: 'Requisitos de Experiência', agent: 'technical-expansion-engine', required: false, section_type: 'generated', tab_category: 'experiencia', depends_on: ['etp_05'] },
        { section_id: 'etp_15', section_number: '15', title: 'Estimativa da Demanda — Quantidades', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['etp_05'] },
        { section_id: 'etp_16', section_number: '16', title: 'Levantamento de Mercado', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['etp_15'] },
        { section_id: 'etp_17', section_number: '17', title: 'Análise Comparativa das Soluções', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['etp_16'] },
        { section_id: 'etp_18', section_number: '18', title: 'Solução Escolhida e Justificativa', agent: 'legal-argumentation-engine', required: true, section_type: 'generated', tab_category: 'juridico', depends_on: ['etp_17'] },
        { section_id: 'etp_19', section_number: '19', title: 'Justificativa para Adoção do SRP', agent: 'legal-argumentation-engine', required: false, section_type: 'generated', tab_category: 'juridico', depends_on: ['etp_03'] },
        { section_id: 'etp_20', section_number: '20', title: 'Estimativa de Custos', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['etp_15'] },
        { section_id: 'etp_21', section_number: '21', title: 'Declaração de Viabilidade', agent: 'validation-gap-engine', required: true, section_type: 'generated', tab_category: 'juridico', depends_on: ['etp_20'] }
    ];

    let { data: existingEtp } = await supabaseAdmin.from('document_templates').select('id').eq('doc_type', 'ETP').single();
    if (existingEtp) {
        const res = await supabaseAdmin.from('document_templates').update({
            name: 'Estudo Técnico Preliminar (ETP)',
            description: 'Primeira etapa do planejamento de contratação. Caracteriza o interesse público e sua melhor solução. Base para o Termo de Referência conforme Lei 14.133/2021.',
            is_default: true,
            sections_plan: etpPlan
        }).eq('id', existingEtp.id);
        if (res.error) console.error('ERRO ETP UPDATE:', res.error);
        else console.log('ETP Atualizado com Sucesso.');
    } else {
        const res = await supabaseAdmin.from('document_templates').insert({
            name: 'Estudo Técnico Preliminar (ETP)',
            doc_type: 'ETP',
            description: 'Primeira etapa do planejamento de contratação. Caracteriza o interesse público e sua melhor solução. Base para o Termo de Referência conforme Lei 14.133/2021.',
            is_default: true,
            sections_plan: etpPlan
        });
        if (res.error) console.error('ERRO ETP INSERT:', res.error);
        else console.log('ETP Inserido com Sucesso.');
    }

    // --- TR ---
    console.log('3. Inserindo Template TR...');
    const trPlan = [
        { section_id: 'tr_01', section_number: '1', title: 'Condições Gerais da Contratação', agent: 'document-structure-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: [] },
        { section_id: 'tr_02', section_number: '2', title: 'Quadro de Itens', agent: 'document-structure-engine', required: true, section_type: 'form', tab_category: 'negocio', depends_on: ['tr_01'] },
        { section_id: 'tr_03', section_number: '3', title: 'Alinhamento com PCA e PNCP', agent: 'normative-compliance-engine', required: true, section_type: 'generated', tab_category: 'legal', depends_on: ['tr_01'] },
        { section_id: 'tr_04', section_number: '4', title: 'Da Participação em Consórcio', agent: 'legal-argumentation-engine', required: true, section_type: 'generated', tab_category: 'juridico', depends_on: ['tr_01'] },
        { section_id: 'tr_05', section_number: '5', title: 'Da Subcontratação', agent: 'legal-argumentation-engine', required: true, section_type: 'generated', tab_category: 'juridico', depends_on: ['tr_01'] },
        { section_id: 'tr_06', section_number: '6', title: 'Justificativa para Não Parcelamento', agent: 'legal-argumentation-engine', required: true, section_type: 'generated', tab_category: 'juridico', depends_on: ['tr_01'] },
        { section_id: 'tr_07', section_number: '7', title: 'Fundamentação e Descrição da Necessidade', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['tr_01'] },
        { section_id: 'tr_08', section_number: '8', title: 'Dos Benefícios a Serem Alcançados', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['tr_07'] },
        { section_id: 'tr_09', section_number: '9', title: 'Justificativa para Adoção do SRP', agent: 'legal-argumentation-engine', required: false, section_type: 'generated', tab_category: 'juridico', depends_on: ['tr_01'] },
        { section_id: 'tr_10', section_number: '10', title: 'Descrição da Solução — Ciclo de Vida', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['tr_07'] },
        { section_id: 'tr_11', section_number: '11', title: 'Requisitos Gerais', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['tr_01'] },
        { section_id: 'tr_12', section_number: '12', title: 'Requisitos Legais', agent: 'normative-compliance-engine', required: true, section_type: 'generated', tab_category: 'legal', depends_on: ['tr_01'] },
        { section_id: 'tr_13', section_number: '13', title: 'Requisitos Temporais', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['tr_01'] },
        { section_id: 'tr_14', section_number: '14', title: 'Requisitos de Segurança e Privacidade', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'seguranca', depends_on: ['tr_01'] },
        { section_id: 'tr_15', section_number: '15', title: 'Requisitos Sociais, Ambientais e Culturais', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'social', depends_on: ['tr_01'] },
        { section_id: 'tr_16', section_number: '16', title: 'Requisitos de Garantia Técnica', agent: 'technical-expansion-engine', required: false, section_type: 'generated', tab_category: 'garantia', depends_on: ['tr_01'] },
        { section_id: 'tr_17', section_number: '17', title: 'Modelo de Execução do Objeto', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['tr_10'] },
        { section_id: 'tr_18', section_number: '18', title: 'Modelo de Gestão do Contrato', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['tr_17'] },
        { section_id: 'tr_19', section_number: '19', title: 'Critérios de Medição e Pagamento', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['tr_18'] },
        { section_id: 'tr_20', section_number: '20', title: 'Sanções Administrativas', agent: 'legal-argumentation-engine', required: true, section_type: 'generated', tab_category: 'juridico', depends_on: ['tr_01'] },
        { section_id: 'tr_21', section_number: '21', title: 'Estimativa de Preços e Pesquisa de Mercado', agent: 'technical-expansion-engine', required: true, section_type: 'generated', tab_category: 'negocio', depends_on: ['tr_02'] },
        { section_id: 'tr_22', section_number: '22', title: 'Adequação Orçamentária', agent: 'document-structure-engine', required: true, section_type: 'form', tab_category: 'negocio', depends_on: ['tr_21'] }
    ];

    let { data: existingTr } = await supabaseAdmin.from('document_templates').select('id').eq('doc_type', 'TR').single();
    if (existingTr) {
        const res = await supabaseAdmin.from('document_templates').update({
            name: 'Termo de Referência (TR)',
            description: 'Define as condições para contratação de bens e serviços. Elaborado após conclusão do ETP conforme Lei 14.133/2021.',
            is_default: true,
            sections_plan: trPlan
        }).eq('id', existingTr.id);
        if (res.error) console.error('ERRO TR UPDATE:', res.error);
        else console.log('TR Atualizado com Sucesso.');
    } else {
        const res = await supabaseAdmin.from('document_templates').insert({
            name: 'Termo de Referência (TR)',
            doc_type: 'TR',
            description: 'Define as condições para contratação de bens e serviços. Elaborado após conclusão do ETP conforme Lei 14.133/2021.',
            is_default: true,
            sections_plan: trPlan
        });
        if (res.error) console.error('ERRO TR INSERT:', res.error);
        else console.log('TR Inserido com Sucesso.');
    }

    console.log('============= SEED CONCLUIDO =============');
}

runSeed();
