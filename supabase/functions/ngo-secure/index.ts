import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token, action, payload } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate token
    const { data: tokenId, error: tokenError } = await supabase.rpc("validate_ngo_token", { p_token: token });
    if (tokenError || !tokenId) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update last_used_at (minimal metadata)
    await supabase.from("ngo_access_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", tokenId);

    let result: any = null;

    switch (action) {
      case "get_medication_requests": {
        const { data } = await supabase
          .from("medication_requests")
          .select("id, medication_name, urgency, status, created_at, notes")
          .order("created_at", { ascending: false })
          .limit(100);
        result = data;
        break;
      }
      case "get_sos_alerts": {
        const { data } = await supabase
          .from("sos_alerts")
          .select("id, message, status, created_at")
          .order("created_at", { ascending: false })
          .limit(100);
        result = data;
        break;
      }
      case "get_shelters": {
        const { data } = await supabase
          .from("shelters")
          .select("id, name, address, capacity, available_spots, is_operational")
          .order("name");
        result = data;
        break;
      }
      case "update_shelter": {
        const { id, capacity, available_spots, is_operational } = payload;
        const { error } = await supabase
          .from("shelters")
          .update({ capacity, available_spots, is_operational })
          .eq("id", id);
        result = { success: !error };
        break;
      }
      case "update_sos_status": {
        const { id, status } = payload;
        const update: any = { status };
        if (status === "resolved") update.resolved_at = new Date().toISOString();
        const { error } = await supabase.from("sos_alerts").update(update).eq("id", id);
        result = { success: !error };
        break;
      }
      case "update_med_status": {
        const { id, status } = payload;
        const { error } = await supabase.from("medication_requests").update({ status }).eq("id", id);
        result = { success: !error };
        break;
      }
      case "get_notes": {
        const { data } = await supabase
          .from("coordination_notes")
          .select("id, content, created_at")
          .order("created_at", { ascending: false })
          .limit(50);
        result = data;
        break;
      }
      case "add_note": {
        const { content } = payload;
        const { data, error } = await supabase
          .from("coordination_notes")
          .insert({ content, author_token_id: tokenId })
          .select("id, content, created_at")
          .single();
        result = error ? null : data;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
