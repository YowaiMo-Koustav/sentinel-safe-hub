// AI incident triage — uses Lovable AI Gateway to suggest severity, priority,
// recommended response steps, and resource needs for a reported incident.
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, severity, zone, room, note } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Incident report:
- Type: ${type}
- Reporter severity: ${severity}
- Zone: ${zone}
- Room: ${room || "not specified"}
- Reporter note: ${note || "none"}

Provide a concise triage assessment for the response team.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You are an emergency operations dispatcher AI for a hotel/venue. Provide calm, structured, actionable triage. Be concise.",
            },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "triage_incident",
                description:
                  "Return a structured triage assessment for a reported incident.",
                parameters: {
                  type: "object",
                  properties: {
                    recommended_severity: {
                      type: "string",
                      enum: ["low", "medium", "high", "critical"],
                    },
                    priority: {
                      type: "string",
                      enum: ["P1", "P2", "P3", "P4"],
                      description:
                        "P1 = immediate dispatch, P4 = monitor only.",
                    },
                    summary: {
                      type: "string",
                      description: "One-sentence situation summary.",
                    },
                    immediate_actions: {
                      type: "array",
                      items: { type: "string" },
                      description: "Top 3-5 actions for the response team now.",
                    },
                    resources_needed: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "People/equipment to dispatch (e.g. 'Medic team', 'Fire suppression').",
                    },
                    guest_advice: {
                      type: "string",
                      description:
                        "What the reporting guest should do right now (1 sentence).",
                    },
                  },
                  required: [
                    "recommended_severity",
                    "priority",
                    "summary",
                    "immediate_actions",
                    "resources_needed",
                    "guest_advice",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "triage_incident" },
          },
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add credits in Lovable Cloud settings.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const text = await response.text();
      console.error("AI gateway error", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured triage returned");

    const triage = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ triage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("triage-incident error", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
