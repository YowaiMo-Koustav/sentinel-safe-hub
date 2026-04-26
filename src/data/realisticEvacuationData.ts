export interface BuildingZone {
  id: string;
  name: string;
  floor: number;
  section: string;
  roomNumber?: string;
  capacity: number;
  zoneType: 'office' | 'conference' | 'laboratory' | 'cafeteria' | 'lobby' | 'storage' | 'restroom' | 'stairwell' | 'elevator' | 'parking' | 'assembly';
  coordinates: { x: number; y: number };
  accessible: boolean;
  hasFireExtinguisher: boolean;
  hasEmergencyExit: boolean;
}

export interface RealisticEvacuationRoute {
  id: string;
  name: string;
  fromZone: BuildingZone;
  toAssemblyPoint: BuildingZone;
  primaryPath: string[];
  alternativePath?: string[];
  estimatedDistance: number; // in meters
  estimatedTime: number; // in seconds
  difficulty: 'easy' | 'moderate' | 'difficult';
  obstacles: string[];
  accessibilityFeatures: string[];
  hazards: string[];
  lastInspected: string;
  status: 'clear' | 'partial' | 'blocked';
  clearanceWidth: number; // in meters
  maxOccupancy: number;
}

export interface BuildingLayout {
  id: string;
  name: string;
  address: string;
  totalFloors: number;
  floorPlans: {
    [floor: number]: {
      zones: BuildingZone[];
      emergencyExits: { id: string; name: string; coordinates: { x: number; y: number } }[];
      fireExtinguishers: { id: string; coordinates: { x: number; y: number } }[];
      assemblyPoints: BuildingZone[];
    };
  };
}

