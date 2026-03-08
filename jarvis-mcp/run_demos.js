const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '/Users/severinobione/Antigravity -meu-juridico-ai/jarvis-mcp/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function demos() {
  const tests = [
    { agent: 'tax-compliance-master', cmd: 'ISS para R$ 10k em SP', out: 'ISS (2%): R$ 200,00. Retenção obrigatória.', skill: 'tax-compliance-br' },
    { agent: 'finance-expert', cmd: 'Margem software B2B', out: 'Margem recomendada: 70-85% bruta, 20-30% líquida.', skill: 'none' },
    { agent: 'growth-strategist', cmd: 'Canais aquisição jurídica', out: '1. LinkedIn Ads, 2. SEO (Programmatic), 3. Parcerias com OAB.', skill: 'none' },
    { agent: 'market-intelligence', cmd: 'Competidores MeuJuridico', out: 'Principais: JusBrasil Pro, Advog Box, Legal One.', skill: 'none' }
  ];

  for (const t of tests) {
    console.log(`Executando Demo [${t.agent}]...`);
    await supabase.from('jarvis_logs').insert({
      agent_id: t.agent,
      event_type: 'DEMO_EXECUTION',
      message: `Comando: ${t.cmd} | Resposta: ${t.out}`,
      payload: { skill_used: t.skill }
    });
  }
}

demos().catch(console.error);
