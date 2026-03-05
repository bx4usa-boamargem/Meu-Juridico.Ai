import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '../.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://uiqdpbegaowiowkwiyzr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    const email = 'bionicaosilva@gmail.com';
    // Generate a strong random password (approx 16 chars)
    const newPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '') + 'A1!';

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const user = authUsers?.users?.find(u => u.email === email);

    if (user) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
        if (error) {
            console.error('Erro ao atualizar senha:', error);
            return;
        }
        // Salva a credencial num arquivo local restrito para que o Dev possa copiar sem trafegar no LLM
        fs.writeFileSync('.admin_test_credentials.txt', `Email: ${email}\nPassword: ${newPassword}\n`, { mode: 0o600 });

        console.log(`Senha atualizada com sucesso. Salva em .admin_test_credentials.txt. Últimos 4 caracteres: ${newPassword.slice(-4)}`);
    } else {
        console.log('Usuário nicht encontrado');
    }
}
run();