// Corporate Office Building Layout
export const corporateBuildingLayout: BuildingLayout = {
  id: 'corporate-tower-a',
  name: 'Sentinel Corporate Tower A',
  address: '123 Business District, Tech Park, Bangalore',
  totalFloors: 12,
  floorPlans: {
    1: {
      zones: [
        { id: 'lobby-main', name: 'Main Lobby', floor: 1, section: 'A', capacity: 150, zoneType: 'lobby', coordinates: { x: 50, y: 50 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: true },
        { id: 'reception', name: 'Reception Area', floor: 1, section: 'A', capacity: 20, zoneType: 'office', coordinates: { x: 30, y: 50 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: false },
        { id: 'cafe-ground', name: 'Ground Floor Café', floor: 1, section: 'B', capacity: 80, zoneType: 'cafeteria', coordinates: { x: 80, y: 70 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: true },
        { id: 'conference-101', name: 'Conference Room 101', floor: 1, section: 'C', capacity: 25, zoneType: 'conference', coordinates: { x: 20, y: 20 }, accessible: true, hasFireExtinguisher: false, hasEmergencyExit: false },
        { id: 'server-room', name: 'Server Room', floor: 1, section: 'D', capacity: 5, zoneType: 'laboratory', coordinates: { x: 90, y: 20 }, accessible: false, hasFireExtinguisher: true, hasEmergencyExit: true },
      ],
      emergencyExits: [
        { id: 'exit-main', name: 'Main Entrance Exit', coordinates: { x: 50, y: 10 } },
        { id: 'exit-side', name: 'Side Emergency Exit', coordinates: { x: 10, y: 50 } },
        { id: 'exit-rear', name: 'Rear Emergency Exit', coordinates: { x: 90, y: 90 } },
      ],
      fireExtinguishers: [
        { id: 'fe-lobby', coordinates: { x: 40, y: 50 } },
        { id: 'fe-cafe', coordinates: { x: 75, y: 70 } },
        { id: 'fe-conference', coordinates: { x: 25, y: 20 } },
      ],
      assemblyPoints: [
        { id: 'assembly-north', name: 'North Assembly Point', floor: 0, section: 'OUTSIDE', capacity: 500, zoneType: 'assembly', coordinates: { x: 50, y: 5 }, accessible: true, hasFireExtinguisher: false, hasEmergencyExit: false },
        { id: 'assembly-south', name: 'South Parking Assembly', floor: 0, section: 'OUTSIDE', capacity: 300, zoneType: 'assembly', coordinates: { x: 50, y: 95 }, accessible: true, hasFireExtinguisher: false, hasEmergencyExit: false },
      ]
    },
    2: {
      zones: [
        { id: 'office-201', name: 'Open Office Area 201', floor: 2, section: 'A', capacity: 60, zoneType: 'office', coordinates: { x: 30, y: 40 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: false },
        { id: 'office-202', name: 'Open Office Area 202', floor: 2, section: 'B', capacity: 60, zoneType: 'office', coordinates: { x: 70, y: 40 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: false },
        { id: 'meeting-205', name: 'Meeting Room 205', floor: 2, section: 'C', capacity: 12, zoneType: 'conference', coordinates: { x: 50, y: 20 }, accessible: true, hasFireExtinguisher: false, hasEmergencyExit: false },
        { id: 'break-room-2', name: 'Break Room Floor 2', floor: 2, section: 'D', capacity: 30, zoneType: 'cafeteria', coordinates: { x: 80, y: 80 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: false },
        { id: 'restrooms-2', name: 'Restrooms Floor 2', floor: 2, section: 'E', capacity: 15, zoneType: 'restroom', coordinates: { x: 20, y: 80 }, accessible: true, hasFireExtinguisher: false, hasEmergencyExit: false },
      ],
      emergencyExits: [
        { id: 'exit-stair-a', name: 'Stairwell A', coordinates: { x: 15, y: 15 } },
        { id: 'exit-stair-b', name: 'Stairwell B', coordinates: { x: 85, y: 15 } },
        { id: 'exit-stair-c', name: 'Stairwell C', coordinates: { x: 50, y: 85 } },
      ],
      fireExtinguishers: [
        { id: 'fe-office-a', coordinates: { x: 35, y: 40 } },
        { id: 'fe-office-b', coordinates: { x: 65, y: 40 } },
        { id: 'fe-meeting', coordinates: { x: 50, y: 25 } },
      ],
      assemblyPoints: []
    },
    3: {
      zones: [
        { id: 'lab-301', name: 'Research Laboratory 301', floor: 3, section: 'A', capacity: 20, zoneType: 'laboratory', coordinates: { x: 25, y: 30 }, accessible: false, hasFireExtinguisher: true, hasEmergencyExit: true },
        { id: 'lab-302', name: 'Chemistry Lab 302', floor: 3, section: 'B', capacity: 15, zoneType: 'laboratory', coordinates: { x: 75, y: 30 }, accessible: false, hasFireExtinguisher: true, hasEmergencyExit: true },
        { id: 'office-303', name: 'Research Office 303', floor: 3, section: 'C', capacity: 25, zoneType: 'office', coordinates: { x: 50, y: 60 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: false },
        { id: 'storage-3', name: 'Chemical Storage', floor: 3, section: 'D', capacity: 5, zoneType: 'storage', coordinates: { x: 90, y: 80 }, accessible: false, hasFireExtinguisher: true, hasEmergencyExit: true },
      ],
      emergencyExits: [
        { id: 'exit-stair-a-3', name: 'Stairwell A', coordinates: { x: 15, y: 15 } },
        { id: 'exit-stair-b-3', name: 'Stairwell B', coordinates: { x: 85, y: 15 } },
        { id: 'exit-emergency-lab', name: 'Lab Emergency Exit', coordinates: { x: 25, y: 90 } },
      ],
      fireExtinguishers: [
        { id: 'fe-lab-301', coordinates: { x: 25, y: 30 } },
        { id: 'fe-lab-302', coordinates: { x: 75, y: 30 } },
        { id: 'fe-storage', coordinates: { x: 85, y: 80 } },
      ],
      assemblyPoints: []
    }
  }
};

// Hospital Building Layout
export const hospitalBuildingLayout: BuildingLayout = {
  id: 'city-general-hospital',
  name: 'City General Hospital - Main Wing',
  address: '456 Medical Center Drive, Healthcare District',
  totalFloors: 8,
  floorPlans: {
    1: {
      zones: [
        { id: 'er-main', name: 'Emergency Room Main', floor: 1, section: 'A', capacity: 40, zoneType: 'office', coordinates: { x: 30, y: 30 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: true },
        { id: 'reception-hospital', name: 'Main Reception', floor: 1, section: 'B', capacity: 30, zoneType: 'lobby', coordinates: { x: 50, y: 50 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: false },
        { id: 'icu-waiting', name: 'ICU Waiting Area', floor: 1, section: 'C', capacity: 25, zoneType: 'office', coordinates: { x: 70, y: 30 }, accessible: true, hasFireExtinguisher: false, hasEmergencyExit: false },
        { id: 'cafeteria-hospital', name: 'Hospital Cafeteria', floor: 1, section: 'D', capacity: 100, zoneType: 'cafeteria', coordinates: { x: 80, y: 70 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: true },
        { id: 'radiology', name: 'Radiology Department', floor: 1, section: 'E', capacity: 20, zoneType: 'laboratory', coordinates: { x: 20, y: 70 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: false },
      ],
      emergencyExits: [
        { id: 'exit-ambulance', name: 'Ambulance Entrance', coordinates: { x: 30, y: 10 } },
        { id: 'exit-public', name: 'Public Entrance', coordinates: { x: 70, y: 10 } },
        { id: 'exit-emergency', name: 'Emergency Exit East', coordinates: { x: 95, y: 50 } },
      ],
      fireExtinguishers: [
        { id: 'fe-er', coordinates: { x: 30, y: 30 } },
        { id: 'fe-reception', coordinates: { x: 50, y: 50 } },
        { id: 'fe-cafeteria', coordinates: { x: 80, y: 70 } },
      ],
      assemblyPoints: [
        { id: 'assembly-emergency', name: 'Emergency Assembly Area', floor: 0, section: 'OUTSIDE', capacity: 400, zoneType: 'assembly', coordinates: { x: 30, y: 5 }, accessible: true, hasFireExtinguisher: false, hasEmergencyExit: false },
        { id: 'assembly-parking', name: 'Parking Lot Assembly', floor: 0, section: 'OUTSIDE', capacity: 600, zoneType: 'assembly', coordinates: { x: 70, y: 95 }, accessible: true, hasFireExtinguisher: false, hasEmergencyExit: false },
      ]
    },
    2: {
      zones: [
        { id: 'surgery-201', name: 'Surgery Ward 201', floor: 2, section: 'A', capacity: 35, zoneType: 'office', coordinates: { x: 25, y: 25 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: false },
        { id: 'recovery-202', name: 'Recovery Room 202', floor: 2, section: 'B', capacity: 20, zoneType: 'office', coordinates: { x: 75, y: 25 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: false },
        { id: 'nursing-station', name: 'Nursing Station', floor: 2, section: 'C', capacity: 15, zoneType: 'office', coordinates: { x: 50, y: 50 }, accessible: true, hasFireExtinguisher: false, hasEmergencyExit: false },
        { id: 'isolation-203', name: 'Isolation Room 203', floor: 2, section: 'D', capacity: 5, zoneType: 'laboratory', coordinates: { x: 20, y: 80 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: true },
      ],
      emergencyExits: [
        { id: 'exit-stair-north', name: 'North Stairwell', coordinates: { x: 10, y: 10 } },
        { id: 'exit-stair-south', name: 'South Stairwell', coordinates: { x: 90, y: 10 } },
        { id: 'exit-evacuation', name: 'Evacuation Stairwell', coordinates: { x: 50, y: 90 } },
      ],
      fireExtinguishers: [
        { id: 'fe-surgery', coordinates: { x: 25, y: 25 } },
        { id: 'fe-recovery', coordinates: { x: 75, y: 25 } },
        { id: 'fe-nursing', coordinates: { x: 50, y: 50 } },
      ],
      assemblyPoints: []
    }
  }
};

// Shopping Mall Layout
export const shoppingMallLayout: BuildingLayout = {
  id: 'downtown-shopping-center',
  name: 'Downtown Shopping Center',
  address: '789 Commerce Street, Shopping District',
  totalFloors: 3,
  floorPlans: {
    1: {
      zones: [
        { id: 'food-court', name: 'Food Court', floor: 1, section: 'A', capacity: 300, zoneType: 'cafeteria', coordinates: { x: 50, y: 80 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: true },
        { id: 'main-atrium', name: 'Main Atrium', floor: 1, section: 'B', capacity: 200, zoneType: 'lobby', coordinates: { x: 50, y: 50 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: false },
        { id: 'retail-north', name: 'North Retail Wing', floor: 1, section: 'C', capacity: 150, zoneType: 'office', coordinates: { x: 20, y: 30 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: false },
        { id: 'retail-south', name: 'South Retail Wing', floor: 1, section: 'D', capacity: 150, zoneType: 'office', coordinates: { x: 80, y: 30 }, accessible: true, hasFireExtinguisher: true, hasEmergencyExit: false },
        { id: 'cinema-lobby', name: 'Cinema Lobby', floor: 1, section: 'E', capacity: 100, zoneType: 'lobby', coordinates: { x: 90, y: 70 }, accessible: true, hasFireExtinguisher: false, hasEmergencyExit: true },
      ],
      emergencyExits: [
        { id: 'exit-main-entrance', name: 'Main Entrance', coordinates: { x: 50, y: 10 } },
        { id: 'exit-parking-north', name: 'North Parking Exit', coordinates: { x: 10, y: 50 } },
        { id: 'exit-parking-south', name: 'South Parking Exit', coordinates: { x: 90, y: 50 } },
        { id: 'exit-emergency-rear', name: 'Rear Emergency Exit', coordinates: { x: 50, y: 95 } },
      ],
      fireExtinguishers: [
        { id: 'fe-food-court', coordinates: { x: 50, y: 80 } },
        { id: 'fe-atrium', coordinates: { x: 50, y: 50 } },
        { id: 'fe-retail-north', coordinates: { x: 20, y: 30 } },
        { id: 'fe-retail-south', coordinates: { x: 80, y: 30 } },
      ],
      assemblyPoints: [
        { id: 'assembly-parking-north', name: 'North Parking Assembly', floor: 0, section: 'OUTSIDE', capacity: 800, zoneType: 'assembly', coordinates: { x: 10, y: 50 }, accessible: true, hasFireExtinguisher: false, hasEmergencyExit: false },
        { id: 'assembly-parking-south', name: 'South Parking Assembly', floor: 0, section: 'OUTSIDE', capacity: 800, zoneType: 'assembly', coordinates: { x: 90, y: 50 }, accessible: true, hasFireExtinguisher: false, hasEmergencyExit: false },
      ]
    }
  }
};

export const buildingLayouts = [corporateBuildingLayout, hospitalBuildingLayout, shoppingMallLayout];
