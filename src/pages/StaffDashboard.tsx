import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/StatusChip";
import { useExpressIncidents } from "@/hooks/useExpressIncidents";
import {
  statusLabel, NEXT_STATUS, typeLabel, type IncidentRow,
} from "@/lib/incidents";
import { useExpressAuth } from "@/lib/ExpressAuthContext";
import { AlertTriangle, Inbox, CheckCircle2, Activity, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IncidentCard } from "@/components/incidents/IncidentCard";
import { FilterChips } from "@/components/incidents/FilterChips";
import { SystemStatusStrip } from "@/components/SystemStatusStrip";
import { OperationsTelemetry } from "@/components/OperationsTelemetry";
import { EnhancedMeshNetworkStatus } from "@/components/EnhancedMeshNetworkStatus";
import { EnhancedAIDetectionMonitor } from "@/components/EnhancedAIDetectionMonitor";
import { VenueMap, type MapMarker } from "@/components/maps/VenueMap";
import { zoneCoords } from "@/lib/venueGeo";

type Filter = "active" | "new" | "acknowledged" | "in_progress" | "resolved" | "all";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { displayName, user } = useExpressAuth();
  const { incidents, loading, updateIncident } = useExpressIncidents();
  const [filter, setFilter] = useState<Filter>("active");
  const [acting, setActing] = useState<string | null>(null);

  const counts = useMemo(() => ({
    new: incidents.filter((i) => i.status === "new").length,
    acknowledged: incidents.filter((i) => i.status === "acknowledged").length,
    in_progress: incidents.filter((i) => i.status === "in_progress").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
  }), [incidents]);

  const filtered = useMemo(() => {
    if (filter === "all") return incidents;
    if (filter === "active") return incidents.filter((i) => i.status !== "resolved");
    return incidents.filter((i) => i.status === filter);
  }, [incidents, filter]);

  const advance = async (i: IncidentRow) => {
    const next = NEXT_STATUS[i.status];
    if (!next || !user) return;
    setActing(i.id);
    try {
      const patch: any = { status: next };
      if (next === "in_progress" && !i.assigned_to) {
        patch.assigned_to = user.id;
        patch.assigned_name = displayName || user.email;
      }
      if (next === "resolved") patch.resolved_at = new Date().toISOString();
      await updateIncident(i.id, patch);
      toast.success(`Marked ${statusLabel(next).toLowerCase()}`);
    } catch (error: any) {
      toast.error("Could not update", { description: error?.message });
    }
    setActing(null);
  };

  const kpis = [
    { label: "New alerts", value: counts.new, icon: AlertTriangle, tone: "text-emergency" },
    { label: "Acknowledged", value: counts.acknowledged, icon: Inbox, tone: "text-warning" },
    { label: "In progress", value: counts.in_progress, icon: Activity, tone: "text-info" },
    { label: "Resolved", value: counts.resolved, icon: CheckCircle2, tone: "text-success" },
  ];
  const activeCount = counts.new + counts.acknowledged + counts.in_progress;

  return (
    <div>
      <PageHeader
        eyebrow="Staff"
        title="Live incident dashboard"
        description="Real-time view of every alert across the venue."
        actions={
          <>
            <StatusChip
              label={`${activeCount} active`}
              tone={counts.new > 0 ? "emergency" : "info"}
              pulse={counts.new > 0}
            />
            <Button variant="outline" size="sm" onClick={() => navigate("/responder")}>
              Responder view
            </Button>
          </>
        }
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <SystemStatusStrip />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="shadow-card">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
                  <p className="mt-1 text-3xl font-bold">{k.value}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-muted ${k.tone}`}>
                  <k.icon className="h-5 w-5" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live venue map */}
        <Card className="overflow-hidden shadow-card">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Live venue map</CardTitle>
            <span className="text-xs text-muted-foreground">{incidents.filter((i) => i.status !== "resolved").length} active incidents</span>
          </CardHeader>
          <VenueMap
            height={360}
            markers={incidents
              .filter((i) => i.status !== "resolved")
              .map<MapMarker>((i) => ({
                id: i.id,
                position: zoneCoords(i.zone),
                tone: i.severity === "critical" ? "emergency" : i.severity === "high" ? "warning" : "info",
                label: typeLabel(i.type),
                pulse: i.status === "new" && i.severity === "critical",
                onClick: () => navigate(`/incidents/${i.id}`),
              }))}
          />
        </Card>

        {/* EMSH Network and AI Detection */}
        <div className="grid gap-6 lg:grid-cols-2">
          <EnhancedMeshNetworkStatus />
          <EnhancedAIDetectionMonitor />
        </div>

        {/* Operations telemetry */}
        <OperationsTelemetry />

        <Card className="shadow-card">
          <CardHeader className="flex flex-col gap-3 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Incidents</CardTitle>
              <span className="text-xs text-muted-foreground">{filtered.length} shown</span>
            </div>
            <FilterChips<Filter>
              value={filter}
              onChange={setFilter}
              chips={[
                { id: "active", label: "Active", count: activeCount, tone: "emergency" },
                { id: "new", label: "New", count: counts.new, tone: "emergency" },
                { id: "acknowledged", label: "Acknowledged", count: counts.acknowledged, tone: "warning" },
                { id: "in_progress", label: "In progress", count: counts.in_progress, tone: "info" },
                { id: "resolved", label: "Resolved", count: counts.resolved, tone: "success" },
                { id: "all", label: "All", count: incidents.length },
              ]}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <p className="text-sm font-medium">All clear</p>
                <p className="text-xs">No incidents match this filter.</p>
              </div>
            ) : (
              filtered.map((i) => (
                <IncidentCard
                  key={i.id}
                  incident={i}
                  onClick={() => navigate(`/incidents/${i.id}`)}
                  actions={
                    <>
                      {NEXT_STATUS[i.status] && (
                        <Button
                          size="sm"
                          variant={i.status === "new" ? "default" : "outline"}
                          disabled={acting === i.id}
                          onClick={(e) => { e.stopPropagation(); advance(i); }}
                        >
                          {acting === i.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          {i.status === "new" && "Acknowledge"}
                          {i.status === "acknowledged" && "Take ownership"}
                          {i.status === "in_progress" && "Resolve"}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${i.id}`); }}>
                        Open <ArrowRight className="h-4 w-4" />
                      </Button>
                    </>
                  }
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffDashboard;
