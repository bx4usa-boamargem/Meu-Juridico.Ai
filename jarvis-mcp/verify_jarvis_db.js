
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Erro: SUPABASE_URL ou SUPABASE_SERVICE_KEY não encontrados no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log(`Conectando a: ${supabaseUrl}`);

    const tables = ['jarvis_projects', 'jarvis_tasks', 'jarvis_logs'];
    const status = {};

    for (const table of tables) {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                status[table] = 'MISSING';
            } else {
                status[table] = `ERROR: ${error.message}`;
            }
        } else {
            status[table] = 'EXISTS';
        }
    }

    console.log('Status das tabelas:', JSON.stringify(status, null, 2));

    if (Object.values(status).includes('MISSING')) {
        console.log('Ação necessária: Aplicar migrations.');
    } else {
        console.log('Tabelas confirmadas.');
    }
}

checkTables();
