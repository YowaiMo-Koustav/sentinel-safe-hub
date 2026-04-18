import { cn } from "@/lib/utils";
import type { IncidentSeverity } from "@/lib/incidents";

const TONE: Record<IncidentSeverity, string> = {
  critical: "bg-emergency text-emergency",
  high: "bg-warning text-warning",
  medium: "bg-info text-info",
  low: "bg-muted-foreground text-muted-foreground",
};

const LABEL: Record<IncidentSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface Props {
  severity: IncidentSeverity;
  showLabel?: boolean;
  className?: string;
}

export function SeverityDot({ severity, showLabel = true, className }: Props) {
  const [bg, text] = TONE[severity].split(" ");
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", text, className)}>
      <span className={cn("inline-block h-2 w-2 rounded-full", bg, severity === "critical" && "animate-pulse")} />
      {showLabel && LABEL[severity]}
    </span>
  );
}
