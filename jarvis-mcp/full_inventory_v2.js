const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const SKILLS_DIR = '/Users/severinobione/.gemini/antigravity/skills';
const FUNCTIONS_DIR = '/Users/severinobione/Antigravity -meu-juridico-ai/antigravity-kit/Meu-Juridico.Ai/supabase/functions';
const PG_CONN = "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres";

async function run() {
  const client = new Client({ connectionString: PG_CONN });
  await client.connect();
  console.log('Iniciando Inventário Total Otimizado...');

  const { rows: skillCats } = await client.query("SELECT id, name FROM jarvis_skill_categories");
  const { rows: agentCats } = await client.query("SELECT id, name FROM jarvis_agent_categories");

  const catchAllSkillCat = skillCats.find(c => c.name === 'Technical Audit').id;
  const catchAllAgentCat = agentCats.find(c => c.name === 'Monitoring').id;
  const orchestratorCat = agentCats.find(c => c.name === 'Orchestrator').id;
  const constructionSkillCat = skillCats.find(c => c.name === 'Construction').id;

  // 1. Coletar Skills
  console.log('Coletando dados das Skills...');
  const skillDirs = fs.readdirSync(SKILLS_DIR);
  const skillData = [];
  for (const dirName of skillDirs) {
    const skillPath = path.join(SKILLS_DIR, dirName, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      const content = fs.readFileSync(skillPath, 'utf-8');
      const lines = content.split('\n');
      let name = dirName;
      let desc = '';
      for (const line of lines) {
        if (line.startsWith('name:')) name = line.replace('name:', '').trim().replace(/"/g, '');
        if (line.startsWith('description:')) desc = line.replace('description:', '').trim().replace(/"/g, '');
      }
      skillData.push([name, dirName, catchAllSkillCat, desc]);
    }
  }

  // Batch Insert Skills (100 por vez)
  console.log(`Inserindo ${skillData.length} skills em lotes...`);
  for (let i = 0; i < skillData.length; i += 100) {
    const batch = skillData.slice(i, i + 100);
    const placeholders = batch.map((_, idx) => `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`).join(', ');
    const values = batch.flat();
    await client.query(
      `INSERT INTO jarvis_skills (name, slug, category_id, description) VALUES ${placeholders} ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
      values
    );
    console.log(`Lote ${i / 100 + 1} concluído.`);
  }

  // 2. Agentes (Functions)
  console.log('Coletando Agentes...');
  const functionDirs = fs.readdirSync(FUNCTIONS_DIR);
  const agentData = [];
  for (const dirName of functionDirs) {
    const indexPath = path.join(FUNCTIONS_DIR, dirName, 'index.ts');
    if (fs.existsSync(indexPath)) {
      agentData.push([dirName, dirName, catchAllAgentCat, 'Supabase Edge Function', 'Agent remoto operando em Deno', 'remote']);
    }
  }

  if (agentData.length > 0) {
    const placeholders = agentData.map((_, idx) => `($${idx * 6 + 1}, $${idx * 6 + 2}, $${idx * 6 + 3}, $${idx * 6 + 4}, $${idx * 6 + 5}, $${idx * 6 + 6})`).join(', ');
    const values = agentData.flat();
    await client.query(
      `INSERT INTO jarvis_agents (name, slug, category_id, role, description, execution_mode) VALUES ${placeholders} ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
      values
    );
  }

  // 3. Orquestradores e Vínculos
  console.log('Finalizando Orquestradores...');
  await client.query(
    "INSERT INTO jarvis_agents (name, slug, category_id, role, description) VALUES ('Jarvis Core', 'jarvis-core', $1, 'Maestro Principal', 'Cérebro central'), ('Agent Builder', 'agent-builder', $1, 'Construtor de Elite', 'Cria novos agentes e skills') ON CONFLICT (slug) DO NOTHING",
    [orchestratorCat]
  );
  
  // Vincular Agent Builder a Skill Smith
  const { rows: skillId } = await client.query("SELECT id FROM jarvis_skills WHERE slug = '10-andruia-skill-smith'");
  const { rows: agentId } = await client.query("SELECT id FROM jarvis_agents WHERE slug = 'agent-builder'");
  
  if (skillId.length > 0 && agentId.length > 0) {
    await client.query("INSERT INTO jarvis_agent_skill_links (agent_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [agentId[0].id, skillId[0].id]);
    console.log('Agent Builder vinculado à skill Skill Smith.');
  }

  console.log('Ação Finalizada com Sucesso!');
  await client.end();
}

run().catch(console.error);
