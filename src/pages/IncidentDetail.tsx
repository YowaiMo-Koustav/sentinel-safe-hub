import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, User, Clock, Radio, CheckCircle2, Loader2, Hand } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { useIncident } from "@/hooks/useIncidents";
import {
  typeMeta, severityClass, statusClass, statusLabel, relativeTime, NEXT_STATUS,
  type IncidentEventRow, type IncidentStatus,
} from "@/lib/incidents";
import type { TablesUpdate } from "@/integrations/supabase/types";

type AdvanceStatus = Exclude<IncidentStatus, "new">;

const IncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, displayName } = useAuth();
  const { incident, loading } = useIncident(id);
  const [events, setEvents] = useState<IncidentEventRow[]>([]);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("incident_events").select("*").eq("incident_id", id).order("created_at", { ascending: true })
      .then(({ data }) => setEvents((data ?? []) as IncidentEventRow[]));

    const ch = supabase.channel(`events-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "incident_events", filter: `incident_id=eq.${id}` },
        (p) => setEvents((curr) => [...curr, p.new as IncidentEventRow]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const act = async (next: AdvanceStatus) => {
    if (!incident || !user) return;
    setActing(true);
    const patch: TablesUpdate<"incidents"> = { status: next };
    if (next === "in_progress") {
      patch.assigned_to = user.id;
      patch.assigned_name = displayName || user.email?.split("@")[0] || "Responder";
    }
    if (next === "resolved") patch.resolved_at = new Date().toISOString();

    const { error } = await supabase.from("incidents").update(patch).eq("id", incident.id);
    if (!error) {
      await supabase.from("incident_events").insert({
        incident_id: incident.id,
        actor_id: user.id,
        actor_name: displayName || user.email?.split("@")[0] || "Responder",
        event_type: `status:${next}`,
        message: `Status changed to ${statusLabel(next)}`,
      });
      toast.success(`Marked ${statusLabel(next).toLowerCase()}`);
    } else {
      toast.error("Could not update", { description: error.message });
    }
    setActing(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!incident) {
    return (
      <div className="p-12 text-center">
        <p className="text-lg font-semibold">Incident not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
      </div>
    );
  }

  const meta = typeMeta(incident.type);
  const next = NEXT_STATUS[incident.status];
  const shortId = incident.id.slice(0, 8).toUpperCase();

  return (
    <div>
      <PageHeader
        eyebrow={`Incident · #${shortId}`}
        title={`${meta.label} response`}
        description={incident.note || "No additional notes from the reporter."}
        actions={
          <>
            <Badge className={severityClass(incident.severity)} variant="outline">{incident.severity}</Badge>
            <Badge className={statusClass(incident.status)}>{statusLabel(incident.status)}</Badge>
          </>
        }
      />

      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Field icon={MapPin} label="Location" value={`${incident.zone}${incident.room ? ` · ${incident.room}` : ""}`} />
                <Field icon={User} label="Reporter" value={`${incident.reporter_name || "Anonymous"} (${incident.source})`} />
                <Field icon={Clock} label="Reported" value={relativeTime(incident.created_at)} />
                <Field icon={Radio} label="Assigned to" value={incident.assigned_name || "Unassigned"} />
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
              <CardContent>
                <ol className="relative space-y-4 border-l-2 border-border pl-5">
                  <TimelineItem time={relativeTime(incident.created_at)} title="Incident reported" subtitle={`by ${incident.reporter_name || "Anonymous"}`} />
                  {events.map((e) => (
                    <TimelineItem key={e.id} time={relativeTime(e.created_at)} title={e.message || e.event_type} subtitle={e.actor_name ? `by ${e.actor_name}` : undefined} />
                  ))}
                  {incident.resolved_at && (
                    <TimelineItem time={relativeTime(incident.resolved_at)} title="Resolved" tone="success" />
                  )}
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {next && next !== "new" && (
                  <Button className="w-full" disabled={acting} onClick={() => act(next as AdvanceStatus)}>
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : next === "in_progress" ? <Hand className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {next === "acknowledged" && "Acknowledge"}
                    {next === "in_progress" && "Take ownership"}
                    {next === "resolved" && "Mark resolved"}
                  </Button>
                )}
                <Button className="w-full" variant="outline" onClick={() => navigate("/evacuation")}>
                  Show route to scene
                </Button>
                {!next && (
                  <p className="rounded-md bg-success/10 px-3 py-2 text-center text-xs font-medium text-success">
                    Incident resolved
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-emergency/30 bg-emergency/5 shadow-card">
              <CardContent className="p-4 text-sm">
                <p className="font-semibold text-emergency">Escalation policy</p>
                <p className="mt-1 text-muted-foreground">If unacknowledged for 60s, alerts escalate to duty manager and external emergency services.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};


function Field({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({ time, title, subtitle, tone }: { time: string; title: string; subtitle?: string; tone?: "success" }) {
  return (
    <li className="relative">
      <span className={`absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-background ${tone === "success" ? "bg-success" : "bg-primary"}`} />
      <p className="text-xs font-medium text-muted-foreground">{time}</p>
      <p className="text-sm">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </li>
  );
}

export default IncidentDetail;
