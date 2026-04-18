import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityDot } from "./SeverityDot";
import { ZoneChip } from "./ZoneChip";
import { typeMeta, statusClass, statusLabel, relativeTime, type IncidentRow } from "@/lib/incidents";
import { User as UserIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  incident: IncidentRow;
  onClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function IncidentCard({ incident, onClick, actions, className }: Props) {
  const meta = typeMeta(incident.type);
  const Icon = meta.icon;
  const interactive = !!onClick;

  return (
    <Card
      className={cn(
        "shadow-card transition-base",
        interactive && "cursor-pointer hover:-translate-y-0.5 hover:shadow-elegant",
        incident.severity === "critical" && incident.status !== "resolved" && "border-emergency/30",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", meta.tone)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold leading-tight">{meta.label}</p>
            <SeverityDot severity={incident.severity} />
            <Badge className={statusClass(incident.status)}>{statusLabel(incident.status)}</Badge>
            <Badge variant="outline" className="text-[10px] capitalize">{incident.source}</Badge>
          </div>
          {incident.note && <p className="line-clamp-2 text-sm text-muted-foreground">"{incident.note}"</p>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs text-muted-foreground">
            <ZoneChip zone={incident.zone} room={incident.room} />
            <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" /> {incident.reporter_name || "Anonymous"}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {relativeTime(incident.created_at)}</span>
            {incident.assigned_name && <span className="text-info">→ {incident.assigned_name}</span>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2 sm:items-start">{actions}</div>}
      </CardContent>
    </Card>
  );
}
