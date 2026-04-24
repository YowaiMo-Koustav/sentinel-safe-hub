import { IncidentRow } from '@/lib/incidents';
import { EvacuationPath } from '@/hooks/useVenueData';

export interface HazardZone {
  id: string;
  zoneName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  affectedAreas: string[];
  blockedExits: string[];
  timestamp: number;
}

export interface SafeRoute {
  path: EvacuationPath;
  safetyScore: number;
  estimatedTime: number;
  hazards: string[];
  alternativePaths: SafeRoute[];
}

export class DynamicRoutingService {
  private activeIncidents: IncidentRow[] = [];
  private hazardZones: Map<string, HazardZone> = new Map();
  private routingCallbacks: ((routes: SafeRoute[]) => void)[] = [];

  // Update active incidents and recalculate routes
  updateIncidents(incidents: IncidentRow[]): void {
    this.activeIncidents = incidents.filter(i => 
      i.status !== 'resolved' && ['critical', 'high'].includes(i.severity)
    );
    
    this.calculateHazardZones();
    this.notifyRoutingUpdate();
  }

  private calculateHazardZones(): void {
    this.hazardZones.clear();

    this.activeIncidents.forEach(incident => {
      const hazard: HazardZone = {
        id: incident.id,
        zoneName: incident.zone,
        severity: incident.severity as HazardZone['severity'],
        type: incident.type,
        affectedAreas: this.getAffectedAreas(incident),
        blockedExits: this.getBlockedExits(incident),
        timestamp: new Date(incident.created_at).getTime()
      };

      this.hazardZones.set(incident.id, hazard);
    });
  }

  private getAffectedAreas(incident: IncidentRow): string[] {
    // Logic to determine which areas are affected by an incident
    const affected = [incident.zone];
    
    // Add adjacent zones based on incident type
    if (incident.type === 'smoke_fire') {
      // Fire affects adjacent areas
      const adjacentZones = this.getAdjacentZones(incident.zone);
      affected.push(...adjacentZones);
    }
    
    if (incident.type === 'crowd_surge') {
      // Crowd surge affects the immediate zone
      affected.push(incident.zone);
    }

    return affected;
  }

  private getBlockedExits(incident: IncidentRow): string[] {
    // Determine which exits are blocked by this incident
    const blocked: string[] = [];
    
    if (incident.type === 'smoke_fire') {
      // Fire blocks exits in the affected zone
      blocked.push(`${incident.zone} - Main Exit`);
      blocked.push(`${incident.zone} - Emergency Exit`);
    }
    
    if (incident.type === 'blocked_exit') {
      // This is explicitly a blocked exit
      blocked.push(`${incident.zone} - ${incident.room || 'Unknown Exit'}`);
    }

    return blocked;
  }

  private getAdjacentZones(zone: string): string[] {
    // Simplified adjacency mapping - in production this would be based on actual building layout
    const adjacencyMap: Record<string, string[]> = {
      'Tower A · Lobby': ['Tower A · Rooms', 'Restaurant'],
      'Tower A · Rooms': ['Tower A · Lobby'],
      'Tower B · Lobby': ['Tower B · Rooms', 'Conference hall'],
      'Tower B · Rooms': ['Tower B · Lobby'],
      'Restaurant': ['Tower A · Lobby'],
      'Conference hall': ['Tower B · Lobby'],
      'Pool deck': ['Parking'],
      'Parking': ['Pool deck', 'Back of house'],
      'Back of house': ['Parking', 'Restaurant']
    };

    return adjacencyMap[zone] || [];
  }

  // Calculate safe routes from a given location
  calculateSafeRoutes(fromZone: string, allPaths: EvacuationPath[]): SafeRoute[] {
    const safeRoutes: SafeRoute[] = [];

    allPaths.forEach(path => {
      if (path.from_zone === fromZone) {
        const safetyScore = this.calculateSafetyScore(path);
        const hazards = this.getRouteHazards(path);
        const estimatedTime = this.calculateEstimatedTime(path, hazards);

        safeRoutes.push({
          path,
          safetyScore,
          estimatedTime,
          hazards,
          alternativePaths: []
        });
      }
    });

    // Sort by safety score (highest first) and then by time (fastest first)
    return safeRoutes.sort((a, b) => {
      if (b.safetyScore !== a.safetyScore) {
        return b.safetyScore - a.safetyScore;
      }
      return a.estimatedTime - b.estimatedTime;
    });
  }

