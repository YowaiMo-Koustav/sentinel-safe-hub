# Plan — UI cleanup, Leaflet maps, UX polish

## 1. Remove the "Try demo" / launch buttons

**Landing page (`src/pages/Landing.tsx`)**
- Remove the top-right header `Try demo` button (keep only `Sign in`).
- Remove the hero CTA `Launch live demo` button. Replace with a single primary `Sign in` action plus the secondary `See how it works` anchor.
- In the "Built for" section, remove both `Launch demo` and `Try guest SOS` buttons. Replace with a single `Sign in` CTA.

**App header (`src/components/AppLayout.tsx`)**
- The top header currently always shows a red `Emergency SOS` button. Keep it visible only for the `guest` role (it functions as their primary action). For staff/responder/admin, remove it from the header — they reach SOS via the sidebar.

## 2. Replace SVG floor-plan with real Leaflet maps

**Add dependencies**: `leaflet`, `react-leaflet`, `@types/leaflet`.

**New shared component** `src/components/maps/VenueMap.tsx`
- Wraps `MapContainer` from `react-leaflet` with OpenStreetMap tiles.
- Props: `center`, `zoom`, `zones[]` (markers with status color), `route?` (polyline of lat/lng), `assemblyPoint?`, `incidents?` (markers with severity color + popup).
- Uses divIcon styled with our design tokens (emergency / warning / success) so markers match the brand instead of default Leaflet pins (which require static asset config).
- Includes a small legend overlay (You / Assembly / Active incident / Blocked path).

**Coordinate data** `src/lib/venueGeo.ts`
- Hardcoded believable lat/lng for the demo venue ("Aurora Grand"), e.g. centered on a real address. Map zone names → lat/lng so existing zone strings keep working.
- Define the assembly point and a couple of route polylines (clear / partial / blocked) tied to evacuation_paths rows by `from_zone` → `to_zone`.

**Wire into pages**
- `src/pages/Evacuation.tsx`: replace the inline `<svg>` floor-plan block with `<VenueMap>` showing the recommended route as a colored polyline (green=clear, amber=partial, red=blocked), the user's zone marker, and the assembly point. Keep the step-by-step card next to it.
- `src/pages/StaffDashboard.tsx`: add a new "Live venue map" card above the incidents list showing markers for every active incident, color-coded by severity, with popups linking to `/incidents/:id`. This replaces the need for the heavy AI/Mesh/Routing/Sensor panels dominating the page (we'll keep them but collapse below the map — see §3).
- `src/pages/IncidentDetail.tsx`: add a small map card pinpointing the incident's zone.

**Leaflet CSS**: import `leaflet/dist/leaflet.css` once in `src/main.tsx`.

## 3. UI / UX enhancements

**Global**
- Add a subtle dark-mode toggle in the header (sun/moon button) — design tokens already support `.dark`, just need a `ThemeProvider` using `localStorage`.
- Tighten header: keep `Aurora Grand · Online` chip, role badge, theme toggle, sign-out moved here as an icon button (currently only in the sidebar footer, easy to miss when collapsed).

**Landing page**
- Add a small "trust strip" under the hero: 3 logos / labels (e.g. "ISO 27001 ready", "GDPR aligned", "WCAG 2.1 AA") for credibility.
- Add a screenshot/preview mockup card in the hero (simple framed image of the staff dashboard) instead of leaving the right side empty.
- Smoother scroll behavior + section reveal animations using existing `animate-fade-in-up` on intersection.

**Staff dashboard**
- Reorder for clarity: SystemStatusStrip → KPIs → **Live venue map** → Incidents list. Move AI / Mesh / Routing / Sensor panels into a collapsible "Operations telemetry" `<Accordion>` so the primary signal (incidents on the map) leads.
- Add a "Sort by severity / time" toggle on the incidents list.
- Make incident rows show a leading severity dot + faint pulsing border for `new` critical alerts.

**Guest SOS**
- Add a one-tap "I'm safe" check-in card under the type picker (creates a low-severity status update so staff see proactive check-ins).
- After submission, show an animated ETA estimate ("Responder ~2 min away") and a `View live status` button that links to a simple guest-scoped status view (reuse the recent-alerts row, expanded).

**Evacuation**
- Add "Voice guidance" toggle that uses `speechSynthesis` to read out the next step.
- Show a directional compass arrow at the top using device orientation (graceful no-op on unsupported devices).

**Responder view**
- Add a "Show on map" button per incident that opens the Evacuation map pre-routed to that incident's zone.

**Settings (admin)**
- Add a "Map center" form (lat/lng + zoom) so admins can re-anchor the venue map without code changes (stored in `system_status` as JSON or a new `venue_settings` row — using existing `system_status` keeps the migration small; if needed we'll add columns `map_lat`, `map_lng`, `map_zoom`).

## Technical details

- Leaflet markers: use `L.divIcon` with Tailwind classes (`bg-emergency`, `ring-2`, etc.) to avoid bundling default marker PNGs.
- `react-leaflet` v4 requires React 18 (already on it).
- Dark mode: use a tile provider that has both light + dark variants (CartoDB Voyager + DarkMatter) and switch based on `document.documentElement.classList.contains('dark')`.
- Voice guidance & device orientation are progressive enhancements — feature-detect, no errors on unsupported browsers.
- One small migration if we add map config columns to `system_status`. Otherwise no schema changes.

## Out of scope
- No changes to auth, RLS, or the incident state machine.
- No real geolocation tracking of guests — we use their selected zone's coordinates.
