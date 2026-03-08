const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '/Users/severinobione/Antigravity -meu-juridico-ai/jarvis-mcp/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function registerAll() {
  const agentsDir = '/Users/severinobione/Antigravity -meu-juridico-ai/antigravity-kit/.agent/agents';
  const skillsDir = '/Users/severinobione/Antigravity -meu-juridico-ai/antigravity-kit/.agent/skills';

  const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
  const skillDirs = fs.readdirSync(skillsDir).filter(f => fs.lstatSync(path.join(skillsDir, f)).isDirectory());

  console.log(`Registrando ${agentFiles.length} agentes...`);
  for (const file of agentFiles) {
    const id = file.replace('.md', '');
    await supabase.from('jarvis_agents').upsert({
      id: id,
      name: id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      category: 'general',
      lifecycle: 'active',
      version: '1.0.0'
    });
  }

  console.log(`Registrando ${skillDirs.length} skills...`);
  for (const dir of skillDirs) {
    await supabase.from('jarvis_skills').upsert({
      id: dir,
      name: dir.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      category: 'general',
      lifecycle: 'active',
      version: '1.0.0'
    });
  }
}

registerAll().catch(console.error);
