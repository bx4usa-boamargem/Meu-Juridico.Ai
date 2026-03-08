import { supabase } from "../lib/supabase.js";

export async function createSkill(skillData: any) {
    try {
        const { data, error } = await supabase
            .from('jarvis_skills')
            .insert([skillData])
            .select();

        if (error) throw error;

        return {
            content: [{ type: "text", text: `Skill ${skillData.id} created successfully.` }],
        };
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error creating skill: ${error.message}` }],
            isError: true,
        };
    }
}
