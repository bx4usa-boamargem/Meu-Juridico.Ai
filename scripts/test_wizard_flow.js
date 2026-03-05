const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabasePath = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabasePath, supabaseKey, { auth: { persistSession: false } });
const supabaseAuth = createClient(supabasePath, supabaseAnonKey || supabaseKey, { auth: { persistSession: false } });

async function testWizardFlow() {
    try {
        console.log("=========================================");
        console.log(" INICIANDO TESTE DO MÓDULO 1 (WIZARD)");
        console.log("=========================================");

        let orgId, userId, depId;

        let { data: orgs } = await supabase.from('orgs').select('*').limit(1);
        if (orgs && orgs.length > 0) {
            orgId = orgs[0].id;
        } else {
            const { data: newOrg, error } = await supabase.from('orgs').insert({ name: 'Org Teste', slug: 'org_teste' }).select().single();
            if (error) throw error;
            orgId = newOrg.id;
        }

        // Garantir provider inserido (regra manual de LLM)
        await supabase.from('org_settings').upsert({
            org_id: orgId,
            llm_provider: 'openai'
        });

        let userEmail = 'dev_wizard@teste.com';
        let userPassword = 'password123';
        let { data: users } = await supabase.from('users').select('*').eq('org_id', orgId).limit(1);
        if (users && users.length > 0) {
            userId = users[0].id;
            // Garantir que a senha está setada
            const { data: authData } = await supabase.auth.admin.getUserById(userId);
            if (authData?.user) {
                userEmail = authData.user.email;
                await supabase.auth.admin.updateUserById(userId, { password: userPassword });
            }
        } else {
            const adminAuthRef = await supabase.auth.admin.createUser({ email: userEmail, password: userPassword, email_confirm: true });
            let actUserId = adminAuthRef?.data?.user?.id;
            if (!actUserId) {
                const list = await supabase.auth.admin.listUsers();
                actUserId = list.data.users[0].id;
            }
            const { data: newUser, error } = await supabase.from('users').insert({ id: actUserId, full_name: 'Dev Admin', role: 'visualizador', org_id: orgId }).select().single();
            if (error) throw error;
            userId = newUser.id;
        }

        // Login para obter JWT
        const { data: sessionData, error: loginErr } = await supabaseAuth.auth.signInWithPassword({ email: userEmail, password: userPassword });
        if (loginErr || !sessionData.session) throw new Error("Falha no login do mock user: " + loginErr?.message);
        const userJwt = sessionData.session.access_token;

        let { data: deps } = await supabase.from('departments').select('*').eq('org_id', orgId).limit(1);
        if (deps && deps.length > 0) {
            depId = deps[0].id;
        } else {
            const { data: newDep, error } = await supabase.from('departments').insert({ org_id: orgId, name: 'Tecnologia' }).select().single();
            if (error) throw error;
            depId = newDep.id;
        }

        const { data: tmps } = await supabase.from('document_templates').select('*').limit(1);
        const tmp = tmps && tmps.length > 0 ? tmps[0] : null;

        const fakeWizardData = {
            template_id: tmp.id,
            tipo_objeto: 'Serviço de Teste (Node)',
            department_id: depId,
            needs_description: 'Teste fluxo wizard',
            responsible_name: 'Dev',
            responsible_email: 'dev@dev.com',
            req_negocio: 'Requisito XYZ'
        };

        console.log("1. Inserindo em 'processes'...");
        const { data: processData, error: processErr } = await supabase
            .from('processes')
            .insert({
                org_id: orgId,
                status: 'rascunho',
                created_by: userId,
                department_id: fakeWizardData.department_id,
                objeto: fakeWizardData.needs_description,
                tipo_objeto: fakeWizardData.tipo_objeto,
                dados_base: fakeWizardData
            })
            .select().single();
        if (processErr) throw processErr;
        console.log(`[OK] Processo criado: ${processData.id}`);

        console.log("2. Inserindo em 'documents'...");
        const { data: docData, error: docErr } = await supabase
            .from('documents')
            .insert({
                process_id: processData.id,
                org_id: orgId,
                created_by: userId,
                doc_type: tmp.doc_type,
                title: `Documento - ${fakeWizardData.tipo_objeto}`,
                status: 'em_elaboracao'
            })
            .select().single();
        if (docErr) throw docErr;
        console.log(`[OK] Documento criado: ${docData.id}`);

        console.log("3. Inserindo em 'audit_logs'...");
        const { error: auditErr } = await supabase
            .from('audit_logs')
            .insert({
                org_id: orgId,
                user_id: userId,
                document_id: docData.id,
                action: 'document.generation_started',
                new_value: { template_id: fakeWizardData.template_id }
            });
        if (auditErr) throw auditErr;
        console.log(`[OK] Log de auditoria criado com sucesso.`);

        console.log("4. Chamando Edge Function 'orchestrate_document'...");
        const payloadStr = JSON.stringify({
            document_id: docData.id,
            process_id: processData.id,
            template_id: fakeWizardData.template_id,
            user_id: userId
        });

        const edgeRes = await fetch(`${supabasePath}/functions/v1/orchestrate_document`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userJwt}`
            },
            body: payloadStr
        });
        const edgeText = await edgeRes.text();

        console.log(`[OK] Edge Function invocada. Status HTTTP: ${edgeRes.status}`);
        console.log("Edge Output:", edgeText);

        if (edgeRes.status >= 400) {
            throw new Error(`Edge function falhou com HTTP ${edgeRes.status}`);
        }

        console.log("Fluxo Validado com Sucesso! [Sem Erros de Banco]");
    } catch (err) {
        console.error("ERRO NO TESTE:");
        console.error(err);
    }
}

testWizardFlow();
