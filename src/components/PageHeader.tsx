import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  className?: string;
}

export function PageHeader({ title, description, actions, eyebrow, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b bg-gradient-surface px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-8",
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
