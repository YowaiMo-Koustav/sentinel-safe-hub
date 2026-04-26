import { useMemo, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/StatusChip";
import { useEvacuationPaths } from "@/hooks/useVenueData";
import { useP2PEvacuation } from "@/hooks/useP2PEvacuation";
import { RealisticEvacuationGenerator } from "@/services/realisticEvacuationGenerator";
import { corporateBuildingLayout } from "@/data/realisticEvacuationData";
import { ArrowDown, DoorOpen, MapPin, ShieldCheck, Loader2, Footprints, Users, Wifi, Share2, Clock, Building, AlertTriangle, Navigation } from "lucide-react";
import SimpleGuidedNavigation from "@/components/evacuation/SimpleGuidedNavigation";

const PATH_TONE: Record<string, { tone: "success" | "warning" | "emergency"; label: string }> = {
  clear: { tone: "success", label: "Clear" },
  partial: { tone: "warning", label: "Partial" },
  blocked: { tone: "emergency", label: "Blocked" },
};

const Evacuation = () => {
  const { paths, loading } = useEvacuationPaths();
  
  // Temporarily disable P2P to isolate loading issues
  const [isConnected] = useState(true);
  const [connectedPeers] = useState<string[]>([]);
  const [sharedRoutes] = useState<any[]>([]);
  const [peerCount] = useState(0);
  const [connectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('connected');
  
  // Guided navigation state
  const [showGuidedNavigation, setShowGuidedNavigation] = useState(false);
  
  const shareRoute = () => {};
  const shareRoutes = () => {};

  // Get building context for realistic display
  const buildingContext = useMemo(() => {
    const generator = new RealisticEvacuationGenerator(corporateBuildingLayout);
    return generator.getCurrentBuildingContext();
  }, []);

  // Recommend the first non-blocked path (or first path).
  const recommended = useMemo(() => {
    return paths.find((p) => p.status === "clear") ?? paths[0] ?? null;
  }, [paths]);

  const steps: string[] = useMemo(() => {
    if (!recommended) return [];
    const raw = recommended.steps;
    if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === "string");
    return [];
  }, [recommended]);

  // P2P sharing temporarily disabled for testing
  // useEffect(() => {
  //   if (paths.length > 0 && isConnected && peerCount > 0) {
  //     shareRoutes(paths);
  //   }
  // }, [paths, isConnected, peerCount, shareRoutes]);

  // useEffect(() => {
  //   if (recommended && isConnected && peerCount > 0) {
  //     shareRoute(recommended);
  //   }
  // }, [recommended, isConnected, peerCount, shareRoute]);

  // Combine local routes with shared routes
  const allRoutes = useMemo(() => {
    const combined = [...paths];
    
    // Add shared routes that aren't duplicates
    sharedRoutes.forEach(sharedRoute => {
      const exists = combined.some(route => route.id === sharedRoute.id);
      if (!exists) {
        combined.push(sharedRoute);
      }
    });
    
    return combined;
  }, [paths, sharedRoutes]);

  return (
    <div>
      <PageHeader
        eyebrow="Emergency evacuation system"
        title={`${buildingContext.name} - Evacuation Routes`}
        description={`Real-time evacuation routes for ${buildingContext.totalZones} zones across ${buildingContext.totalFloors} floors. Located at ${buildingContext.address}.`}
        actions={
          <div className="flex items-center gap-2">
            {/* P2P Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm font-medium">{peerCount} peers</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">Connecting...</span>
                </div>
              )}
            </div>
            {recommended && (
              <StatusChip label={`Route ${PATH_TONE[recommended.status].label.toLowerCase()}`} tone={PATH_TONE[recommended.status].tone} pulse />
            )}
          </div>
        }
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Building Information Card */}
        <Card className="shadow-card border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">{buildingContext.name}</h3>
                  <p className="text-sm text-blue-700">{buildingContext.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-blue-900">{buildingContext.totalFloors}</div>
                  <div className="text-blue-700">Floors</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-900">{buildingContext.totalZones}</div>
                  <div className="text-blue-700">Zones</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-900">{buildingContext.assemblyPoints.length}</div>
                  <div className="text-blue-700">Assembly Points</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !recommended ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center text-muted-foreground">
              No evacuation paths configured yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Realistic Building Map */}
            <Card className="overflow-hidden shadow-card lg:col-span-2">
              <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-slate-100 to-slate-200">
                <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" />
                    </pattern>
                  </defs>
                  <rect width="400" height="300" fill="url(#grid)" />
                  
                  {/* Building Layout - Corporate Tower Floor Plan */}
                  {/* Main Corridor */}
                  <rect x="50" y="140" width="300" height="20" fill="hsl(var(--muted) / 0.3)" stroke="hsl(var(--border))" />
                  <text x="200" y="153" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">Main Corridor</text>
                  
                  {/* Office Areas */}
                  <rect x="60" y="40" width="80" height="80" fill="hsl(var(--blue-50) / 0.5)" stroke="hsl(var(--blue-200))" />
                  <text x="100" y="75" textAnchor="middle" fontSize="7" fill="hsl(var(--blue-700))">Office 201</text>
                  
                  <rect x="260" y="40" width="80" height="80" fill="hsl(var(--blue-50) / 0.5)" stroke="hsl(var(--blue-200))" />
                  <text x="300" y="75" textAnchor="middle" fontSize="7" fill="hsl(var(--blue-700))">Office 202</text>
                  
                  {/* Meeting Room */}
                  <rect x="160" y="40" width="80" height="60" fill="hsl(var(--green-50) / 0.5)" stroke="hsl(var(--green-200))" />
                  <text x="200" y="68" textAnchor="middle" fontSize="7" fill="hsl(var(--green-700))">Meeting 205</text>
                  
                  {/* Break Room */}
                  <rect x="320" y="180" width="60" height="60" fill="hsl(var(--orange-50) / 0.5)" stroke="hsl(var(--orange-200))" />
                  <text x="350" y="208" textAnchor="middle" fontSize="7" fill="hsl(var(--orange-700))">Break</text>
                  
                  {/* Emergency Exits */}
                  <rect x="15" y="145" width="25" height="10" fill="hsl(var(--red-500) / 0.8)" stroke="hsl(var(--red-600))" />
                  <text x="27" y="152" textAnchor="middle" fontSize="6" fill="white">EXIT</text>
                  
                  <rect x="360" y="145" width="25" height="10" fill="hsl(var(--red-500) / 0.8)" stroke="hsl(var(--red-600))" />
                  <text x="372" y="152" textAnchor="middle" fontSize="6" fill="white">EXIT</text>
                  
                  {/* Stairwells */}
                  <rect x="15" y="40" width="20" height="30" fill="hsl(var(--amber-500) / 0.3)" stroke="hsl(var(--amber-600))" />
                  <text x="25" y="52" textAnchor="middle" fontSize="6" fill="hsl(var(--amber-700))">STAIR</text>
                  
                  <rect x="365" y="40" width="20" height="30" fill="hsl(var(--amber-500) / 0.3)" stroke="hsl(var(--amber-600))" />
                  <text x="375" y="52" textAnchor="middle" fontSize="6" fill="hsl(var(--amber-700))">STAIR</text>
                  
                  {/* Assembly Points (Outside) */}
                  <rect x="80" y="260" width="100" height="30" fill="hsl(var(--success) / 0.2)" stroke="hsl(var(--success))" strokeDasharray="3 2" />
                  <text x="130" y="278" textAnchor="middle" fontSize="7" fill="hsl(var(--success))">North Assembly</text>
                  
                  <rect x="220" y="260" width="100" height="30" fill="hsl(var(--success) / 0.2)" stroke="hsl(var(--success))" strokeDasharray="3 2" />
                  <text x="270" y="278" textAnchor="middle" fontSize="7" fill="hsl(var(--success))">South Assembly</text>
                  
                  {/* Evacuation Route Path */}
                  <path d="M 100 80 L 100 120 L 50 150 L 25 150 L 25 250 L 130 250 L 130 275"
                    fill="none" stroke="hsl(var(--destructive))" strokeWidth="3" strokeDasharray="8 4" />
                  
                  {/* Current Location */}
                  <circle cx="100" cy="80" r="8" fill="hsl(var(--info))" stroke="white" strokeWidth="2" />
                  <text x="100" y="84" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">YOU</text>
                  
                  {/* Destination */}
                  <circle cx="130" cy="275" r="8" fill="hsl(var(--success))" stroke="white" strokeWidth="2" />
                  <text x="130" y="279" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">A</text>
                </svg>
                
                <div className="absolute left-3 top-3 flex flex-col gap-2">
                  <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded">
                    <Navigation className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium">Your Location</span>
                  </div>
                  <div className="flex items-center gap-1 bg-green-100/90 px-2 py-1 rounded">
                    <MapPin className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium">Assembly Point</span>
                  </div>
                </div>
                
                <div className="absolute right-3 top-3 flex flex-col gap-2">
                  <div className="flex items-center gap-1 bg-red-100/90 px-2 py-1 rounded">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <span className="text-xs font-medium">Emergency Exit</span>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-100/90 px-2 py-1 rounded">
                    <DoorOpen className="h-3 w-3 text-amber-600" />
                    <span className="text-xs font-medium">Stairwell</span>
                  </div>
                </div>
              </div>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {recommended.from_zone} → {recommended.to_zone}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {recommended.estimated_seconds && (
                    <span><strong>~{Math.max(1, Math.round(recommended.estimated_seconds / 60))} min</strong> walk</span>
                  )}
                  <Badge variant="outline" className="capitalize">{recommended.status}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Steps */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Step-by-step</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      {i === 0 ? <DoorOpen className="h-4 w-4" /> : i === steps.length - 1 ? <Footprints className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{i + 1}. {s}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
                  <ShieldCheck className="h-4 w-4" />
                  Stay calm. Staff will meet you at the assembly point.
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setShowGuidedNavigation(true)}
                  disabled={!recommended}
                >
                  Start guided navigation
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Shared Routes from Other Devices */}
        {sharedRoutes.length > 0 && (
          <Card className="shadow-card border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-green-600" />
                  Routes from Other Devices
                </CardTitle>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {sharedRoutes.length} shared
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sharedRoutes.map((route) => {
                const tone = PATH_TONE[route.status];
                return (
                  <div key={`${route.id}-${route.sourceDeviceId}`} className="rounded-lg border bg-card p-3 relative">
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>Peer</span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2 pr-12">
                      <p className="text-sm font-semibold leading-tight">{route.name}</p>
                      <StatusChip label={tone.label} tone={tone.tone} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {route.from_zone} → {route.to_zone}
                      {route.estimated_seconds ? ` · ~${Math.round(route.estimated_seconds / 60)} min` : ""}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Received {Math.round((Date.now() - route.receivedAt) / 1000)}s ago</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Other paths */}
        {allRoutes.length > 1 && (
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-base">All evacuation paths</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allRoutes.map((p) => {
                const tone = PATH_TONE[p.status];
                return (
                  <div key={p.id} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">{p.name}</p>
                      <StatusChip label={tone.label} tone={tone.tone} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.from_zone} → {p.to_zone}
                      {p.estimated_seconds ? ` · ~${Math.round(p.estimated_seconds / 60)} min` : ""}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Guided Navigation Modal */}
        {showGuidedNavigation && recommended && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-4xl">
              <SimpleGuidedNavigation 
                evacuationPath={recommended}
                onClose={() => setShowGuidedNavigation(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Evacuation;
