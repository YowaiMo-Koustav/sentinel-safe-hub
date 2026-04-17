export type IncidentStatus = "active" | "dispatched" | "resolved";
export type IncidentType = "medical" | "fire" | "security" | "evacuation" | "other";
export type IncidentPriority = "critical" | "high" | "medium" | "low";

export interface Incident {
  id: string;
  type: IncidentType;
  priority: IncidentPriority;
  status: IncidentStatus;
  location: string;
  room?: string;
  reporter: string;
  reporterRole: "Guest" | "Staff" | "Sensor";
  description: string;
  createdAt: string;
  responders: string[];
  timeline: { time: string; event: string }[];
}

export const incidents: Incident[] = [
  {
    id: "INC-2041",
    type: "medical",
    priority: "critical",
    status: "active",
    location: "Tower A · Floor 14",
    room: "Room 1407",
    reporter: "Olivia Carter",
    reporterRole: "Guest",
    description: "Guest reports chest pain and shortness of breath. Conscious.",
    createdAt: "2 min ago",
    responders: ["Dr. M. Singh", "Security · J. Reyes"],
    timeline: [
      { time: "12:42", event: "SOS triggered from Room 1407" },
      { time: "12:42", event: "Auto-dispatch to on-site medic" },
      { time: "12:43", event: "Dr. M. Singh acknowledged · ETA 90s" },
    ],
  },
  {
    id: "INC-2039",
    type: "fire",
    priority: "high",
    status: "dispatched",
    location: "Kitchen · Level B1",
    reporter: "Smoke Sensor #B1-07",
    reporterRole: "Sensor",
    description: "Smoke detector triggered in main kitchen exhaust line.",
    createdAt: "11 min ago",
    responders: ["Fire Marshal · K. Owens"],
    timeline: [
      { time: "12:33", event: "Smoke level exceeded threshold" },
      { time: "12:34", event: "Kitchen staff confirmed grease flare" },
      { time: "12:36", event: "Suppression engaged · area ventilated" },
    ],
  },
  {
    id: "INC-2034",
    type: "security",
    priority: "medium",
    status: "dispatched",
    location: "Lobby · Main Entrance",
    reporter: "Front Desk · A. Lin",
    reporterRole: "Staff",
    description: "Unattended bag near concierge desk for over 8 minutes.",
    createdAt: "24 min ago",
    responders: ["Security · J. Reyes"],
    timeline: [
      { time: "12:20", event: "Reported by front desk" },
      { time: "12:22", event: "Security en route" },
    ],
  },
  {
    id: "INC-2028",
    type: "medical",
    priority: "low",
    status: "resolved",
    location: "Pool Deck",
    reporter: "Lifeguard · P. Nair",
    reporterRole: "Staff",
    description: "Minor laceration treated on site. Guest declined transport.",
    createdAt: "1 h ago",
    responders: ["Medic · R. Hale"],
    timeline: [
      { time: "11:42", event: "Reported" },
      { time: "11:48", event: "Treated and resolved" },
    ],
  },
];

export const venueStats = {
  occupancy: 412,
  staffOnDuty: 38,
  respondersAvailable: 6,
  sensorsOnline: 184,
};

export const responders = [
  { name: "Dr. M. Singh", role: "On-site Medic", status: "engaged", location: "En route · Tower A" },
  { name: "J. Reyes", role: "Security Lead", status: "engaged", location: "Lobby" },
  { name: "K. Owens", role: "Fire Marshal", status: "engaged", location: "Kitchen B1" },
  { name: "R. Hale", role: "Medic", status: "available", location: "Clinic · L2" },
  { name: "T. Mensah", role: "Security", status: "available", location: "Tower B · L8" },
  { name: "S. Kobayashi", role: "Floor Captain", status: "available", location: "Tower A · L10" },
];

export function priorityColor(p: IncidentPriority) {
  return {
    critical: "bg-emergency text-emergency-foreground",
    high: "bg-warning text-warning-foreground",
    medium: "bg-info text-info-foreground",
    low: "bg-muted text-muted-foreground",
  }[p];
}

export function statusColor(s: IncidentStatus) {
  return {
    active: "bg-emergency text-emergency-foreground",
    dispatched: "bg-warning text-warning-foreground",
    resolved: "bg-success text-success-foreground",
  }[s];
}
