import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Route, ShieldCheck, Clock, Zap, Activity } from 'lucide-react';
import { dynamicRouting, type SafeRoute, type HazardZone } from '@/services/dynamicRouting';
import { useIncidents } from '@/hooks/useIncidents';
import { useEvacuationPaths } from '@/hooks/useVenueData';
import { toast } from 'sonner';

export function DynamicRoutingPanel() {
  const { incidents } = useIncidents();
  const { paths, dynamicPaths } = useEvacuationPaths();
  const [safeRoutes, setSafeRoutes] = useState<SafeRoute[]>([]);
  const [hazardZones, setHazardZones] = useState<HazardZone[]>([]);
  const [selectedZone, setSelectedZone] = useState('Tower A · Rooms');

  useEffect(() => {
    // Update routing service with current incidents
    dynamicRouting.updateIncidents(incidents);
    
    // Calculate safe routes for selected zone
    const routes = dynamicRouting.calculateSafeRoutes(selectedZone, dynamicPaths);
    setSafeRoutes(routes);
    
    // Get current hazard zones
    setHazardZones(dynamicRouting.getHazardZones());
  }, [incidents, dynamicPaths, selectedZone]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-emergency text-emergency-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-info text-info-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-emergency';
  };

  const getSafetyLabel = (score: number) => {
    if (score >= 80) return 'Safe';
    if (score >= 50) return 'Caution';
    return 'Dangerous';
  };

  const simulateIncident = () => {
    // Simulate a new incident for testing
    const mockIncident = {
      id: `sim-${Date.now()}`,
      type: 'smoke_fire' as const,
      severity: 'critical' as const,
      status: 'new' as const,
      zone: selectedZone,
      room: 'Corridor B',
      created_at: new Date().toISOString(),
      reporter_id: 'system',
      reporter_name: 'AI Detection',
      source: 'system' as const,
      note: 'Simulated fire incident for testing dynamic routing'
    };

    // This would normally be handled by the incidents hook
    toast.warning('Simulated incident created', {
      description: `Fire detected in ${selectedZone}`
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Route className="h-4 w-4" />
          Dynamic Routing
        </CardTitle>
        <div className="flex items-center gap-2">
          <StatusChip 
            label={`${hazardZones.length} hazards`} 
            tone={hazardZones.length > 0 ? "warning" : "success"}
            pulse={hazardZones.length > 0}
          />
          <Button size="sm" variant="outline" onClick={simulateIncident}>
            <Zap className="h-4 w-4 mr-2" />
            Test
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone Selection */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Zone:</label>
          <select 
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            aria-label="Select zone for evacuation routing"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="Tower A · Lobby">Tower A · Lobby</option>
            <option value="Tower A · Rooms">Tower A · Rooms</option>
            <option value="Tower B · Lobby">Tower B · Lobby</option>
            <option value="Tower B · Rooms">Tower B · Rooms</option>
            <option value="Pool deck">Pool deck</option>
            <option value="Conference hall">Conference hall</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Parking">Parking</option>
          </select>
        </div>

        {/* Hazard Zones */}
        {hazardZones.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Active Hazards
            </h4>
            <div className="space-y-2">
              {hazardZones.map((hazard) => (
                <div key={hazard.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(hazard.severity)}>
                      {hazard.severity}
                    </Badge>
                    <span className="text-sm">{hazard.type}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hazard.zoneName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safe Routes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Available Routes from {selectedZone}
          </h4>
          
          {safeRoutes.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No safe routes available</p>
              <p className="text-xs">All evacuation paths may be compromised</p>
            </div>
          ) : (
            <div className="space-y-2">
              {safeRoutes.map((route, index) => (
                <div key={route.path.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Route {index + 1}
                      </Badge>
                      <StatusChip 
                        label={getSafetyLabel(route.safetyScore)}
                        tone={route.safetyScore >= 80 ? "success" : route.safetyScore >= 50 ? "warning" : "emergency"}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      ~{Math.round(route.estimatedTime / 60)}min
                    </div>
                  </div>
                  
                  <div className="text-sm font-medium mb-1">
                    {route.path.from_zone} &rarr; {route.path.to_zone}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Safety: {route.safetyScore}%
                    </div>
                    <div className={`text-xs font-medium ${getSafetyColor(route.safetyScore)}`}>
                      {route.safetyScore >= 80 ? 'Recommended' : 
                       route.safetyScore >= 50 ? 'Use if necessary' : 'Avoid if possible'}
                    </div>
                  </div>

                  {route.hazards.length > 0 && (
                    <div className="mt-2 text-xs text-warning">
                      <Activity className="h-3 w-3 inline mr-1" />
                      Hazards: {route.hazards.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-success">
              {safeRoutes.filter(r => r.safetyScore >= 80).length}
            </div>
            <div className="text-xs text-muted-foreground">Safe routes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-warning">
              {safeRoutes.filter(r => r.safetyScore < 50).length}
            </div>
            <div className="text-xs text-muted-foreground">Dangerous routes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
