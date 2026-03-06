import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://x.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('⚠️ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão configuradas. Usando mock url para evitar White Screen no Lovable.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
