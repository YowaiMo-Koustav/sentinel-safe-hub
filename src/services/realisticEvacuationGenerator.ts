import { BuildingLayout, BuildingZone, RealisticEvacuationRoute, corporateBuildingLayout, hospitalBuildingLayout, shoppingMallLayout } from '@/data/realisticEvacuationData';
import { EvacuationPath } from '@/lib/api';

export class RealisticEvacuationGenerator {
  private buildingLayout: BuildingLayout;

  constructor(buildingLayout: BuildingLayout) {
    this.buildingLayout = buildingLayout;
  }

  // Generate realistic evacuation routes for all zones in the building
  public generateAllEvacuationRoutes(): EvacuationPath[] {
    const routes: EvacuationPath[] = [];
    
    // Get all zones from all floors
    const allZones: BuildingZone[] = [];
    Object.values(this.buildingLayout.floorPlans).forEach(floorPlan => {
      allZones.push(...floorPlan.zones);
    });

    // Get all assembly points
    const assemblyPoints: BuildingZone[] = [];
    Object.values(this.buildingLayout.floorPlans).forEach(floorPlan => {
      assemblyPoints.push(...floorPlan.assemblyPoints);
    });

    // Generate routes from each zone to each assembly point
    allZones.forEach(zone => {
      assemblyPoints.forEach(assemblyPoint => {
        const realisticRoute = this.generateRealisticRoute(zone, assemblyPoint);
        const evacuationPath = this.convertToEvacuationPath(realisticRoute);
        routes.push(evacuationPath);
      });
    });

    return routes;
  }

  // Generate a single realistic evacuation route
  private generateRealisticRoute(fromZone: BuildingZone, toAssemblyPoint: BuildingZone): RealisticEvacuationRoute {
    const primaryPath = this.generateDetailedPath(fromZone, toAssemblyPoint);
    const alternativePath = this.generateAlternativePath(fromZone, toAssemblyPoint);
    const distance = this.calculateDistance(fromZone.coordinates, toAssemblyPoint.coordinates);
    const estimatedTime = this.calculateEstimatedTime(distance, fromZone.zoneType);
    const difficulty = this.assessDifficulty(fromZone, toAssemblyPoint);
    const obstacles = this.identifyObstacles(fromZone, toAssemblyPoint);
    const accessibilityFeatures = this.identifyAccessibilityFeatures(fromZone, toAssemblyPoint);
    const hazards = this.identifyPotentialHazards(fromZone, toAssemblyPoint);
    const clearanceWidth = this.calculateClearanceWidth(fromZone);
    const maxOccupancy = this.calculateMaxOccupancy(fromZone, toAssemblyPoint);

    // Determine route status based on current conditions
    const status = this.determineRouteStatus(fromZone, toAssemblyPoint, obstacles, hazards);

    return {
      id: `route-${fromZone.id}-${toAssemblyPoint.id}`,
      name: `${fromZone.name} → ${toAssemblyPoint.name}`,
      fromZone: fromZone,
      toAssemblyPoint: toAssemblyPoint,
      primaryPath,
      alternativePath,
      estimatedDistance: distance,
      estimatedTime: estimatedTime,
      difficulty,
      obstacles,
      accessibilityFeatures,
      hazards,
      lastInspected: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random inspection within last 30 days
      status,
      clearanceWidth,
      maxOccupancy
    };
  }

  // Generate detailed step-by-step path
  private generateDetailedPath(fromZone: BuildingZone, toAssemblyPoint: BuildingZone): string[] {
    const path: string[] = [];
    const floorDiff = fromZone.floor - toAssemblyPoint.floor;
    
    // Starting instructions
    path.push(`Evacuate ${fromZone.name} immediately`);
    
    // Room/area specific instructions
    if (fromZone.roomNumber) {
      path.push(`Exit Room ${fromZone.roomNumber} and proceed to corridor`);
    } else {
      path.push(`Exit ${fromZone.name} and proceed to main corridor`);
    }

    // Floor-specific navigation
    if (fromZone.floor > 0) {
      // Need to go downstairs
      if (floorDiff > 0) {
        const nearestStairwell = this.findNearestStairwell(fromZone);
        path.push(`Proceed to ${nearestStairwell.name}`);
        path.push(`Take stairs down ${floorDiff} floor${floorDiff > 1 ? 's' : ''} to ground level`);
        
        if (fromZone.zoneType === 'laboratory' || fromZone.zoneType === 'storage') {
          path.push('Ensure all hazardous materials are secured before leaving');
        }
      }
    }

    // Ground floor navigation to assembly point
    if (toAssemblyPoint.zoneType === 'assembly') {
      path.push(`Exit building through nearest emergency exit`);
      path.push(`Proceed to ${toAssemblyPoint.name}`);
      path.push('Check in with evacuation coordinator');
      
      if (toAssemblyPoint.name.includes('Parking')) {
        path.push('Move to designated parking area, keep access roads clear');
      } else {
        path.push('Stay in designated assembly area until further notice');
      }
    }

    // Safety instructions based on zone type
    if (fromZone.zoneType === 'cafeteria') {
      path.splice(path.length - 2, 0, 'Turn off kitchen equipment if safe to do so');
    }
    
    if (fromZone.zoneType === 'laboratory') {
      path.splice(1, 0, 'Secure all experiments and equipment');
    }

    // Final safety reminders
    path.push('Do not use elevators during emergency');
    path.push('Assist others who may need help evacuating');
    path.push('Move quickly but calmly - do not run');

    return path;
  }

