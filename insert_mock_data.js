import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/severinobione/Antigravity -meu-juridico-ai/query_db.js' }); // actually dotenv parses looking up, but let's just reuse the exact way query_db.js does it.
dotenv.config({ path: '/Users/severinobione/Antigravity -meu-juridico-ai/.env' });

const supabaseUrl = process.env.SUPABASE_URL || "https://opbnkyezpbaeoujgdwty.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!key) {
    console.error("Missing DB key.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, key);

async function run() {
    console.log("Verificando cadeias_documentais...");
    const { data: cadeias } = await supabase.from('cadeias_documentais').select('id, modalidade');
    console.log("Cadeias encontradas:", cadeias?.length);

    let cadeiaPregaoId, cadeiaDispensaId;

    if (!cadeias || cadeias.length === 0) {
        console.log("Inserindo Cadeias Documentais padrão...");
        const { data: newCadeias, error: errCad } = await supabase.from('cadeias_documentais').insert([
            { nome: "Pregão Eletrônico - Padrão", descricao: "Fluxo padrão para Pregão Eletrônico", modalidade: "Pregão Eletrônico", ativo: true },
            { nome: "Dispensa de Licitação - Bens", descricao: "Fluxo padrão para Dispensa de bens", modalidade: "Dispensa de Licitação", ativo: true },
            { nome: "Concorrência Pública", descricao: "Fluxo para obras e grandes serviços", modalidade: "Concorrência", ativo: true }
        ]).select();

        if (errCad) {
            console.error("Erro inserindo cadeias:", errCad);
            return;
        }
        console.log("Cadeias inseridas:", newCadeias.map(c => c.nome));
        cadeiaPregaoId = newCadeias.find(c => c.modalidade === "Pregão Eletrônico").id;
        cadeiaDispensaId = newCadeias.find(c => c.modalidade === "Dispensa de Licitação").id;
    } else {
        cadeiaPregaoId = cadeias.find(c => c.modalidade === "Pregão Eletrônico")?.id || cadeias[0].id;
        cadeiaDispensaId = cadeias.find(c => c.modalidade === "Dispensa de Licitação")?.id || cadeias[0].id;
    }

    console.log("Inserindo 10 processos falsos (Prefeituras de SP e Secretarias Estaduais)...");

    const orgaos = [
        "Prefeitura Municipal de São Paulo",
        "Prefeitura de Guarulhos",
        "Secretaria da Educação SP",
        "Prefeitura de Campinas",
        "Secretaria da Saúde SP",
        "Prefeitura de Santos",
        "Prefeitura de Ribeirão Preto",
        "Prefeitura de São Bernardo do Campo",
        "Prefeitura de Santo André",
        "Secretaria de Infraestrutura e Meio Ambiente SP"
    ];

    const objetos = [
        "Aquisição de notebooks para escolas municipais",
        "Serviços de limpeza e conservação predial",
        "Contratação de empresa para reforma de UBS",
        "Aquisição de mobiliário escolar",
        "Serviços de vigilância desarmada",
        "Fornecimento de merenda escolar",
        "Licenciamento de software de gestão ERP",
        "Aquisição de materiais de escritório gerais",
        "Obras de recapeamento asfáltico do centro",
        "Consultoria técnica para projeto de infraestrutura"
    ];

    for (let i = 0; i < 10; i++) {
        const modalidade = i % 2 === 0 ? "Pregão Eletrônico" : "Dispensa de Licitação";
        const cadeia_id = i % 2 === 0 ? cadeiaPregaoId : cadeiaDispensaId;
        // avoid identical numbers, append random 4 digits
        const num = `Processo ${i + 1}/${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;

        // Note: create_processo_com_documento_raiz RPC uses authentication context normally. 
        // Let's check how it's defined:
        // If it fails with "JWT required", we do manual inserts into `processos` and `documentos`.
        const { data: result, error: errRpc } = await supabase.rpc("create_processo_com_documento_raiz", {
            p_numero_processo: num,
            p_orgao: orgaos[i],
            p_objeto: objetos[i],
            p_modalidade: modalidade,
            p_cadeia_id: cadeia_id
        });

        if (errRpc) {
            console.log(`Erro no RPC no proc ${i}:`, errRpc.message);
            // fallback to normal insert
            console.log("Tentando insert direto...");
            const { data: pData, error: pErr } = await supabase.from('processos').insert({
                numero_processo: num,
                orgao: orgaos[i],
                objeto: objetos[i],
                modalidade: modalidade,
                status: "ativo"
            }).select().single();

            if (pData) {
                console.log("Processo salvo:", pData.id);
                await supabase.from('documentos').insert({
                    processo_id: pData.id,
                    tipo: "dfd",
                    status: "rascunho"
                });
                console.log("Documento raiz (DFD) salvo para:", pData.id);
            } else {
                console.error("Erro no insert fallback:", pErr);
            }
        } else {
            console.log("Processo gerado via RPC", i, "ID:", result);
        }
    }
}

run();