  private calculateSafetyScore(path: EvacuationPath): number {
    let score = 100; // Start with perfect score

    // Deduct points for hazards along the route
    this.hazardZones.forEach(hazard => {
      if (this.routePassesThroughZone(path, hazard.zoneName)) {
        switch (hazard.severity) {
          case 'critical':
            score -= 80;
            break;
          case 'high':
            score -= 50;
            break;
          case 'medium':
            score -= 25;
            break;
          case 'low':
            score -= 10;
            break;
        }
      }
    });

    // Additional deductions for blocked exits
    const blockedExits = this.getBlockedExitsForPath(path);
    score -= blockedExits.length * 30;

    return Math.max(0, score);
  }

  private routePassesThroughZone(path: EvacuationPath, zone: string): boolean {
    // Check if the route steps mention this zone
    if (path.from_zone === zone || path.to_zone === zone) {
      return true;
    }

    // Check steps array for zone mentions
    if (Array.isArray(path.steps)) {
      return path.steps.some(step => 
        typeof step === 'string' && step.toLowerCase().includes(zone.toLowerCase())
      );
    }

    return false;
  }

  private getRouteHazards(path: EvacuationPath): string[] {
    const hazards: string[] = [];

    this.hazardZones.forEach(hazard => {
      if (this.routePassesThroughZone(path, hazard.zoneName)) {
        hazards.push(`${hazard.type} in ${hazard.zoneName} (${hazard.severity})`);
      }
    });

    return hazards;
  }

  private getBlockedExitsForPath(path: EvacuationPath): string[] {
    const blocked: string[] = [];

    this.hazardZones.forEach(hazard => {
      blocked.push(...hazard.blockedExits);
    });

    return blocked.filter(exit => 
      exit.includes(path.from_zone) || exit.includes(path.to_zone)
    );
  }

  private calculateEstimatedTime(path: EvacuationPath, hazards: string[]): number {
    let baseTime = path.estimated_seconds || 120; // Default 2 minutes

    // Add time for hazards
    hazards.forEach(hazard => {
      if (hazard.includes('critical')) baseTime *= 2;
      else if (hazard.includes('high')) baseTime *= 1.5;
      else if (hazard.includes('medium')) baseTime *= 1.2;
    });

    return Math.round(baseTime);
  }

  // Get the best route for a given location
  getBestRoute(fromZone: string, allPaths: EvacuationPath[]): SafeRoute | null {
    const routes = this.calculateSafeRoutes(fromZone, allPaths);
    return routes.length > 0 ? routes[0] : null;
  }

  // Check if a path is currently safe
  isPathSafe(path: EvacuationPath): boolean {
    const safetyScore = this.calculateSafetyScore(path);
    return safetyScore >= 50; // Consider 50+ as safe
  }

  // Update path status based on current hazards
  updatePathStatus(path: EvacuationPath): 'clear' | 'partial' | 'blocked' {
    const safetyScore = this.calculateSafetyScore(path);
    
    if (safetyScore >= 80) return 'clear';
    if (safetyScore >= 50) return 'partial';
    return 'blocked';
  }

  // Subscribe to routing updates
  onRoutingUpdate(callback: (routes: SafeRoute[]) => void): void {
    this.routingCallbacks.push(callback);
  }

  private notifyRoutingUpdate(): void {
    // This would typically send updated routes to all subscribers
    this.routingCallbacks.forEach(callback => {
      // For now, we'll just call the callback with empty array
      // In production, this would send actual route updates
      callback([]);
    });
  }

  // Get current hazard zones
  getHazardZones(): HazardZone[] {
    return Array.from(this.hazardZones.values());
  }

  // Get system status for dynamic routing
  getSystemStatus(): {
    activeIncidents: number;
    hazardZones: number;
    safePaths: number;
    blockedPaths: number;
  } {
    const totalPaths = 0; // This would come from actual paths data
    const blockedPaths = 0; // Calculate based on current hazards

    return {
      activeIncidents: this.activeIncidents.length,
      hazardZones: this.hazardZones.size,
      safePaths: totalPaths - blockedPaths,
      blockedPaths
    };
  }
}

// Singleton instance
export const dynamicRouting = new DynamicRoutingService();
