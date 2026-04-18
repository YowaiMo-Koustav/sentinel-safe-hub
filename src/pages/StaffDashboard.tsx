import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/StatusChip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIncidents } from "@/hooks/useIncidents";
import {
  typeMeta, severityClass, statusClass, statusLabel, relativeTime, NEXT_STATUS,
  type IncidentStatus, type IncidentRow,
} from "@/lib/incidents";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { AlertTriangle, Inbox, CheckCircle2, Activity, ArrowRight, MapPin, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { TablesUpdate } from "@/integrations/supabase/types";

type Filter = "active" | "all" | "resolved";

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
    if (filter === "resolved") return incidents.filter((i) => i.status === "resolved");
    return incidents.filter((i) => i.status !== "resolved");
  }, [incidents, filter]);

  const advance = async (i: IncidentRow) => {
    const next = NEXT_STATUS[i.status];
    if (!next) return;
    setActing(i.id);
    const patch: TablesUpdate<"incidents"> = { status: next };
    if (next === "in_progress" && user) {
      patch.assigned_to = user.id;
      patch.assigned_name = displayName || user.email?.split("@")[0] || "Staff";
    }
    if (next === "resolved") patch.resolved_at = new Date().toISOString();

    const { error } = await supabase.from("incidents").update(patch).eq("id", i.id);
    setActing(null);
    if (error) toast.error("Could not update", { description: error.message });
    else toast.success(`Marked ${statusLabel(next).toLowerCase()}`);
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

        <Card className="shadow-card">
          <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Incidents</CardTitle>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <p className="text-sm font-medium">All clear</p>
                <p className="text-xs">No incidents in this view.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((i) => {
                  const meta = typeMeta(i.type);
                  const Icon = meta.icon;
                  const next = NEXT_STATUS[i.status];
                  return (
                    <li key={i.id} className="flex flex-col gap-3 p-4 transition-base hover:bg-muted/30 sm:flex-row sm:items-center sm:gap-4">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{meta.label}</p>
                          <Badge className={severityClass(i.severity)} variant="outline">{i.severity}</Badge>
                          <Badge className={statusClass(i.status)}>{statusLabel(i.status)}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{i.source}</Badge>
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {i.zone}{i.room ? ` · ${i.room}` : ""}</span>
                          <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" /> {i.reporter_name || "Anonymous"}</span>
                          <span>{relativeTime(i.created_at)}</span>
                          {i.assigned_name && <span className="text-info">→ {i.assigned_name}</span>}
                        </p>
                        {i.note && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">"{i.note}"</p>}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {next && (
                          <Button
                            size="sm"
                            variant={i.status === "new" ? "default" : "outline"}
                            disabled={acting === i.id}
                            onClick={() => advance(i)}
                          >
                            {acting === i.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {i.status === "new" && "Acknowledge"}
                            {i.status === "acknowledged" && "Take ownership"}
                            {i.status === "in_progress" && "Resolve"}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/incidents/${i.id}`)}>
                          Open <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffDashboard;
