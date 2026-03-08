import { supabase } from "../lib/supabase.js";

export async function getAgentsRegistry() {
    try {
        const { data, error } = await supabase
            .from('jarvis_agents')
            .select('*');

        if (error) throw error;

        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error fetching agents: ${error.message}` }],
            isError: true,
        };
    }
}
