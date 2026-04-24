import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Thermometer, 
  Wind, 
  Volume2, 
  Wifi, 
  Battery,
  AlertTriangle,
  Zap,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { sensorSimulation, type SensorNode, type SensorReading } from '@/services/sensorSimulation';
import { toast } from 'sonner';

export function SensorMonitoringPanel() {
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [criticalReadings, setCriticalReadings] = useState<SensorReading[]>([]);
  const [systemStatus, setSystemStatus] = useState(sensorSimulation.getSystemStatus());

  useEffect(() => {
    // Initialize with current sensor data
    setSensors(sensorSimulation.getSensorNodes());
    setCriticalReadings(sensorSimulation.getCriticalReadings());

    // Subscribe to updates
    sensorSimulation.onUpdate((nodes) => {
      setSensors(nodes);
      setCriticalReadings(sensorSimulation.getCriticalReadings());
      setSystemStatus(sensorSimulation.getSystemStatus());
    });

    return () => {
      sensorSimulation.destroy();
    };
  }, []);

  const toggleSimulation = () => {
    if (isRunning) {
      sensorSimulation.stop();
      setIsRunning(false);
      toast.success('Sensor simulation stopped');
    } else {
      sensorSimulation.start();
      setIsRunning(true);
      toast.success('Sensor simulation started');
    }
  };

  const triggerEmergency = (type: 'fire' | 'structural' | 'security', zone: string) => {
    sensorSimulation.triggerEmergency(type, zone);
    toast.warning(`Emergency simulation triggered: ${type} in ${zone}`);
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer className="h-4 w-4" />;
      case 'smoke': return <Wind className="h-4 w-4" />;
      case 'sound': return <Volume2 className="h-4 w-4" />;
      case 'motion': return <Activity className="h-4 w-4" />;
      case 'thermal': return <Zap className="h-4 w-4" />;
      case 'network': return <Wifi className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-success';
      case 'offline': return 'text-muted-foreground';
      case 'warning': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getReadingStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-success/10 text-success';
      case 'warning': return 'bg-warning/10 text-warning';
      case 'critical': return 'bg-emergency/10 text-emergency';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Sensor Network
        </CardTitle>
        <div className="flex items-center gap-2">
          <StatusChip 
            label={isRunning ? "Active" : "Inactive"} 
            tone={isRunning ? "success" : "muted"}
            pulse={isRunning}
          />
          <Button size="sm" variant="outline" onClick={toggleSimulation}>
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-success">
              {systemStatus.sensors_online}/{systemStatus.sensors_total}
            </div>
            <div className="text-xs text-muted-foreground">Sensors online</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emergency">
              {criticalReadings.length}
            </div>
            <div className="text-xs text-muted-foreground">Critical alerts</div>
          </div>
        </div>

        {/* Network & Power Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Wifi className={`h-4 w-4 ${systemStatus.network_ok ? 'text-success' : 'text-emergency'}`} />
            <span className="text-sm">Network: {systemStatus.network_ok ? 'OK' : 'Issues'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Battery className={`h-4 w-4 ${systemStatus.power_ok ? 'text-success' : 'text-emergency'}`} />
            <span className="text-sm">Power: {systemStatus.power_ok ? 'OK' : 'Issues'}</span>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalReadings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-emergency" />
              Critical Alerts
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {criticalReadings.slice(0, 5).map((reading) => (
                <div key={reading.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    {getSensorIcon(reading.type)}
                    <span className="text-sm">{reading.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getReadingStatusColor(reading.status)}>
                      {reading.value} {reading.unit}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {reading.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sensor Grid */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Sensor Status</h4>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {sensors.slice(0, 6).map((sensor) => (
              <div key={sensor.id} className="p-2 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      sensor.status === 'online' ? 'bg-success' : 
                      sensor.status === 'warning' ? 'bg-warning' : 'bg-muted'
                    }`} />
                    <span className="text-sm font-medium">{sensor.location}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(sensor.status)}`}>
                    {sensor.status}
                  </Badge>
                </div>
                
                {sensor.batteryLevel !== undefined && (
                  <div className="flex items-center gap-2 mb-2">
                    <Battery className="h-3 w-3" />
                    <Progress value={sensor.batteryLevel} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground">
                      {Math.round(sensor.batteryLevel)}%
                    </span>
                  </div>
                )}

                {/* Latest readings */}
                <div className="flex gap-2">
                  {sensor.readings.slice(-3).map((reading) => (
                    <div key={reading.id} className="flex items-center gap-1">
                      {getSensorIcon(reading.type)}
                      <Badge className={getReadingStatusColor(reading.status)} variant="outline">
                        {reading.value} {reading.unit}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Simulation Controls */}
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-medium">Emergency Simulation</h4>
          <div className="grid grid-cols-3 gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => triggerEmergency('fire', 'Tower A · Lobby')}
              className="text-xs"
            >
              Fire Test
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => triggerEmergency('structural', 'Conference hall')}
              className="text-xs"
            >
              Structural
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => triggerEmergency('security', 'Parking')}
              className="text-xs"
            >
              Security
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
