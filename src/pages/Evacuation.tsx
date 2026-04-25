import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/StatusChip";
import { useEvacuationPaths } from "@/hooks/useVenueData";
import { ArrowDown, DoorOpen, MapPin, ShieldCheck, Loader2, Footprints, Volume2, VolumeX } from "lucide-react";
import { VenueMap, type MapMarker, type MapRoute, type MapTone } from "@/components/maps/VenueMap";
import { ASSEMBLY_POINT, buildRoute, zoneCoords } from "@/lib/venueGeo";
import { useState } from "react";

const PATH_TONE: Record<string, { tone: "success" | "warning" | "emergency"; label: string }> = {
  clear: { tone: "success", label: "Clear" },
  partial: { tone: "warning", label: "Partial" },
  blocked: { tone: "emergency", label: "Blocked" },
};

const Evacuation = () => {
  const { paths, loading } = useEvacuationPaths();

  // Recommend the first non-blocked path (or first path).
  const recommended = useMemo(() => {
    return paths.find((p) => p.status === "clear") ?? paths[0] ?? null;
  }, [paths]);

  const steps: string[] = useMemo(() => {
    if (!recommended) return [];
    const raw = recommended.steps;
    if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === "string");
    return [];
  }, [recommended]);

  return (
    <div>
      <PageHeader
        eyebrow="Safety routing"
        title="Your fastest safe route"
        description="Hazard-aware paths to assembly points. Updated live."
        actions={
          recommended
            ? <StatusChip label={`Route ${PATH_TONE[recommended.status].label.toLowerCase()}`} tone={PATH_TONE[recommended.status].tone} pulse />
            : null
        }
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !recommended ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center text-muted-foreground">
              No evacuation paths configured yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Map placeholder */}
            <Card className="overflow-hidden shadow-card lg:col-span-2">
              <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-secondary to-muted">
                <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="400" height="300" fill="url(#grid)" />
                  <rect x="40" y="120" width="320" height="40" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
                  <rect x="180" y="40" width="40" height="220" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
                  <rect x="40" y="40" width="120" height="60" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
                  <text x="100" y="75" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">{recommended.from_zone}</text>
                  <rect x="240" y="200" width="120" height="60" fill="hsl(var(--success) / 0.15)" stroke="hsl(var(--success))" />
                  <text x="300" y="235" textAnchor="middle" fontSize="10" fill="hsl(var(--success))" fontWeight="600">{recommended.to_zone}</text>
                  <path d="M 100 100 L 100 140 L 200 140 L 200 230 L 300 230"
                    fill="none" stroke="hsl(var(--emergency))" strokeWidth="3" strokeDasharray="6 4" />
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
                  <MapPin className="h-4 w-4" /> {recommended.from_zone} → {recommended.to_zone}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {recommended.estimated_seconds && (
                    <span><strong>~{Math.max(1, Math.round(recommended.estimated_seconds / 60))} min</strong> walk</span>
                  )}
                  <Badge variant="outline" className="capitalize">{recommended.status}</Badge>
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
                      {i === 0 ? <DoorOpen className="h-4 w-4" /> : i === steps.length - 1 ? <Footprints className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{i + 1}. {s}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
                  <ShieldCheck className="h-4 w-4" />
                  Stay calm. Staff will meet you at the assembly point.
                </div>
                <Button className="w-full">Start guided navigation</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other paths */}
        {paths.length > 1 && (
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-base">All evacuation paths</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {paths.map((p) => {
                const tone = PATH_TONE[p.status];
                return (
                  <div key={p.id} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">{p.name}</p>
                      <StatusChip label={tone.label} tone={tone.tone} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.from_zone} → {p.to_zone}
                      {p.estimated_seconds ? ` · ~${Math.round(p.estimated_seconds / 60)} min` : ""}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Evacuation;
