import { relativeTime, statusClass, statusLabel, type IncidentRow } from "@/lib/incidents";
import type { IncidentUpdate } from "@/hooks/useVenueData";
import { Badge } from "@/components/ui/badge";
import { Siren, CheckCircle2, MessageSquare, ArrowRightCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  incident: IncidentRow;
  updates: IncidentUpdate[];
}

export function StatusTimeline({ incident, updates }: Props) {
  const items: {
    time: string;
    title: string;
    subtitle?: string;
    icon: typeof Siren;
    tone: "primary" | "warning" | "info" | "success";
    badge?: React.ReactNode;
  }[] = [];

  items.push({
    time: relativeTime(incident.created_at),
    title: "Incident reported",
    subtitle: `${incident.reporter_name || "Anonymous"} · ${incident.source}`,
    icon: Siren,
    tone: "primary",
  });

  for (const u of updates) {
    items.push({
      time: relativeTime(u.created_at),
      title: u.message || "Status update",
      subtitle: u.actor_name ? `${u.actor_name}` : undefined,
      icon: MessageSquare,
      tone: "info",
    });
  }

  if (incident.resolved_at) {
    items.push({
      time: relativeTime(incident.resolved_at),
      title: "Incident resolved",
      icon: CheckCircle2,
      tone: "success",
    });
  }

  const TONE: Record<typeof items[number]["tone"], string> = {
    primary: "bg-primary text-primary-foreground",
    warning: "bg-warning text-warning-foreground",
    info: "bg-info text-info-foreground",
    success: "bg-success text-success-foreground",
  };

  return (
    <ol className="relative space-y-5 border-l-2 border-border pl-7">
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <li key={i} className="relative">
            <span className={cn("absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background", TONE[it.tone])}>
              <Icon className="h-3 w-3" />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{it.title}</p>
              {it.badge}
            </div>
            <p className="text-xs text-muted-foreground">{it.time}{it.subtitle ? ` · ${it.subtitle}` : ""}</p>
          </li>
        );
      })}
    </ol>
  );
}
