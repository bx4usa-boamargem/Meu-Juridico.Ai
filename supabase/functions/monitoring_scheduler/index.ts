import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Check if any config has next_run_at <= now and is_active
    const { data: configs, error } = await supabase
      .from("monitoring_config")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_at", new Date().toISOString());

    if (error) throw error;

    if (!configs || configs.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhuma execução agendada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trigger monitoring_agent
    const { data, error: invokeError } = await supabase.functions.invoke(
      "monitoring_agent"
    );

    if (invokeError) throw invokeError;

    return new Response(
      JSON.stringify({ success: true, agent_response: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Scheduler error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
