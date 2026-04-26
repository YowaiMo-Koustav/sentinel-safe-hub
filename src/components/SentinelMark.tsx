import { cn } from "@/lib/utils";

/**
 * Sentinel mark — radar-style watchful eye:
 *  • outer rounded squircle in deep navy with subtle inner gradient
 *  • concentric radar arcs sweeping from a center pulse
 *  • emergency dot in the corner signalling active monitoring
 */
export function SentinelMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-9 w-9", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sentinel-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(222 60% 28%)" />
          <stop offset="100%" stopColor="hsl(222 47% 14%)" />
        </linearGradient>
        <radialGradient id="sentinel-pulse" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(199 89% 60%)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="hsl(199 89% 48%)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* squircle */}
      <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#sentinel-bg)" />

      {/* radar arcs */}
      <circle cx="20" cy="21" r="11" fill="none" stroke="hsl(199 89% 55%)" strokeOpacity="0.25" strokeWidth="1.2" />
      <circle cx="20" cy="21" r="7"  fill="none" stroke="hsl(199 89% 60%)" strokeOpacity="0.45" strokeWidth="1.2" />
      <circle cx="20" cy="21" r="3.2" fill="url(#sentinel-pulse)" />
      <circle cx="20" cy="21" r="1.8" fill="hsl(0 0% 100%)" />

      {/* sweeping wedge */}
      <path
        d="M20 21 L33 14 A14 14 0 0 0 28 9 Z"
        fill="hsl(199 89% 55%)"
        fillOpacity="0.35"
      />

      {/* alert dot */}
      <circle cx="31" cy="9" r="3.2" fill="hsl(0 84% 58%)" />
      <circle cx="31" cy="9" r="3.2" fill="none" stroke="hsl(0 0% 100%)" strokeOpacity="0.85" strokeWidth="0.8" />
    </svg>
  );
}
