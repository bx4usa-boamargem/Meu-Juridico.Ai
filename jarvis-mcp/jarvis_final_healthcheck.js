const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: Credenciais do Supabase ausentes no .env.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("=== JARVIS OS - HEALTHCHECK FINAL ===\n");

    // 1. Verificação Local (Arquivos e MCP)
    console.log("1. Verificando Integração Local:");
    const agentsDir = path.resolve(__dirname, '../antigravity-kit/.agent/agents');
    const skillsDir = path.resolve(__dirname, '../antigravity-kit/.agent/skills');

    let localAgentsCount = 0;
    let localSkillsCount = 0;

    try {
        localAgentsCount = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md')).length;
        console.log(`   [OK] ${localAgentsCount} Agentes locais encontrados na pasta.`);
    } catch (e) {
        console.log(`   [ERRO] Falha ao ler pasta de agentes: ${e.message}`);
    }

    try {
        localSkillsCount = fs.readdirSync(skillsDir).filter(f => fs.lstatSync(path.join(skillsDir, f)).isDirectory()).length;
        console.log(`   [OK] ${localSkillsCount} Skills locais encontradas na pasta.`);
    } catch (e) {
        console.log(`   [ERRO] Falha ao ler pasta de skills: ${e.message}`);
    }

    const mcpConfigPath = '/Users/severinobione/Library/Application Support/ChatGPT/mcp_config.json';
    if (fs.existsSync(mcpConfigPath)) {
        console.log(`   [OK] Configuração do MCP Server encontrada em ${mcpConfigPath}`);
    } else {
        console.log(`   [AVISO] Configuração do MCP Server não encontrada no local padrão do ChatGPT.`);
    }

    console.log("\n2. Verificando Integração Online (Supabase):");

    try {
        const { data: projData, error: projErr } = await supabase.from('jarvis_projects').select('id, name, status');
        if (projErr) throw projErr;
        console.log(`   [OK] Tabela 'jarvis_projects' acessível. (${projData.length} projetos registrados)`);
    } catch (e) {
        console.log(`   [ERRO] Tabela 'jarvis_projects': ${e.message}`);
    }

    try {
        const { data: agentsData, error: agentsErr } = await supabase.from('jarvis_agents').select('id, lifecycle');
        if (agentsErr) throw agentsErr;
        const active = agentsData.filter(a => a.lifecycle === 'active').length;
        console.log(`   [OK] Tabela 'jarvis_agents' acessível. Total: ${agentsData.length} (Ativos: ${active})`);
    } catch (e) {
        console.log(`   [ERRO] Tabela 'jarvis_agents': ${e.message}`);
    }

    try {
        const { data: skillsData, error: skillsErr } = await supabase.from('jarvis_skills').select('id, lifecycle');
        if (skillsErr) throw skillsErr;
        const active = skillsData.filter(s => s.lifecycle === 'active').length;
        console.log(`   [OK] Tabela 'jarvis_skills' acessível. Total: ${skillsData.length} (Ativos: ${active})`);
    } catch (e) {
        console.log(`   [ERRO] Tabela 'jarvis_skills': ${e.message}`);
    }

    try {
        const { count: rulesCount, error: rulesErr } = await supabase.from('jarvis_router_rules').select('*', { count: 'exact', head: true });
        if (rulesErr) throw rulesErr;
        console.log(`   [OK] Tabela 'jarvis_router_rules' acessível. Regras configuradas: ${rulesCount}`);
    } catch (e) {
        console.log(`   [ERRO] Tabela 'jarvis_router_rules': ${e.message}`);
    }

    console.log("\n=== CONCLUSÃO ===");
    console.log("Se todas as verificações acima possuem [OK], o sistema está 100% operacional.");
}

check();
