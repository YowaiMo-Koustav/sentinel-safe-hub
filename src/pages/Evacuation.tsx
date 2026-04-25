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

  const [voice, setVoice] = useState(false);

  const speakStep = (text: string) => {
    if (!voice || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const mapMarkers: MapMarker[] = recommended ? [
    { id: "you", position: zoneCoords(recommended.from_zone), tone: "info", label: "You", pulse: true },
    { id: "assembly", position: ASSEMBLY_POINT.coords, tone: "success", label: "Assembly" },
  ] : [];

  const mapRoutes: MapRoute[] = recommended ? [{
    positions: buildRoute(recommended.from_zone, recommended.to_zone),
    tone: (PATH_TONE[recommended.status]?.tone ?? "info") as MapTone,
    dashed: recommended.status !== "clear",
  }] : [];

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
            {/* Live map */}
            <Card className="overflow-hidden shadow-card lg:col-span-2">
              <VenueMap
                height={420}
                markers={mapMarkers}
                routes={mapRoutes}
              />
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
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Step-by-step</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setVoice((v) => !v); if (!voice && steps[0]) speakStep(steps[0]); }}
                  aria-label="Toggle voice guidance"
                >
                  {voice ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <span className="ml-1 text-xs">{voice ? "Voice on" : "Voice off"}</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {steps.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => speakStep(s)}
                    className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-base hover:border-primary/40"
                  >
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