  // Generate alternative path
  private generateAlternativePath(fromZone: BuildingZone, toAssemblyPoint: BuildingZone): string[] | undefined {
    // Only provide alternative if there are multiple exits
    const floorPlan = this.buildingLayout.floorPlans[fromZone.floor];
    if (floorPlan && floorPlan.emergencyExits.length > 1) {
      const alternativeExit = floorPlan.emergencyExits.find(exit => 
        exit.name !== this.findNearestStairwell(fromZone).name
      );
      
      if (alternativeExit) {
        const path: string[] = [];
        path.push(`Evacuate ${fromZone.name} via alternative route`);
        path.push(`Proceed to ${alternativeExit.name}`);
        path.push(`Exit through ${alternativeExit.name}`);
        path.push(`Follow exterior path to ${toAssemblyPoint.name}`);
        return path;
      }
    }
    return undefined;
  }

  // Find nearest emergency exit or stairwell
  private findNearestStairwell(zone: BuildingZone): { name: string; coordinates: { x: number; y: number } } {
    const floorPlan = this.buildingLayout.floorPlans[zone.floor];
    if (!floorPlan) {
      return { name: 'Main Exit', coordinates: { x: 50, y: 10 } };
    }

    let nearestExit = floorPlan.emergencyExits[0];
    let minDistance = this.calculateDistance(zone.coordinates, nearestExit.coordinates);

    floorPlan.emergencyExits.forEach(exit => {
      const distance = this.calculateDistance(zone.coordinates, exit.coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        nearestExit = exit;
      }
    });

    return nearestExit;
  }

