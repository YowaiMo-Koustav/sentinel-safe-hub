import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function SentinelLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-emergency shadow-emergency">
        <Shield className="h-5 w-5 text-emergency-foreground" strokeWidth={2.5} />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight">Sentinel</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Crisis Response</span>
        </div>
      )}
    </div>
  );
}
