import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusChipProps {
  label: string;
  tone?: "emergency" | "warning" | "success" | "info" | "muted";
  pulse?: boolean;
  className?: string;
}

const toneClass: Record<NonNullable<StatusChipProps["tone"]>, string> = {
  emergency: "bg-emergency text-emergency-foreground border-transparent",
  warning: "bg-warning text-warning-foreground border-transparent",
  success: "bg-success text-success-foreground border-transparent",
  info: "bg-info text-info-foreground border-transparent",
  muted: "bg-muted text-muted-foreground border-transparent",
};

export function StatusChip({ label, tone = "muted", pulse, className }: StatusChipProps) {
  return (
    <Badge className={cn("gap-1.5 font-medium", toneClass[tone], className)}>
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80",
          pulse && "animate-pulse",
        )}
      />
      {label}
    </Badge>
  );
}
