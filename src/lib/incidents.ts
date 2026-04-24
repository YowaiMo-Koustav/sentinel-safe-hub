import { Flame, Users, HeartPulse, DoorClosed, Zap, WifiOff, Eye, Siren, type LucideIcon } from "lucide-react";

// Define types without Supabase dependency
export type IncidentType = "smoke_fire" | "crowd_surge" | "fall_injury" | "blocked_exit" | "power_failure" | "network_failure" | "suspicious_activity" | "other";
export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "new" | "acknowledged" | "in_progress" | "resolved";
export type IncidentSource = "guest" | "staff" | "sensor";

export interface IncidentRow {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  zone: string;
  room?: string | null;
  note?: string | null;
  source: IncidentSource;
  reporter_id: string;
  reporter_name?: string | null;
  assigned_to?: string | null;
  assigned_name?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface IncidentEventRow {
  id: string;
  incident_id: string;
  actor_id?: string | null;
  actor_name?: string | null;
  event_type: string;
  message?: string | null;
  created_at: string;
}

export const INCIDENT_TYPES: {
  id: IncidentType;
  label: string;
  icon: LucideIcon;
  defaultSeverity: IncidentSeverity;
  tone: string;
}[] = [
  { id: "smoke_fire", label: "Smoke / Fire", icon: Flame, defaultSeverity: "critical", tone: "bg-emergency/10 text-emergency" },
  { id: "crowd_surge", label: "Crowd surge", icon: Users, defaultSeverity: "high", tone: "bg-warning/10 text-warning" },
  { id: "fall_injury", label: "Fall / Injury", icon: HeartPulse, defaultSeverity: "high", tone: "bg-emergency/10 text-emergency" },
  { id: "blocked_exit", label: "Blocked exit", icon: DoorClosed, defaultSeverity: "high", tone: "bg-warning/10 text-warning" },
  { id: "power_failure", label: "Power failure", icon: Zap, defaultSeverity: "medium", tone: "bg-info/10 text-info" },
  { id: "network_failure", label: "Network failure", icon: WifiOff, defaultSeverity: "low", tone: "bg-info/10 text-info" },
  { id: "suspicious_activity", label: "Suspicious activity", icon: Eye, defaultSeverity: "medium", tone: "bg-info/10 text-info" },
  { id: "other", label: "Other", icon: Siren, defaultSeverity: "medium", tone: "bg-muted text-muted-foreground" },
];

export const ZONES = [
  "Tower A · Lobby",
  "Tower A · Rooms",
  "Tower B · Lobby",
  "Tower B · Rooms",
  "Pool deck",
  "Conference hall",
  "Restaurant",
  "Parking",
  "Back of house",
];

export function typeMeta(t: IncidentType) {
  return INCIDENT_TYPES.find((i) => i.id === t) ?? INCIDENT_TYPES[INCIDENT_TYPES.length - 1];
}

export function typeLabel(t: IncidentType) {
  return typeMeta(t).label;
}

export function severityClass(s: IncidentSeverity): string {
  switch (s) {
    case "critical": return "bg-emergency text-emergency-foreground border-transparent";
    case "high": return "bg-warning text-warning-foreground border-transparent";
    case "medium": return "bg-info text-info-foreground border-transparent";
    case "low": return "bg-muted text-muted-foreground border-transparent";
  }
}

export function statusClass(s: IncidentStatus): string {
  switch (s) {
    case "new": return "bg-emergency/15 text-emergency border-transparent";
    case "acknowledged": return "bg-warning/15 text-warning border-transparent";
    case "in_progress": return "bg-info/15 text-info border-transparent";
    case "resolved": return "bg-success/15 text-success border-transparent";
  }
}

export function statusLabel(s: IncidentStatus): string {
  return { new: "New", acknowledged: "Acknowledged", in_progress: "In progress", resolved: "Resolved" }[s];
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const NEXT_STATUS: Record<IncidentStatus, IncidentStatus | null> = {
  new: "acknowledged",
  acknowledged: "in_progress",
  in_progress: "resolved",
  resolved: null,
};
