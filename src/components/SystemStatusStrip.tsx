import { Card, CardContent } from "@/components/ui/card";
import { useSystemStatus } from "@/hooks/useVenueData";
import { Activity, Wifi, Zap, Users, ShieldCheck, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export function SystemStatusStrip() {
  const status = useSystemStatus();
  if (!status) return null;

  const sensorPct = status.sensors_total > 0 ? Math.round((status.sensors_online / status.sensors_total) * 100) : 100;
  const items = [
    { icon: Activity, label: "Sensors", value: `${status.sensors_online}/${status.sensors_total}`, ok: sensorPct >= 90 },
    { icon: Wifi, label: "Network", value: status.network_ok ? "Online" : "Offline", ok: status.network_ok },
    { icon: Zap, label: "Power", value: status.power_ok ? "Stable" : "Outage", ok: status.power_ok },
    { icon: Radio, label: "Responders", value: `${status.responders_available} available`, ok: status.responders_available > 0 },
    { icon: Users, label: "Staff on duty", value: `${status.staff_on_duty}`, ok: true },
  ];

  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center gap-1 overflow-x-auto p-3">
        <span className="mr-2 inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2 py-1 text-xs font-semibold text-success">
          <ShieldCheck className="h-3.5 w-3.5" /> System healthy
        </span>
        {items.map((it) => (
          <div key={it.label} className="flex shrink-0 items-center gap-2 px-3 py-1">
            <it.icon className={cn("h-4 w-4", it.ok ? "text-success" : "text-emergency")} />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{it.label}</p>
              <p className="text-xs font-semibold">{it.value}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
