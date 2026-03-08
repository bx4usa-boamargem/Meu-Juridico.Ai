import { supabase } from "../lib/supabase.js";

export async function createAgent(agentData: any) {
    try {
        const { data, error } = await supabase
            .from('jarvis_agents')
            .insert([agentData])
            .select();

        if (error) throw error;

        return {
            content: [{ type: "text", text: `Agent ${agentData.id} created successfully in draft mode.` }],
        };
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error creating agent: ${error.message}` }],
            isError: true,
        };
    }
}
