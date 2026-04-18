import { cn } from "@/lib/utils";

export interface FilterChip<T extends string> {
  id: T;
  label: string;
  count?: number;
  tone?: "default" | "emergency" | "warning" | "info" | "success";
}

interface Props<T extends string> {
  chips: FilterChip<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

const TONES: Record<NonNullable<FilterChip<string>["tone"]>, string> = {
  default: "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
  emergency: "data-[active=true]:bg-emergency data-[active=true]:text-emergency-foreground",
  warning: "data-[active=true]:bg-warning data-[active=true]:text-warning-foreground",
  info: "data-[active=true]:bg-info data-[active=true]:text-info-foreground",
  success: "data-[active=true]:bg-success data-[active=true]:text-success-foreground",
};

export function FilterChips<T extends string>({ chips, value, onChange, className }: Props<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          data-active={value === c.id}
          onClick={() => onChange(c.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-base hover:border-primary/40 hover:text-foreground",
            TONES[c.tone ?? "default"],
          )}
        >
          {c.label}
          {typeof c.count === "number" && (
            <span className="rounded-full bg-foreground/10 px-1.5 text-[10px] font-semibold">{c.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
