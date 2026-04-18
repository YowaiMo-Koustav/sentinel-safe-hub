import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/StatusChip";
import { useIncidents } from "@/hooks/useIncidents";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  typeMeta, severityClass, statusClass, statusLabel, relativeTime, NEXT_STATUS,
} from "@/lib/incidents";
import { MapPin, ArrowRight, CheckCircle2, Loader2, Hand } from "lucide-react";
import { toast } from "sonner";

const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;

const ResponderView = () => {
  const navigate = useNavigate();
  const { user, displayName } = useAuth();
  const { incidents, loading } = useIncidents();
  const [acting, setActing] = useState<string | null>(null);

  const queue = useMemo(() => {
    return incidents
      .filter((i) => i.status !== "resolved")
      .sort((a, b) => {
        const s = SEV_RANK[a.severity] - SEV_RANK[b.severity];
        if (s !== 0) return s;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  }, [incidents]);

  const mine = queue.filter((i) => i.assigned_to === user?.id);
  const others = queue.filter((i) => i.assigned_to !== user?.id);

  const claim = async (id: string) => {
    if (!user) return;
    setActing(id);
    const { error } = await supabase.from("incidents").update({
      status: "in_progress",
      assigned_to: user.id,
      assigned_name: displayName || user.email?.split("@")[0],
    }).eq("id", id);
    setActing(null);
    if (error) toast.error("Could not claim", { description: error.message });
    else toast.success("Incident assigned to you");
  };

  const resolve = async (id: string) => {
    setActing(id);
    const { error } = await supabase.from("incidents").update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
    }).eq("id", id);
    setActing(null);
    if (error) toast.error("Could not resolve", { description: error.message });
    else toast.success("Incident resolved");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Responder"
        title="Response queue"
        description="Sorted by severity. Claim an incident to start responding."
        actions={<StatusChip label="On duty" tone="success" pulse />}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : queue.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <p className="text-base font-semibold text-foreground">All clear</p>
              <p className="text-sm">No active incidents in the queue.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Section title="Assigned to me" empty="Nothing assigned yet — claim one below." items={mine}
              renderActions={(i) => (
                <>
                  <Button size="sm" disabled={acting === i.id} onClick={() => resolve(i.id)}>
                    {acting === i.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Resolve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/incidents/${i.id}`)}>
                    Open <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            />
            <Section title="Open queue" empty="Nothing in the open queue." items={others}
              renderActions={(i) => (
                <>
                  {NEXT_STATUS[i.status] && (
                    <Button size="sm" disabled={acting === i.id} onClick={() => claim(i.id)}>
                      {acting === i.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hand className="h-4 w-4" />}
                      Claim
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => navigate(`/incidents/${i.id}`)}>
                    Open <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            />
          </>
        )}
      </div>
    </div>
  );
};

function Section({
  title, items, empty, renderActions,
}: {
  title: string;
  items: ReturnType<typeof useIncidents>["incidents"];
  empty: string;
  renderActions: (i: ReturnType<typeof useIncidents>["incidents"][number]) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-card/40 p-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((i) => {
            const meta = typeMeta(i.type);
            const Icon = meta.icon;
            return (
              <Card key={i.id} className="shadow-card transition-base hover:shadow-elegant">
                <CardHeader className="flex flex-row items-start gap-3 pb-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">{meta.label}</CardTitle>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge className={severityClass(i.severity)} variant="outline">{i.severity}</Badge>
                      <Badge className={statusClass(i.status)}>{statusLabel(i.status)}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {i.note && <p className="text-sm">{i.note}</p>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {i.zone}{i.room ? ` · ${i.room}` : ""}</span>
                    <span>{relativeTime(i.created_at)}</span>
                    <span>by {i.reporter_name || "Anonymous"}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">{renderActions(i)}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ResponderView;
