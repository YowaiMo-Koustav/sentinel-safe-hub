import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/StatusChip";
import { incidents, venueStats, priorityColor, statusColor, responders } from "@/lib/sampleData";
import { Users, ShieldCheck, Radio, Activity, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const active = incidents.filter((i) => i.status !== "resolved");

  const kpis = [
    { label: "Guests on-site", value: venueStats.occupancy, icon: Users },
    { label: "Staff on duty", value: venueStats.staffOnDuty, icon: ShieldCheck },
    { label: "Responders available", value: venueStats.respondersAvailable, icon: Radio },
    { label: "Sensors online", value: venueStats.sensorsOnline, icon: Activity },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Staff Operations"
        title="Live dashboard"
        description="Real-time view of incidents, responders, and venue signals."
        actions={
          <>
            <StatusChip label={`${active.length} active`} tone="emergency" pulse />
            <Button variant="outline" onClick={() => navigate("/responder")}>Responder view</Button>
          </>
        }
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="shadow-card">
              <CardContent className="flex items-center justify-between p-4 sm:p-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
                  <p className="mt-1 text-2xl font-bold">{k.value}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <k.icon className="h-5 w-5" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active incidents */}
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Active incidents</CardTitle>
              <Badge variant="outline">{incidents.length} total</Badge>
            </CardHeader>
            <CardContent className="divide-y">
              {incidents.map((i) => (
                <button
                  key={i.id}
                  onClick={() => navigate(`/incidents/${i.id}`)}
                  className="flex w-full items-center gap-3 py-3 text-left transition-base hover:bg-muted/40 sm:gap-4"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{i.id}</span>
                      <Badge className={priorityColor(i.priority)}>{i.priority}</Badge>
                      <Badge className={statusColor(i.status)}>{i.status}</Badge>
                    </div>
                    <p className="text-sm">{i.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.location} · {i.reporterRole}: {i.reporter} · {i.createdAt}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Responders */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Responders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {responders.map((r) => (
                <div key={r.name} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.role} · {r.location}</p>
                  </div>
                  <StatusChip
                    label={r.status}
                    tone={r.status === "available" ? "success" : "warning"}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
