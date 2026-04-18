import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  zone: string;
  room?: string | null;
  className?: string;
}

export function ZoneChip({ zone, room, className }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground", className)}>
      <MapPin className="h-3 w-3" />
      {zone}
      {room ? <span className="text-foreground/80">· {room}</span> : null}
    </span>
  );
}
