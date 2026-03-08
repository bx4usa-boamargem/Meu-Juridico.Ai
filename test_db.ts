import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))
const { data, error } = await supabase.from('cadeias_documentais').select('mapeamento_campos')
console.log(JSON.stringify(data, null, 2))
