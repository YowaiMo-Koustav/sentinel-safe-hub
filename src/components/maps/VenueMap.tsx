import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L, { type LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { VENUE_CENTER, VENUE_ZOOM } from "@/lib/venueGeo";
import { cn } from "@/lib/utils";

export type MapTone = "emergency" | "warning" | "success" | "info" | "primary" | "muted";

export interface MapMarker {
  id: string;
  position: LatLngTuple;
  tone: MapTone;
  label?: string;
  pulse?: boolean;
  popup?: React.ReactNode;
  onClick?: () => void;
}

export interface MapRoute {
  positions: LatLngTuple[];
  tone: MapTone;
  dashed?: boolean;
}

interface Props {
  center?: LatLngTuple;
  zoom?: number;
  height?: number | string;
  markers?: MapMarker[];
  routes?: MapRoute[];
  fitBounds?: boolean;
  legend?: boolean;
  className?: string;
}

const TONE_HSL: Record<MapTone, string> = {
  emergency: "var(--emergency)",
  warning: "var(--warning)",
  success: "var(--success)",
  info: "var(--info)",
  primary: "var(--primary)",
  muted: "var(--muted-foreground)",
};

function divIcon(tone: MapTone, pulse?: boolean, label?: string) {
  const color = `hsl(${TONE_HSL[tone]})`;
  const ring = pulse
    ? `<span style="position:absolute;inset:-8px;border-radius:9999px;background:${color};opacity:.35;animation:pulse-emergency 1.6s ease-out infinite;"></span>`
    : "";
  const labelHtml = label
    ? `<span style="position:absolute;left:26px;top:2px;white-space:nowrap;background:hsl(var(--card));color:hsl(var(--foreground));font-size:11px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px solid hsl(var(--border));box-shadow:0 1px 2px rgba(0,0,0,.08);">${label}</span>`
    : "";
  return L.divIcon({
    className: "venue-map-marker",
    html: `<div style="position:relative;width:20px;height:20px;">
      ${ring}
      <span style="position:absolute;inset:0;border-radius:9999px;background:${color};border:3px solid hsl(var(--card));box-shadow:0 2px 6px rgba(0,0,0,.25);"></span>
      ${labelHtml}
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function FitBounds({ markers, routes }: { markers: MapMarker[]; routes: MapRoute[] }) {
  const map = useMap();
  useEffect(() => {
    const pts: LatLngTuple[] = [
      ...markers.map((m) => m.position),
      ...routes.flatMap((r) => r.positions),
    ];
    if (pts.length < 2) return;
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 18 });
  }, [map, markers, routes]);
  return null;
}

export function VenueMap({
  center = VENUE_CENTER,
  zoom = VENUE_ZOOM,
  height = 380,
  markers = [],
  routes = [],
  fitBounds = true,
  legend = true,
  className,
}: Props) {
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png";

  const safeMarkers = useMemo(() => markers.filter((m) => Array.isArray(m.position)), [markers]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-muted", className)} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        attributionControl={false}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {routes.map((r, i) => (
          <Polyline
            key={i}
            positions={r.positions}
            pathOptions={{
              color: `hsl(${TONE_HSL[r.tone]})`,
              weight: 5,
              opacity: 0.85,
              dashArray: r.dashed ? "8 8" : undefined,
              lineCap: "round",
            }}
          />
        ))}
        {safeMarkers.map((m) => (
          <Marker
            key={m.id}
            position={m.position}
            icon={divIcon(m.tone, m.pulse, m.label)}
            eventHandlers={m.onClick ? { click: m.onClick } : undefined}
          >
            {m.popup ? <Popup>{m.popup}</Popup> : null}
          </Marker>
        ))}
        {fitBounds && <FitBounds markers={safeMarkers} routes={routes} />}
      </MapContainer>

      {legend && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex flex-wrap gap-2 rounded-lg border bg-card/95 px-3 py-2 text-xs shadow-card backdrop-blur">
          <LegendDot tone="info" label="You" />
          <LegendDot tone="success" label="Assembly" />
          <LegendDot tone="emergency" label="Incident" />
          <LegendDot tone="warning" label="Caution" />
        </div>
      )}
    </div>
  );
}

function LegendDot({ tone, label }: { tone: MapTone; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${TONE_HSL[tone]})` }} />
      <span className="font-medium text-foreground">{label}</span>
    </span>
  );
}