  // Calculate distance between two points
  private calculateDistance(from: { x: number; y: number }, to: { x: number; y: number }): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.sqrt(dx * dx + dy * dy) * 2; // Convert to meters (assuming each unit = 2 meters)
  }

  // Calculate estimated time based on distance and zone type
  private calculateEstimatedTime(distance: number, zoneType: string): number {
    const baseSpeed = 1.2; // meters per second (average walking speed during evacuation)
    
    let speedModifier = 1.0;
    switch (zoneType) {
      case 'laboratory':
      case 'storage':
        speedModifier = 0.8; // Slower due to equipment/hazards
        break;
      case 'cafeteria':
        speedModifier = 0.9; // Slightly slower due to crowd density
        break;
      case 'office':
        speedModifier = 1.1; // Faster due to clear pathways
        break;
    }

    const baseTime = (distance / (baseSpeed * speedModifier));
    return Math.round(baseTime + 30); // Add 30 seconds for gathering/moving
  }

  // Assess route difficulty
  private assessDifficulty(fromZone: BuildingZone, toAssemblyPoint: BuildingZone): 'easy' | 'moderate' | 'difficult' {
    const floorDiff = Math.abs(fromZone.floor - toAssemblyPoint.floor);
    const distance = this.calculateDistance(fromZone.coordinates, toAssemblyPoint.coordinates);
    
    if (fromZone.zoneType === 'laboratory' || fromZone.zoneType === 'storage') {
      return 'difficult';
    }
    
    if (floorDiff > 2 || distance > 100) {
      return 'moderate';
    }
    
    return 'easy';
  }

  // Identify potential obstacles
  private identifyObstacles(fromZone: BuildingZone, toAssemblyPoint: BuildingZone): string[] {
    const obstacles: string[] = [];
    
    if (fromZone.zoneType === 'cafeteria') {
      obstacles.push('Tables and chairs');
      obstacles.push('Kitchen equipment');
    }
    
    if (fromZone.zoneType === 'laboratory') {
      obstacles.push('Lab equipment');
      obstacles.push('Chemical storage');
    }
    
    if (fromZone.zoneType === 'office') {
      obstacles.push('Office furniture');
      obstacles.push('Computer equipment');
    }

    const floorDiff = Math.abs(fromZone.floor - toAssemblyPoint.floor);
    if (floorDiff > 0) {
      obstacles.push('Stairwell traffic');
    }

    if (toAssemblyPoint.name.includes('Parking')) {
      obstacles.push('Vehicle traffic');
    }

    return obstacles;
  }

  // Identify accessibility features
  private identifyAccessibilityFeatures(fromZone: BuildingZone, toAssemblyPoint: BuildingZone): string[] {
    const features: string[] = [];
    
    if (fromZone.accessible) {
      features.push('Wheelchair accessible route');
      features.push('Accessible exits');
    }
    
    if (fromZone.hasFireExtinguisher) {
      features.push('Fire extinguisher available');
    }
    
    if (fromZone.hasEmergencyExit) {
      features.push('Direct emergency exit');
    }

    if (fromZone.floor > 0) {
      features.push('Emergency stairwell lighting');
      features.push('Handrails on stairs');
    }

    return features;
  }

  // Identify potential hazards
  private identifyPotentialHazards(fromZone: BuildingZone, toAssemblyPoint: BuildingZone): string[] {
    const hazards: string[] = [];
    
    if (fromZone.zoneType === 'laboratory') {
      hazards.push('Chemical spills');
      hazards.push('Gas leaks');
    }
    
    if (fromZone.zoneType === 'storage') {
      hazards.push('Falling objects');
      hazards.push('Blocked pathways');
    }
    
    if (fromZone.zoneType === 'cafeteria') {
      hazards.push('Slip hazards from liquids');
      hazards.push('Fire hazards from kitchen');
    }

    const floorDiff = Math.abs(fromZone.floor - toAssemblyPoint.floor);
    if (floorDiff > 2) {
      hazards.push('Crowded stairwells');
    }

    if (this.buildingLayout.name.includes('Hospital')) {
      hazards.push('Medical equipment interference');
      hazards.push('Patient mobility limitations');
    }

    return hazards;
  }

  // Calculate clearance width
  private calculateClearanceWidth(zone: BuildingZone): number {
    switch (zone.zoneType) {
      case 'laboratory':
      case 'storage':
        return 1.2; // Narrower due to equipment
      case 'cafeteria':
        return 2.5; // Wider for crowd flow
      case 'office':
        return 1.8; // Standard corridor width
      case 'lobby':
        return 3.0; // Wide open areas
      default:
        return 1.5;
    }
  }

  // Calculate maximum occupancy for route
  private calculateMaxOccupancy(fromZone: BuildingZone, toAssemblyPoint: BuildingZone): number {
    const baseCapacity = Math.min(fromZone.capacity, toAssemblyPoint.capacity);
    
    // Adjust based on route difficulty
    const difficulty = this.assessDifficulty(fromZone, toAssemblyPoint);
    let multiplier = 1.0;
    
    switch (difficulty) {
      case 'difficult':
        multiplier = 0.7; // Slower evacuation, reduce capacity
        break;
      case 'moderate':
        multiplier = 0.85;
        break;
      case 'easy':
        multiplier = 1.0;
        break;
    }

    return Math.round(baseCapacity * multiplier);
  }

  // Determine route status based on conditions
  private determineRouteStatus(
    fromZone: BuildingZone, 
    toAssemblyPoint: BuildingZone, 
    obstacles: string[], 
    hazards: string[]
  ): 'clear' | 'partial' | 'blocked' {
    // For demonstration, randomly assign statuses with realistic probabilities
    const random = Math.random();
    
    if (hazards.length > 2 || obstacles.length > 3) {
      return random < 0.3 ? 'blocked' : 'partial';
    }
    
    if (hazards.length > 0 || obstacles.length > 1) {
      return random < 0.6 ? 'partial' : 'clear';
    }
    
    return random < 0.1 ? 'partial' : 'clear';
  }

  // Convert realistic route to EvacuationPath format
  private convertToEvacuationPath(realisticRoute: RealisticEvacuationRoute): EvacuationPath {
    return {
      id: realisticRoute.id,
      name: realisticRoute.name,
      from_zone: realisticRoute.fromZone.name,
      to_zone: realisticRoute.toAssemblyPoint.name,
      steps: realisticRoute.primaryPath,
      status: realisticRoute.status,
      estimated_seconds: realisticRoute.estimatedTime,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Generate routes for specific building
  public static generateForBuilding(buildingType: 'corporate' | 'hospital' | 'mall'): EvacuationPath[] {
    let layout: BuildingLayout;
    
    switch (buildingType) {
      case 'corporate':
        layout = corporateBuildingLayout;
        break;
      case 'hospital':
        layout = hospitalBuildingLayout;
        break;
      case 'mall':
        layout = shoppingMallLayout;
        break;
      default:
        layout = corporateBuildingLayout;
    }

    const generator = new RealisticEvacuationGenerator(layout);
    return generator.generateAllEvacuationRoutes();
  }

  // Get current building context
  public getCurrentBuildingContext(): {
    name: string;
    address: string;
    totalFloors: number;
    totalZones: number;
    assemblyPoints: string[];
  } {
    const allZones: BuildingZone[] = [];
    const assemblyPoints: string[] = [];
    
    Object.values(this.buildingLayout.floorPlans).forEach(floorPlan => {
      allZones.push(...floorPlan.zones);
      assemblyPoints.push(...floorPlan.assemblyPoints.map(ap => ap.name));
    });

    return {
      name: this.buildingLayout.name,
      address: this.buildingLayout.address,
      totalFloors: this.buildingLayout.totalFloors,
      totalZones: allZones.length,
      assemblyPoints: [...new Set(assemblyPoints)] // Remove duplicates
    };
  }
}
