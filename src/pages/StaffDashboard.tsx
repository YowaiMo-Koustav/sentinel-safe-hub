import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/StatusChip";
import { useIncidents } from "@/hooks/useIncidents";
import {
  statusLabel, NEXT_STATUS, type IncidentRow,
} from "@/lib/incidents";
import { useAuth } from "@/lib/AuthContext";
import { AlertTriangle, Inbox, CheckCircle2, Activity, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IncidentCard } from "@/components/incidents/IncidentCard";
import { FilterChips } from "@/components/incidents/FilterChips";
import { SystemStatusStrip } from "@/components/SystemStatusStrip";
import { EnhancedAIDetectionMonitor } from "@/components/EnhancedAIDetectionMonitor";
import { EnhancedMeshNetworkStatus } from "@/components/EnhancedMeshNetworkStatus";
import { DynamicRoutingPanel } from "@/components/DynamicRoutingPanel";
import { SensorMonitoringPanel } from "@/components/SensorMonitoringPanel";
import { VenueMap, type MapMarker } from "@/components/maps/VenueMap";
import { zoneCoords } from "@/lib/venueGeo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Filter = "active" | "new" | "acknowledged" | "in_progress" | "resolved" | "all";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { displayName, user } = useAuth();
  const { incidents, loading } = useIncidents();
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
    if (!next) return;
    setActing(i.id);
    
    // Mock API call - replace with actual API implementation
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log("Advancing incident:", { incidentId: i.id, next, userId: user?.id });
      toast.success(`Marked ${statusLabel(next).toLowerCase()}`);
    } catch (error) {
      toast.error("Could not update", { description: "Failed to update incident" });
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
                label: typeMetaLabel(i.type),
                pulse: i.status === "new" && i.severity === "critical",
                onClick: () => navigate(`/incidents/${i.id}`),
              }))}
          />
        </Card>

        {/* Operations telemetry (collapsible) */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="telemetry" className="rounded-xl border bg-card shadow-card">
            <AccordionTrigger className="px-5 py-3 text-sm font-semibold hover:no-underline">
              Operations telemetry · AI · Mesh · Routing · Sensors
            </AccordionTrigger>
            <AccordionContent className="space-y-6 px-5 pb-5">
              <div className="grid gap-6 lg:grid-cols-2">
                <EnhancedAIDetectionMonitor />
                <EnhancedMeshNetworkStatus />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <DynamicRoutingPanel />
                <SensorMonitoringPanel />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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
