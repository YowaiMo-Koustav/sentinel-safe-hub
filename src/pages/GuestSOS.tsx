import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Siren, MapPin, Phone, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { StatusChip } from "@/components/StatusChip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { useIncidents } from "@/hooks/useIncidents";
import { useZones } from "@/hooks/useVenueData";
import {
  INCIDENT_TYPES, ZONES, typeMeta, severityClass, statusClass, statusLabel, relativeTime,
  type IncidentType,
} from "@/lib/incidents";

type Stage = "select-type" | "details" | "submitting" | "sent";

const GuestSOS = () => {
  const navigate = useNavigate();
  const { user, displayName } = useAuth();
  const { incidents } = useIncidents({ ownOnly: true, userId: user?.id, enabled: !!user });

  const [stage, setStage] = useState<Stage>("select-type");
  const [type, setType] = useState<IncidentType | null>(null);
  const [zone, setZone] = useState<string>(ZONES[1]);
  const [room, setRoom] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  const recent = useMemo(() => incidents.slice(0, 5), [incidents]);
  const justSubmitted = createdId ? incidents.find((i) => i.id === createdId) ?? null : null;

  const reset = () => {
    setStage("select-type");
    setType(null);
    setRoom("");
    setNote("");
    setCreatedId(null);
  };

  const submit = async () => {
    if (!user || !type) return;
    setStage("submitting");
    const meta = typeMeta(type);
    const { data, error } = await supabase.from("incidents").insert({
      type,
      severity: meta.defaultSeverity,
      status: "new",
      zone,
      room: room.trim() || null,
      note: note.trim() || null,
      source: "guest",
      reporter_id: user.id,
      reporter_name: displayName || user.email?.split("@")[0] || "Guest",
    }).select("id").single();

    if (error) {
      toast.error("Could not send SOS", { description: error.message });
      setStage("details");
      return;
    }
    setCreatedId(data.id);
    setStage("sent");
    toast.success("Help is on the way", { description: "Responders have been notified." });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Guest"
        title="Emergency SOS"
        description="Tell us what's happening — we'll dispatch the closest responder."
        actions={<StatusChip label={zone} tone="info" />}
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        {stage === "select-type" && (
          <Card className="overflow-hidden border-2 border-emergency/20 shadow-elegant">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-emergency text-emergency-foreground shadow-emergency animate-pulse-emergency">
                  <Siren className="h-10 w-10" strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">What's happening?</h2>
                  <p className="text-sm text-muted-foreground">Pick the closest match. You can add detail next.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {INCIDENT_TYPES.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => { setType(k.id); setStage("details"); }}
                    className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-base hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full ${k.tone}`}>
                      <k.icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium leading-tight">{k.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Location shared</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Front desk reachable</span>
              </div>
            </CardContent>
          </Card>
        )}

        {(stage === "details" || stage === "submitting") && type && (
          <Card className="border-2 border-emergency/20 shadow-elegant">
            <CardHeader className="pb-3">
              <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={reset} disabled={stage === "submitting"}>
                <ArrowLeft className="h-4 w-4" /> Change type
              </Button>
              <div className="flex items-center gap-3 pt-1">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${typeMeta(type).tone}`}>
                  {(() => { const Icon = typeMeta(type).icon; return <Icon className="h-6 w-6" />; })()}
                </span>
                <div>
                  <CardTitle className="text-xl">{typeMeta(type).label}</CardTitle>
                  <p className="text-sm text-muted-foreground">Add a couple of details to help responders.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="zone">Zone</Label>
                  <Select value={zone} onValueChange={setZone}>
                    <SelectTrigger id="zone"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room / area (optional)</Label>
                  <input
                    id="room"
                    value={room}
                    onChange={(e) => setRoom(e.target.value.slice(0, 50))}
                    placeholder="e.g. 1407"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  placeholder="Anything responders should know before arriving…"
                  className="min-h-[88px]"
                />
                <p className="text-right text-xs text-muted-foreground">{note.length}/500</p>
              </div>

              <Button
                onClick={submit}
                disabled={stage === "submitting"}
                size="lg"
                className="w-full bg-gradient-emergency text-emergency-foreground hover:opacity-90"
              >
                {stage === "submitting" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Siren className="h-5 w-5" />}
                Send SOS
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Your location and room are shared automatically.
              </p>
            </CardContent>
          </Card>
        )}

        {stage === "sent" && justSubmitted && (
          <Card className="border-success/30 shadow-elegant animate-fade-in-up">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h2 className="text-2xl font-bold">Help is on the way</h2>
                <p className="max-w-md text-muted-foreground">
                  Your alert was sent to the response team. Stay where you are if it's safe.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoCell label="Incident" value={`#${justSubmitted.id.slice(0, 8).toUpperCase()}`} />
                <InfoCell label="Type" value={typeMeta(justSubmitted.type).label} />
                <InfoCell label="Status">
                  <Badge className={statusClass(justSubmitted.status)}>{statusLabel(justSubmitted.status)}</Badge>
                </InfoCell>
                <InfoCell label="Zone" value={justSubmitted.zone} />
                <InfoCell label="Room" value={justSubmitted.room || "—"} />
                <InfoCell label="Reported" value={relativeTime(justSubmitted.created_at)} />
              </div>

              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <Button onClick={() => navigate("/evacuation")}>Show safe route</Button>
                <Button variant="outline" onClick={reset}>Send another</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {recent.length > 0 && (
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your recent alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recent.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{typeMeta(i.type).label}</p>
                    <p className="text-xs text-muted-foreground">{i.zone}{i.room ? ` · ${i.room}` : ""} · {relativeTime(i.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge className={severityClass(i.severity)} variant="outline">{i.severity}</Badge>
                    <Badge className={statusClass(i.status)}>{statusLabel(i.status)}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

function InfoCell({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-left">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      {children ?? <p className="font-semibold">{value}</p>}
    </div>
  );
}

export default GuestSOS;
