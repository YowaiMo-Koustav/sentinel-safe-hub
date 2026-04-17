import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/StatusChip";
import { ArrowDown, ArrowRight, DoorOpen, Footprints, MapPin, ShieldCheck } from "lucide-react";

const steps = [
  { icon: DoorOpen, title: "Exit Room 1407", detail: "Turn left out of your room" },
  { icon: ArrowRight, title: "Walk to Stairwell B", detail: "32m · East corridor" },
  { icon: ArrowDown, title: "Descend to Lobby", detail: "14 floors · do not use elevators" },
  { icon: Footprints, title: "Cross to Assembly Point A", detail: "Garden lawn · 80m from main entrance" },
];

const Evacuation = () => {
  return (
    <div>
      <PageHeader
        eyebrow="Safety routing"
        title="Your fastest safe route"
        description="Hazard-aware path to the nearest assembly point. Updated live."
        actions={<StatusChip label="Route clear" tone="success" pulse />}
      />

      <div className="grid gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-3">
        {/* Map placeholder */}
        <Card className="overflow-hidden shadow-card lg:col-span-2">
          <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-secondary to-muted">
            {/* Stylized floor plan */}
            <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="400" height="300" fill="url(#grid)" />
              {/* corridors */}
              <rect x="40" y="120" width="320" height="40" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
              <rect x="180" y="40" width="40" height="220" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
              {/* rooms */}
              <rect x="40" y="40" width="120" height="60" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
              <text x="100" y="75" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">Room 1407</text>
              <rect x="240" y="200" width="120" height="60" fill="hsl(var(--success) / 0.15)" stroke="hsl(var(--success))" />
              <text x="300" y="235" textAnchor="middle" fontSize="10" fill="hsl(var(--success))" fontWeight="600">Stairwell B</text>
              {/* route */}
              <path
                d="M 100 100 L 100 140 L 200 140 L 200 230 L 300 230"
                fill="none"
                stroke="hsl(var(--emergency))"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              <circle cx="100" cy="100" r="6" fill="hsl(var(--info))" />
              <circle cx="300" cy="230" r="6" fill="hsl(var(--success))" />
            </svg>
            <div className="absolute left-3 top-3 flex flex-col gap-2">
              <StatusChip label="You" tone="info" />
              <StatusChip label="Assembly" tone="success" />
            </div>
          </div>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> Tower A · Floor 14 → Garden Assembly Point A
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span><strong>~3 min</strong> walk</span>
              <span className="text-muted-foreground">·</span>
              <span><strong>180m</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Step-by-step</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <s.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{i + 1}. {s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.detail}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
              <ShieldCheck className="h-4 w-4" />
              Stay calm. A staff member is meeting you at the assembly point.
            </div>
            <Button className="w-full">Start guided navigation</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Evacuation;
