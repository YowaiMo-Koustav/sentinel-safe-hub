import { SystemStatus } from '@/hooks/useVenueData';

export interface SensorReading {
  id: string;
  type: 'temperature' | 'smoke' | 'motion' | 'sound' | 'thermal' | 'network';
  location: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  timestamp: number;
}

export interface SensorNode {
  id: string;
  location: string;
  zone: string;
  status: 'online' | 'offline' | 'warning';
  lastSeen: number;
  batteryLevel?: number;
  readings: SensorReading[];
}

export class SensorSimulationService {
  private sensors: Map<string, SensorNode> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private callbacks: ((nodes: SensorNode[]) => void)[] = [];

  constructor() {
    this.initializeSensors();
  }

  private initializeSensors(): void {
    // Create simulated sensors for each zone
    const zones = [
      'Tower A · Lobby',
      'Tower A · Rooms',
      'Tower B · Lobby', 
      'Tower B · Rooms',
      'Pool deck',
      'Conference hall',
      'Restaurant',
      'Parking',
      'Back of house'
    ];

    zones.forEach((zone, index) => {
      const sensorId = `sensor-${index + 1}`;
      const sensor: SensorNode = {
        id: sensorId,
        location: `${zone} - Sensor ${index + 1}`,
        zone,
        status: 'online',
        lastSeen: Date.now(),
        batteryLevel: Math.random() * 100,
        readings: []
      };

      this.sensors.set(sensorId, sensor);
    });
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.updateSensorReadings();
      this.notifyCallbacks();
    }, 2000); // Update every 2 seconds

    console.log('Sensor simulation started');
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('Sensor simulation stopped');
  }

  private updateSensorReadings(): void {
    this.sensors.forEach((sensor) => {
      // Randomly take sensors offline (5% chance)
      if (Math.random() < 0.05) {
        sensor.status = 'offline';
        sensor.lastSeen = Date.now() - 30000; // 30 seconds ago
        return;
      }

      // Bring sensors back online (80% chance if offline)
      if (sensor.status === 'offline' && Math.random() < 0.8) {
        sensor.status = 'online';
        sensor.lastSeen = Date.now();
      }

      // Update battery level
      if (sensor.batteryLevel !== undefined) {
        sensor.batteryLevel = Math.max(0, sensor.batteryLevel - Math.random() * 0.1);
        if (sensor.batteryLevel < 20) {
          sensor.status = 'warning';
        }
      }

      // Generate new readings
      const newReadings = this.generateReadings(sensor.zone);
      sensor.readings = [...sensor.readings.slice(-5), ...newReadings]; // Keep last 5 readings
    });
  }

  private generateReadings(zone: string): SensorReading[] {
    const readings: SensorReading[] = [];
    const timestamp = Date.now();

    // Temperature reading
    const tempBase = 20 + Math.random() * 10; // 20-30°C normal
    const tempValue = Math.random() < 0.1 ? tempBase + Math.random() * 20 : tempBase; // Occasionally high
    readings.push({
      id: `temp-${timestamp}`,
      type: 'temperature',
      location: zone,
      value: tempValue,
      unit: '°C',
      status: tempValue > 45 ? 'critical' : tempValue > 35 ? 'warning' : 'normal',
      timestamp
    });

    // Smoke level
    const smokeLevel = Math.random() < 0.05 ? Math.random() * 100 : Math.random() * 10;
    readings.push({
      id: `smoke-${timestamp}`,
      type: 'smoke',
      location: zone,
      value: smokeLevel,
      unit: 'ppm',
      status: smokeLevel > 50 ? 'critical' : smokeLevel > 20 ? 'warning' : 'normal',
      timestamp
    });

    // Motion detection
    const motionLevel = Math.random() * 100;
    readings.push({
      id: `motion-${timestamp}`,
      type: 'motion',
      location: zone,
      value: motionLevel,
      unit: '%',
      status: motionLevel > 80 ? 'warning' : 'normal',
      timestamp
    });

    // Sound level
    const soundLevel = 40 + Math.random() * 40; // 40-80 dB normal
    readings.push({
      id: `sound-${timestamp}`,
      type: 'sound',
      location: zone,
      value: soundLevel,
      unit: 'dB',
      status: soundLevel > 100 ? 'critical' : soundLevel > 85 ? 'warning' : 'normal',
      timestamp
    });

    // Thermal imaging
    const thermalValue = Math.random() < 0.03 ? Math.random() * 100 : Math.random() * 30;
    readings.push({
      id: `thermal-${timestamp}`,
      type: 'thermal',
      location: zone,
      value: thermalValue,
      unit: '°C',
      status: thermalValue > 80 ? 'critical' : thermalValue > 60 ? 'warning' : 'normal',
      timestamp
    });

    // Network connectivity
    const networkQuality = Math.random() < 0.1 ? Math.random() * 50 : 80 + Math.random() * 20;
    readings.push({
      id: `network-${timestamp}`,
      type: 'network',
      location: zone,
      value: networkQuality,
      unit: '%',
      status: networkQuality < 30 ? 'critical' : networkQuality < 60 ? 'warning' : 'normal',
      timestamp
    });

    return readings;
  }

  // Get all sensor nodes
  getSensorNodes(): SensorNode[] {
    return Array.from(this.sensors.values());
  }

  // Get sensors by zone
  getSensorsByZone(zone: string): SensorNode[] {
    return this.getSensorNodes().filter(sensor => sensor.zone === zone);
  }

  // Get critical readings
  getCriticalReadings(): SensorReading[] {
    const readings: SensorReading[] = [];
    this.sensors.forEach(sensor => {
      readings.push(...sensor.readings.filter(r => r.status === 'critical'));
    });
    return readings.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get system status summary
  getSystemStatus(): Omit<SystemStatus, 'id' | 'updated_at'> {
    const nodes = this.getSensorNodes();
    const onlineNodes = nodes.filter(n => n.status === 'online');
    const warningNodes = nodes.filter(n => n.status === 'warning');
    const criticalReadings = this.getCriticalReadings();

    // Calculate network status based on network readings
    const networkReadings = nodes.flatMap(n => n.readings.filter(r => r.type === 'network'));
    const avgNetworkQuality = networkReadings.reduce((sum, r) => sum + r.value, 0) / networkReadings.length || 100;
    const networkOk = avgNetworkQuality > 60;

    // Calculate power status (simulate based on battery levels)
    const avgBattery = nodes.reduce((sum, n) => sum + (n.batteryLevel || 100), 0) / nodes.length;
    const powerOk = avgBattery > 20;

    return {
      sensors_online: onlineNodes.length,
      sensors_total: nodes.length,
      network_ok: networkOk,
      power_ok: powerOk,
      responders_available: 3 + Math.floor(Math.random() * 5), // Simulated
      staff_on_duty: 8 + Math.floor(Math.random() * 10), // Simulated
      last_heartbeat: new Date().toISOString()
    };
  }

  // Trigger simulated emergency
  triggerEmergency(type: 'fire' | 'structural' | 'security', zone: string): void {
    const sensor = this.getSensorsByZone(zone)[0];
    if (!sensor) return;

    const timestamp = Date.now();
    let emergencyReading: SensorReading;

    switch (type) {
      case 'fire':
        emergencyReading = {
          id: `fire-${timestamp}`,
          type: 'smoke',
          location: zone,
          value: 100,
          unit: 'ppm',
          status: 'critical',
          timestamp
        };
        break;
      case 'structural':
        emergencyReading = {
          id: `structural-${timestamp}`,
          type: 'sound',
          location: zone,
          value: 120,
          unit: 'dB',
          status: 'critical',
          timestamp
        };
        break;
      case 'security':
        emergencyReading = {
          id: `security-${timestamp}`,
          type: 'motion',
          location: zone,
          value: 100,
          unit: '%',
          status: 'critical',
          timestamp
        };
        break;
    }

    sensor.readings.push(emergencyReading);
    this.notifyCallbacks();
  }

  // Subscribe to updates
  onUpdate(callback: (nodes: SensorNode[]) => void): void {
    this.callbacks.push(callback);
  }

  private notifyCallbacks(): void {
    const nodes = this.getSensorNodes();
    this.callbacks.forEach(callback => callback(nodes));
  }

  // Get sensor by ID
  getSensor(id: string): SensorNode | undefined {
    return this.sensors.get(id);
  }

  // Cleanup
  destroy(): void {
    this.stop();
    this.callbacks = [];
    this.sensors.clear();
  }
}

// Singleton instance
export const sensorSimulation = new SensorSimulationService();
