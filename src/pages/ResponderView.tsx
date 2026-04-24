import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/StatusChip";
import { useIncidents } from "@/hooks/useIncidents";
import { useAuth } from "@/lib/AuthContext";
import { NEXT_STATUS } from "@/lib/incidents";
import { ArrowRight, CheckCircle2, Loader2, Hand } from "lucide-react";
import { toast } from "sonner";
import { IncidentCard } from "@/components/incidents/IncidentCard";
import { FilterChips } from "@/components/incidents/FilterChips";

const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;
type Scope = "mine" | "queue" | "all";

const ResponderView = () => {
  const navigate = useNavigate();
  const { user, displayName } = useAuth();
  const { incidents, loading } = useIncidents();
  const [acting, setActing] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("queue");

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
  const open = queue.filter((i) => i.assigned_to !== user?.id);
  const visible = scope === "mine" ? mine : scope === "queue" ? open : queue;

  const claim = async (id: string) => {
    if (!user) return;
    setActing(id);
    
    // Mock API call - replace with actual API implementation
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log("Claiming incident:", { id, userId: user.id });
      toast.success("Incident assigned to you");
    } catch (error) {
      toast.error("Could not claim", { description: "Failed to claim incident" });
    }
    setActing(null);
  };

  const resolve = async (id: string) => {
    setActing(id);
    
    // Mock API call - replace with actual API implementation
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log("Resolving incident:", { id });
      toast.success("Incident resolved");
    } catch (error) {
      toast.error("Could not resolve", { description: "Failed to resolve incident" });
    }
    setActing(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Responder"
        title="Response queue"
        description="Sorted by severity. Claim an incident to start responding."
        actions={<StatusChip label="On duty" tone="success" pulse />}
      />

      <div className="space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <FilterChips<Scope>
          value={scope}
          onChange={setScope}
          chips={[
            { id: "queue", label: "Open queue", count: open.length, tone: "emergency" },
            { id: "mine", label: "Assigned to me", count: mine.length, tone: "info" },
            { id: "all", label: "All active", count: queue.length },
          ]}
        />

        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <p className="text-base font-semibold text-foreground">All clear</p>
              <p className="text-sm">{scope === "mine" ? "Nothing assigned yet — claim from the queue." : "Nothing in this view."}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {visible.map((i) => {
              const isMine = i.assigned_to === user?.id;
              return (
                <IncidentCard
                  key={i.id}
                  incident={i}
                  onClick={() => navigate(`/incidents/${i.id}`)}
                  actions={
                    <div className="flex flex-col gap-2">
                      {isMine ? (
                        <Button size="sm" disabled={acting === i.id} onClick={(e) => { e.stopPropagation(); resolve(i.id); }}>
                          {acting === i.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Resolve
                        </Button>
                      ) : NEXT_STATUS[i.status] ? (
                        <Button size="sm" disabled={acting === i.id} onClick={(e) => { e.stopPropagation(); claim(i.id); }}>
                          {acting === i.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hand className="h-4 w-4" />}
                          Claim
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${i.id}`); }}>
                        Open <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponderView;
