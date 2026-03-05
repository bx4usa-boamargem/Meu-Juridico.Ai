import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' }); // Fetch from root if executed in scripts/

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://uiqdpbegaowiowkwiyzr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY não definida (necessária para auth admin). Verifique seu .env');
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    console.log('Iniciando script de criação de Test Admin...');

    const email = 'bionicaosilva@gmail.com';
    const orgName = 'BX4 Technology Solutions';
    const uasgCode = '999999';
    const expertName = 'Amanda Sampaio';
    const expertRole = 'Consultora Jurídica';

    // 1. Criar Organização (Tenant) -> Tabela real é 'orgs'
    console.log(`Verificando/Criando Organização: ${orgName}`);
    let { data: org, error: orgErr } = await supabaseAdmin
        .from('orgs')
        .select('*')
        .eq('name', orgName)
        .single();

    if (!org) {
        const { data: newOrg, error: newOrgErr } = await supabaseAdmin
            .from('orgs')
            .insert({ name: orgName, slug: 'bx4-technology-solutions' })
            .select()
            .single();

        if (newOrgErr) {
            console.error('Erro ao criar organização:', newOrgErr);
            process.exit(1);
        }
        org = newOrg;
        console.log('Organização criada com sucesso.');
    } else {
        console.log('Organização já existe.');
    }

    // 1.1 Inserir Org Settings (Banner Amanda)
    console.log('Atualizando org_settings com Especialista...');
    let { error: settingsError } = await supabaseAdmin.from('org_settings').upsert({
        org_id: org.id,
        expert_name: expertName,
        expert_role: expertRole
    }, { onConflict: 'org_id' });

    if (settingsError) {
        console.log('A tabela org_settings pode não existir ainda. Erro ignorado:', settingsError.message);
    } else {
        console.log('Org settings atualizado.');
    }

    // 1.2 Inserir Processo Seed (UASG)
    console.log(`Criando um processo Seed para a UASG ${uasgCode}...`);
    const { data: processData, error: processErr } = await supabaseAdmin
        .from('processes')
        .insert({
            org_id: org.id,
            uasg_code: uasgCode,
            tipo_objeto: 'Serviços Comuns',
            status: 'draft',
            dados_base: { notes: 'Seed via Test Admin script' }
        })
        .select()
        .single();

    if (processErr) {
        console.log('Aviso ao criar processo (pode já existir ou falhou):', processErr.message);
    }

    // 2. Criar ou Recuperar Usuário Auth (Bionicão)
    console.log(`Verificando usuário Auth (email: ${email})...`);
    const { data: authUsers, error: listUserErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listUserErr) {
        console.error('Erro ao listar auth users:', listUserErr);
        process.exit(1);
    }

    let userRecord = authUsers.users.find(u => u.email === email);

    if (!userRecord) {
        console.log('Usuário não encontrado. Criando novo usuário Auth...');
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: 'Password123!', // Senha genérica de teste
            email_confirm: true,
            user_metadata: { full_name: 'Bionicão Silva Admin' }
        });
        if (authErr) {
            console.error('Erro ao criar usuário Auth:', authErr);
            process.exit(1);
        }
        userRecord = authData.user;
        console.log('Usuário Auth criado:', userRecord.id);
    } else {
        console.log('Usuário Auth já existe:', userRecord.id);
    }

    // 3. Atualizar profile na tabela users (para garantir nome e role)
    console.log('Atualizando profile público na tabela `users`...');
    const { error: usersErr } = await supabaseAdmin.from('users').upsert({
        id: userRecord.id,
        email: email,
        full_name: 'Bionicão Silva Admin',
        org_id: org.id,
        role: 'admin'
    });

    if (usersErr) {
        console.error('Erro ao atualizar usuário em `users`:', usersErr);
    }

    console.log('============= REGISTRO CONCLUIDO =============');
    console.log('EMAIL:', email);
    console.log('PASS:', 'Password123!');
    console.log('ORG:', orgName);
    console.log('UASG:', uasgCode);
}

run();
