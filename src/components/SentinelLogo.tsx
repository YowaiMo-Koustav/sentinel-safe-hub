import { cn } from "@/lib/utils";
import { SentinelMark } from "./SentinelMark";

export function SentinelLogo({
  className,
  showText = true,
  inverted = false,
}: {
  className?: string;
  showText?: boolean;
  inverted?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <SentinelMark className="h-9 w-9 shadow-elegant rounded-xl" />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("text-base font-semibold tracking-tight", inverted && "text-primary-foreground")}>
            Sentinel
          </span>
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.18em]",
              inverted ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            Crisis Response
          </span>
        </div>
      )}
    </div>
  );
}
