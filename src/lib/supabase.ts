import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://opbnkyezpbaeoujgdwty.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'missing-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
