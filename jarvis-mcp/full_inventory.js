const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const SKILLS_DIR = '/Users/severinobione/.gemini/antigravity/skills';
const FUNCTIONS_DIR = '/Users/severinobione/Antigravity -meu-juridico-ai/antigravity-kit/Meu-Juridico.Ai/supabase/functions';
const PG_CONN = "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres";

async function run() {
  const client = new Client({ connectionString: PG_CONN });
  await client.connect();
  console.log('Iniciando Inventário Total...');

  const { rows: skillCats } = await client.query("SELECT id, name FROM jarvis_skill_categories");
  const { rows: agentCats } = await client.query("SELECT id, name FROM jarvis_agent_categories");

  const catchAllSkillCat = skillCats.find(c => c.name === 'Technical Audit').id;
  const catchAllAgentCat = agentCats.find(c => c.name === 'Monitoring').id;
  const orchestratorCat = agentCats.find(c => c.name === 'Orchestrator').id;
  const constructionSkillCat = skillCats.find(c => c.name === 'Construction').id;

  // 1. Processar Skills
  console.log('Processando Skills...');
  const skillDirs = fs.readdirSync(SKILLS_DIR);
  let skillCount = 0;
  for (const dirName of skillDirs) {
    const skillPath = path.join(SKILLS_DIR, dirName, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      const content = fs.readFileSync(skillPath, 'utf-8');
      const lines = content.split('\n');
      let name = dirName;
      let desc = '';
      
      // Parsing simples de frontmatter
      for (const line of lines) {
        if (line.startsWith('name:')) name = line.replace('name:', '').trim().replace(/"/g, '');
        if (line.startsWith('description:')) desc = line.replace('description:', '').trim().replace(/"/g, '');
      }

      await client.query(
        "INSERT INTO jarvis_skills (name, slug, category_id, description, status) VALUES ($1, $2, $3, $4, 'active') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description",
        [name, dirName, catchAllSkillCat, desc]
      );
      skillCount++;
    }
  }

  // 2. Processar Agents (Supabase Functions)
  console.log('Processando Agentes (Functions)...');
  const functionDirs = fs.readdirSync(FUNCTIONS_DIR);
  let agentCount = 0;
  for (const dirName of functionDirs) {
    const indexPath = path.join(FUNCTIONS_DIR, dirName, 'index.ts');
    if (fs.existsSync(indexPath)) {
      await client.query(
        "INSERT INTO jarvis_agents (name, slug, category_id, role, description, execution_mode, status) VALUES ($1, $2, $3, 'Supabase Edge Function', 'Agent remoto operando em Deno', 'remote', 'active') ON CONFLICT (slug) DO UPDATE SET status = 'active'",
        [dirName, dirName, catchAllAgentCat]
      );
      agentCount++;
    }
  }

  // 3. Registrar Orquestradores Nível 1
  console.log('Registrando Orquestradores Nível 1...');
  const orchestrators = [
    { name: 'Jarvis Core', slug: 'jarvis-core', role: 'Maestro Principal', desc: 'Cérebro central do Jarvis OS' },
    { name: 'Agent Builder', slug: 'agent-builder', role: 'Construtor de Elite', desc: 'Capaz de criar novos agentes e skills' }
  ];

  for (const o of orchestrators) {
    await client.query(
      "INSERT INTO jarvis_agents (name, slug, category_id, role, description, status) VALUES ($1, $2, $3, $4, $5, 'active') ON CONFLICT (slug) DO NOTHING",
      [o.name, o.slug, orchestratorCat, o.role, o.desc]
    );
  }

  console.log(`Inventário Concluído: ${skillCount} skills e ${agentCount + orchestrators.length} agentes registrados.`);
  await client.end();
}

run().catch(console.error);
