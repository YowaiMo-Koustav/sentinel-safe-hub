import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, User, Clock, Radio, CheckCircle2, Loader2, Hand, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { useIncident } from "@/hooks/useIncidents";
import { useIncidentUpdates } from "@/hooks/useVenueData";
import {
  typeMeta, severityClass, statusClass, statusLabel, NEXT_STATUS,
  type IncidentStatus,
} from "@/lib/incidents";
import { StatusTimeline } from "@/components/incidents/StatusTimeline";
import { ZoneChip } from "@/components/incidents/ZoneChip";
import { VenueMap } from "@/components/maps/VenueMap";
import { zoneCoords } from "@/lib/venueGeo";
import { AITriagePanel } from "@/components/AITriagePanel";

type AdvanceStatus = Exclude<IncidentStatus, "new">;

const IncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, displayName, primaryRole } = useAuth();
  const { incident, loading } = useIncident(id);
  const { updates } = useIncidentUpdates(id);
  const [acting, setActing] = useState(false);
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);

  const postUpdate = async (message: string, newStatus: IncidentStatus | null) => {
    if (!incident || !user) return { error: null };
    const { error } = await supabase.from("incident_updates").insert({
      incident_id: incident.id,
      actor_id: user.id,
      actor_name: displayName || user.email || "Staff",
      actor_role: (primaryRole as any) ?? null,
      new_status: newStatus as any,
      message,
    });
    return { error };
  };

  const act = async (next: AdvanceStatus) => {
    if (!incident || !user) return;
    setActing(true);
    try {
      const patch: any = { status: next };
      if (next === "in_progress" && !incident.assigned_to) {
        patch.assigned_to = user.id;
        patch.assigned_name = displayName || user.email;
      }
      if (next === "resolved") patch.resolved_at = new Date().toISOString();

      const { error } = await supabase.from("incidents").update(patch).eq("id", incident.id);
      if (error) throw error;

      await postUpdate(`Status changed to ${statusLabel(next)}`, next);
      toast.success(`Marked ${statusLabel(next).toLowerCase()}`);
    } catch (error: any) {
      toast.error("Could not update", { description: error?.message || "Please try again." });
    }
    setActing(false);
  };

  const sendNote = async () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    setPosting(true);
    const { error } = (await postUpdate(trimmed, null)) ?? {};
    setPosting(false);
    if (error) toast.error("Could not post update", { description: error.message });
    else { setNote(""); toast.success("Update posted"); }
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
  const canPost = primaryRole && primaryRole !== "guest";

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
                <Field icon={MapPin} label="Location"><ZoneChip zone={incident.zone} room={incident.room} /></Field>
                <Field icon={User} label="Reporter" value={`${incident.reporter_name || "Anonymous"} (${incident.source})`} />
                <Field icon={Clock} label="Reported" value={new Date(incident.created_at).toLocaleString()} />
                <Field icon={Radio} label="Assigned to" value={incident.assigned_name || "Unassigned"} />
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-card">
              <CardHeader><CardTitle className="text-base">Incident location</CardTitle></CardHeader>
              <VenueMap
                height={260}
                fitBounds={false}
                zoom={18}
                center={zoneCoords(incident.zone)}
                markers={[{
                  id: incident.id,
                  position: zoneCoords(incident.zone),
                  tone: incident.severity === "critical" ? "emergency" : incident.severity === "high" ? "warning" : "info",
                  label: incident.zone,
                  pulse: incident.status === "new",
                }]}
                legend={false}
              />
            </Card>

            {canPost && (
              <AITriagePanel
                type={incident.type}
                severity={incident.severity}
                zone={incident.zone}
                room={incident.room}
                note={incident.note}
              />
            )}

            <Card className="shadow-card">
              <CardHeader className="flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Status timeline</CardTitle>
                <span className="text-xs text-muted-foreground">{updates.length + 1} events</span>
              </CardHeader>
              <CardContent>
                <StatusTimeline incident={incident} updates={updates} />

                {canPost && (
                  <div className="mt-6 space-y-2 border-t pt-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Post an update</p>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value.slice(0, 280))}
                      placeholder="Share what's happening on the ground…"
                      className="min-h-[60px]"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{note.length}/280</span>
                      <Button size="sm" onClick={sendNote} disabled={posting || !note.trim()}>
                        {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Post update
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {next && next !== "new" && canPost && (
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

function Field({ icon: Icon, label, value, children }: { icon: typeof MapPin; label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        {children ?? <p className="truncate text-sm font-medium">{value}</p>}
      </div>
    </div>
  );
}

export default IncidentDetail;
