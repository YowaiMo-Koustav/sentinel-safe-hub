import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Network, Map as MapIcon, Activity } from "lucide-react";
import { useSystemStatus } from "@/hooks/useVenueData";
import { cn } from "@/lib/utils";

/** Lightweight, dependency-free telemetry panels for the staff dashboard.
 *  Replaces heavy demo panels that were unstable. */
export function OperationsTelemetry() {
  const status = useSystemStatus();
  const networkOk = status?.network_ok ?? true;
  const sensorsOnline = status?.sensors_online ?? 0;
  const sensorsTotal = status?.sensors_total ?? 0;
  const sensorPct = sensorsTotal > 0 ? Math.round((sensorsOnline / sensorsTotal) * 100) : 100;

  const tiles = [
    {
      icon: Brain,
      title: "AI detection",
      value: "Idle",
      hint: "Edge models ready · 0 active streams",
      tone: "text-info",
      bg: "bg-info/10",
    },
    {
      icon: Network,
      title: "Mesh network",
      value: networkOk ? "Healthy" : "Degraded",
      hint: networkOk ? "All nodes reachable" : "Some nodes unreachable",
      tone: networkOk ? "text-success" : "text-warning",
      bg: networkOk ? "bg-success/10" : "bg-warning/10",
    },
    {
      icon: MapIcon,
      title: "Dynamic routing",
      value: "Optimal",
      hint: "Evacuation paths recomputed live",
      tone: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Activity,
      title: "Sensors",
      value: `${sensorPct}%`,
      hint: `${sensorsOnline} of ${sensorsTotal} online`,
      tone: sensorPct >= 90 ? "text-success" : "text-warning",
      bg: sensorPct >= 90 ? "bg-success/10" : "bg-warning/10",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.title} className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", t.bg, t.tone)}>
                <t.icon className="h-4 w-4" />
              </span>
              <CardTitle className="text-sm">{t.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className={cn("text-xl font-semibold", t.tone)}>{t.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
