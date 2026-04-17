import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type AppRole } from "@/lib/AuthContext";
import { ShieldCheck, User, Radio, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const meta: Record<AppRole, { tone: string; icon: typeof User }> = {
  admin:     { tone: "bg-primary text-primary-foreground border-transparent",           icon: Settings2 },
  responder: { tone: "bg-emergency text-emergency-foreground border-transparent",       icon: Radio },
  staff:     { tone: "bg-info text-info-foreground border-transparent",                 icon: ShieldCheck },
  guest:     { tone: "bg-muted text-muted-foreground border-transparent",               icon: User },
};

export function RoleBadge({ role, className }: { role: AppRole; className?: string }) {
  const m = meta[role];
  const Icon = m.icon;
  return (
    <Badge className={cn("gap-1.5 font-medium", m.tone, className)}>
      <Icon className="h-3 w-3" />
      {ROLE_LABELS[role]}
    </Badge>
  );
}
