import { cn } from "@/lib/utils";

export type MapTone = "emergency" | "warning" | "success" | "info" | "primary" | "muted";

export interface MapMarker {
  id: string;
  position: [number, number];
  tone: MapTone;
  label?: string;
  pulse?: boolean;
  popup?: React.ReactNode;
  onClick?: () => void;
}

export interface MapRoute {
  positions: [number, number][];
  tone: MapTone;
  dashed?: boolean;
}

interface Props {
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  markers?: MapMarker[];
  routes?: MapRoute[];
  fitBounds?: boolean;
  legend?: boolean;
  className?: string;
}

const TONE_COLORS: Record<MapTone, string> = {
  emergency: "#ef4444",
  warning: "#f59e0b",
  success: "#22c55e",
  info: "#3b82f6",
  primary: "#6366f1",
  muted: "#6b7280",
};

export function VenueMap({
  height = 380,
  markers = [],
  routes = [],
  legend = true,
  className,
}: Props) {
  const safeMarkers = markers.filter((m) => Array.isArray(m.position));

  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-muted", className)} style={{ height }}>
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground text-lg font-medium">Venue Map</div>
          <div className="text-sm text-muted-foreground">
            Interactive map temporarily disabled for stability
          </div>
          {safeMarkers.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="text-sm font-medium text-foreground">
                Active Incidents: {safeMarkers.length}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {safeMarkers.map((marker) => (
                  <div
                    key={marker.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-full border text-xs"
                    style={{
                      backgroundColor: TONE_COLORS[marker.tone] + "20",
                      borderColor: TONE_COLORS[marker.tone],
                      color: TONE_COLORS[marker.tone],
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: TONE_COLORS[marker.tone] }}
                    />
                    {marker.label || marker.tone}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {legend && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur rounded-lg border p-2 text-xs">
          <div className="font-medium mb-1">Incident Types</div>
          {Object.entries(TONE_COLORS).map(([tone, color]) => (
            <div key={tone} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full border border-white/50"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{tone}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
