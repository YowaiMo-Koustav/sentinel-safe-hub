import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { incidents, priorityColor, statusColor } from "@/lib/sampleData";
import { ArrowLeft, MapPin, User, Clock, Radio, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const IncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const incident = incidents.find((i) => i.id === id) ?? incidents[0];

  return (
    <div>
      <PageHeader
        eyebrow={`Incident · ${incident.id}`}
        title={`${incident.type[0].toUpperCase()}${incident.type.slice(1)} response`}
        description={incident.description}
        actions={
          <>
            <Badge className={priorityColor(incident.priority)}>{incident.priority}</Badge>
            <Badge className={statusColor(incident.status)}>{incident.status}</Badge>
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
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field icon={MapPin} label="Location" value={`${incident.location}${incident.room ? ` · ${incident.room}` : ""}`} />
                <Field icon={User} label="Reporter" value={`${incident.reporter} (${incident.reporterRole})`} />
                <Field icon={Clock} label="Reported" value={incident.createdAt} />
                <Field icon={Radio} label="Responders" value={incident.responders.join(", ")} />
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
              <CardContent>
                <ol className="relative space-y-4 border-l-2 border-border pl-5">
                  {incident.timeline.map((t, idx) => (
                    <li key={idx} className="relative">
                      <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
                      <p className="text-xs font-medium text-muted-foreground">{t.time}</p>
                      <p className="text-sm">{t.event}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => { toast.success("Marked acknowledged"); }}>
                  Acknowledge
                </Button>
                <Button className="w-full" variant="outline" onClick={() => navigate("/evacuation")}>
                  Show route to scene
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => { toast.success("Incident resolved"); navigate("/dashboard"); }}
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark resolved
                </Button>
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

export default IncidentDetail;
