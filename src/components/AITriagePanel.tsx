import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TriageResult {
  recommended_severity: "low" | "medium" | "high" | "critical";
  priority: "P1" | "P2" | "P3" | "P4";
  summary: string;
  immediate_actions: string[];
  resources_needed: string[];
  guest_advice: string;
}

interface AITriagePanelProps {
  type: string;
  severity: string;
  zone: string;
  room?: string | null;
  note?: string | null;
}

const sevClass: Record<TriageResult["recommended_severity"], string> = {
  low: "bg-info/10 text-info border-info/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-warning/15 text-warning border-warning/40",
  critical: "bg-emergency/10 text-emergency border-emergency/40",
};

const priClass: Record<TriageResult["priority"], string> = {
  P1: "bg-emergency text-emergency-foreground",
  P2: "bg-warning text-warning-foreground",
  P3: "bg-info text-info-foreground",
  P4: "bg-muted text-muted-foreground",
};

export function AITriagePanel({ type, severity, zone, room, note }: AITriagePanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("triage-incident", {
        body: { type, severity, zone, room, note },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.triage) throw new Error("No triage returned");
      setResult(data.triage as TriageResult);
    } catch (e: any) {
      const msg = e?.message || "Could not generate triage";
      setError(msg);
      toast.error("AI triage failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/30 shadow-card">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          AI triage assistant
        </CardTitle>
        <Button size="sm" onClick={run} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {result ? "Re-run" : "Generate"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && !error && !loading && (
          <p className="text-sm text-muted-foreground">
            Get an AI-recommended severity, priority, and immediate action plan based on this report.
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing incident…
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-2 rounded-md border border-emergency/30 bg-emergency/5 p-3 text-sm text-emergency">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={priClass[result.priority]}>{result.priority}</Badge>
              <Badge variant="outline" className={sevClass[result.recommended_severity]}>
                Recommended: {result.recommended_severity}
              </Badge>
            </div>

            <p className="text-sm">{result.summary}</p>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Immediate actions
              </p>
              <ul className="space-y-1.5">
                {result.immediate_actions.map((a, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            {result.resources_needed.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Resources to dispatch
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.resources_needed.map((r) => (
                    <Badge key={r} variant="secondary">{r}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Advice for the reporting guest
              </p>
              <p className="mt-1 text-sm">{result.guest_advice}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
