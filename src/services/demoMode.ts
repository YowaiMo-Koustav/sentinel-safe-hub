// Demo mode service for hackathon presentations
// Provides fallback functionality when hardware access is limited

export class DemoModeService {
  private static instance: DemoModeService;
  private isDemoMode = false;
  private simulationInterval: NodeJS.Timeout | null = null;

  static getInstance(): DemoModeService {
    if (!DemoModeService.instance) {
      DemoModeService.instance = new DemoModeService();
    }
    return DemoModeService.instance;
  }

  enableDemoMode(): void {
    this.isDemoMode = true;
    console.log('Demo mode enabled - using simulated data');
  }

  disableDemoMode(): void {
    this.isDemoMode = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    console.log('Demo mode disabled');
  }

  // Simulate AI detections for demo
  simulateAIDetection(): {
    detected: boolean;
    confidence: number;
    threatType: string;
    timestamp: number;
  } {
    const threats = ['smoke_fire', 'suspicious_activity', 'crowd_surge'];
    const threatType = threats[Math.floor(Math.random() * threats.length)];
    const detected = Math.random() > 0.7; // 30% chance of detection
    
    return {
      detected,
      confidence: detected ? 0.8 + Math.random() * 0.2 : 0,
      threatType: detected ? threatType : null,
      timestamp: Date.now()
    };
  }

  // Simulate acoustic events
  simulateAcousticEvent(): {
    type: string;
    confidence: number;
    frequency: number;
    amplitude: number;
    timestamp: number;
  } | null {
    if (Math.random() > 0.8) return null; // 20% chance of acoustic event
    
    const events = ['glass_break', 'gunshot', 'structural_collapse', 'screaming'];
    const type = events[Math.floor(Math.random() * events.length)];
    
    return {
      type,
      confidence: 0.7 + Math.random() * 0.3,
      frequency: 1000 + Math.random() * 4000,
      amplitude: 100 + Math.random() * 100,
      timestamp: Date.now()
    };
  }

  // Simulate mesh network peer connections
  simulateMeshPeers(): Array<{
    id: string;
    name: string;
    status: 'connected' | 'connecting' | 'disconnected';
    signalStrength: number;
  }> {
    const peers = [
      { id: 'demo-peer-1', name: 'Device A', status: 'connected' as const, signalStrength: 85 },
      { id: 'demo-peer-2', name: 'Device B', status: 'connected' as const, signalStrength: 72 },
      { id: 'demo-peer-3', name: 'Device C', status: 'connecting' as const, signalStrength: 45 },
    ];
    
    return peers.filter(() => Math.random() > 0.1); // Occasionally drop a peer
  }

  // Simulate mesh network messages
  simulateMeshMessage(): {
    id: string;
    type: 'incident' | 'sos' | 'status';
    content: string;
    sender: string;
    timestamp: number;
  } | null {
    if (Math.random() > 0.6) return null; // 40% chance of message
    
    const messages = [
      { type: 'sos' as const, content: 'Emergency detected in Tower A' },
      { type: 'incident' as const, content: 'Fire alarm triggered' },
      { type: 'status' as const, content: 'Network status: All clear' },
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    const senders = ['Device A', 'Device B', 'Device C'];
    
    return {
      id: `msg-${Date.now()}`,
      type: message.type,
      content: message.content,
      sender: senders[Math.floor(Math.random() * senders.length)],
      timestamp: Date.now()
    };
  }

  // Simulate sensor readings
  simulateSensorReadings(): Array<{
    id: string;
    type: string;
    location: string;
    value: number;
    unit: string;
    status: 'normal' | 'warning' | 'critical';
  }> {
    const sensors = [
      { type: 'temperature', location: 'Tower A · Lobby', unit: '°C', normalRange: [20, 25] },
      { type: 'smoke', location: 'Tower B · Rooms', unit: 'ppm', normalRange: [0, 10] },
      { type: 'sound', location: 'Conference hall', unit: 'dB', normalRange: [40, 60] },
      { type: 'motion', location: 'Restaurant', unit: '%', normalRange: [0, 30] },
    ];
    
    return sensors.map(sensor => {
      const isAbnormal = Math.random() > 0.85; // 15% chance of abnormal reading
      let value, status;
      
      if (isAbnormal) {
        value = sensor.normalRange[1] + Math.random() * 50;
        status = value > sensor.normalRange[1] + 30 ? 'critical' : 'warning';
      } else {
        value = sensor.normalRange[0] + Math.random() * (sensor.normalRange[1] - sensor.normalRange[0]);
        status = 'normal';
      }
      
      return {
        id: `sensor-${sensor.type}-${Date.now()}`,
        type: sensor.type,
        location: sensor.location,
        value,
        unit: sensor.unit,
        status
      };
    });
  }

  // Check if demo mode is active
  isActive(): boolean {
    return this.isDemoMode;
  }

  // Start continuous simulation for demo
  startContinuousSimulation(): void {
    if (!this.isDemoMode) return;
    
    this.simulationInterval = setInterval(() => {
      // This will trigger various simulations
      console.log('Demo simulation tick');
    }, 2000);
  }

  // Stop continuous simulation
  stopContinuousSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}

// Export singleton instance
export const demoMode = DemoModeService.getInstance();
