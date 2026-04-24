import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Camera, CameraOff, Loader2, Eye, Play, Settings } from 'lucide-react';
import { edgeAIDetection, type DetectionResult } from '@/services/edgeAIDetection';
import { acousticDetection, type AcousticEvent } from '@/services/acousticDetection';
import { incidentAutomation } from '@/services/incidentAutomation';
import { demoMode } from '@/services/demoMode';
import { toast } from 'sonner';

export function EnhancedAIDetectionMonitor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(null);
  const [lastAcousticEvent, setLastAcousticEvent] = useState<AcousticEvent | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [acousticError, setAcousticError] = useState<string | null>(null);
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [demoStats, setDemoStats] = useState({
    visualDetections: 0,
    acousticDetections: 0,
    totalThreats: 0
  });

  // Demo mode simulation
  useEffect(() => {
    if (useDemoMode && isMonitoring) {
      simulationIntervalRef.current = setInterval(() => {
        // Simulate visual detection
        const visualResult = demoMode.simulateAIDetection();
        if (visualResult.detected) {
          setLastDetection(visualResult as DetectionResult);
          setDemoStats(prev => ({
            ...prev,
            visualDetections: prev.visualDetections + 1,
            totalThreats: prev.totalThreats + 1
          }));
          
          toast.warning(`Demo: Visual threat detected: ${visualResult.threatType}`, {
            description: `Confidence: ${(visualResult.confidence * 100).toFixed(1)}%`
          });
        }

        // Simulate acoustic detection
        const acousticResult = demoMode.simulateAcousticEvent();
        if (acousticResult) {
          setLastAcousticEvent(acousticResult as AcousticEvent);
          setDemoStats(prev => ({
            ...prev,
            acousticDetections: prev.acousticDetections + 1,
            totalThreats: prev.totalThreats + 1
          }));
          
          toast.warning(`Demo: Acoustic threat detected: ${acousticResult.type}`, {
            description: `Confidence: ${(acousticResult.confidence * 100).toFixed(1)}%`
          });
        }
      }, 3000); // Simulate every 3 seconds
    } else {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    }

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [useDemoMode, isMonitoring]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'environment'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      streamRef.current = stream;
      setCameraError(null);
    } catch (error) {
      console.error('Camera access failed:', error);
      setCameraError('Camera access denied. Please enable camera permissions or use demo mode.');
      throw error;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startMonitoring = async () => {
    setIsInitializing(true);
    
    try {
      if (useDemoMode) {
        demoMode.enableDemoMode();
        setIsMonitoring(true);
        setIsInitializing(false);
        toast.success('Demo AI detection started', { 
          description: 'Simulating visual and acoustic threats...' 
        });
        return;
      }

      // Real AI detection
      await edgeAIDetection.initialize();
      await acousticDetection.initialize();
      await startCamera();
      
      // Set up acoustic detection callback
      acousticDetection.onDetection((event) => {
        setLastAcousticEvent(event);
        toast.warning(`Acoustic threat detected: ${event.type}`, {
          description: `Confidence: ${(event.confidence * 100).toFixed(1)}%`
        });
        
        incidentAutomation.createIncidentFromAcousticEvent(
          event,
          'Tower A · Lobby',
          'Microphone 1'
        );
      });
      
      acousticDetection.startListening();
      setIsMonitoring(true);
      setIsInitializing(false);
      toast.success('AI detection started', { 
        description: 'Monitoring for visual and acoustic threats...' 
      });
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      setIsInitializing(false);
      
      if (!useDemoMode) {
        toast.error('Failed to start AI detection', { 
          description: 'Try enabling demo mode or check permissions.' 
        });
      }
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    stopCamera();
    acousticDetection.stopListening();
    demoMode.disableDemoMode();
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    toast.success('AI detection stopped');
  };

  // Real detection loop (only when not in demo mode)
  useEffect(() => {
    if (isMonitoring && videoRef.current && !useDemoMode) {
      const detect = async () => {
        if (!videoRef.current || !edgeAIDetection.getStatus().modelLoaded) return;

        try {
          // Visual detection
          const visualDetection = await edgeAIDetection.detectThreats(videoRef.current);
          
          // Thermal detection
          const thermalDetection = await edgeAIDetection.detectThermalAnomalies(videoRef.current);
          
          // Use the more confident detection
          const finalDetection = visualDetection.confidence > thermalDetection.confidence 
            ? visualDetection 
            : thermalDetection;

          setLastDetection(finalDetection);

          if (finalDetection.detected && finalDetection.threatType) {
            toast.warning(`Threat detected: ${finalDetection.threatType}`, {
              description: `Confidence: ${(finalDetection.confidence * 100).toFixed(1)}%`
            });
            
            incidentAutomation.createIncidentFromDetection(
              finalDetection, 
              'Tower A · Lobby',
              'Camera 1'
            );
          }
        } catch (error) {
          console.error('Detection error:', error);
        }
      };

      detectionIntervalRef.current = setInterval(detect, 2000);
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isMonitoring, useDemoMode]);

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Edge AI Detection
        </CardTitle>
        <div className="flex items-center gap-2">
          {useDemoMode && (
            <StatusChip 
              label="Demo Mode" 
              tone="info"
              pulse={true}
            />
          )}
          <StatusChip 
            label={isMonitoring ? "Active" : "Inactive"} 
            tone={isMonitoring ? "success" : "muted"}
            pulse={isMonitoring}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Demo Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <div>
              <div className="text-sm font-medium">Demo Mode</div>
              <div className="text-xs text-muted-foreground">
                Simulate AI detections without camera/microphone
              </div>
            </div>
          </div>
          <Switch 
            checked={useDemoMode}
            onCheckedChange={setUseDemoMode}
            disabled={isMonitoring}
          />
        </div>

        {/* Video Feed / Demo Visualization */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {!useDemoMode ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: isMonitoring ? 'block' : 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <div className="text-center">
                <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">Demo Mode Active</p>
                <p className="text-sm text-muted-foreground">Simulating AI detections...</p>
              </div>
            </div>
          )}
          
          {!isMonitoring && !useDemoMode && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <CameraOff className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">AI monitoring inactive</p>
              </div>
            </div>
          )}

          {/* Detection Overlays */}
          {(lastDetection?.detected || lastAcousticEvent) && (
            <div className="absolute top-2 left-2 right-2 space-y-2">
              {lastDetection?.detected && (
                <div className="bg-emergency/90 text-white p-2 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold">Visual Threat!</span>
                  </div>
                  <div className="mt-1">
                    Type: {lastDetection.threatType} | 
                    Confidence: {(lastDetection.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              )}
              {lastAcousticEvent && (
                <div className="bg-warning/90 text-white p-2 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold">Acoustic Threat!</span>
                  </div>
                  <div className="mt-1">
                    Type: {lastAcousticEvent.type} | 
                    Confidence: {(lastAcousticEvent.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isMonitoring ? (
            <Button 
              onClick={startMonitoring}
              disabled={isInitializing}
              className="flex-1"
            >
              {isInitializing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Start Monitoring
            </Button>
          ) : (
            <Button 
              onClick={stopMonitoring}
              variant="outline"
              className="flex-1"
            >
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Monitoring
            </Button>
          )}
        </div>

        {/* Demo Stats (only shown in demo mode) */}
        {useDemoMode && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-emergency">
                {demoStats.visualDetections}
              </div>
              <div className="text-xs text-muted-foreground">Visual Detections</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-warning">
                {demoStats.acousticDetections}
              </div>
              <div className="text-xs text-muted-foreground">Acoustic Detections</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-info">
                {demoStats.totalThreats}
              </div>
              <div className="text-xs text-muted-foreground">Total Threats</div>
            </div>
          </div>
        )}

        {/* Status Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Visual AI: {useDemoMode ? 'Demo Simulation' : (edgeAIDetection.getStatus().modelLoaded ? 'Active' : 'Not loaded')}</div>
          <div>Acoustic AI: {useDemoMode ? 'Demo Simulation' : (isMonitoring ? 'Listening' : 'Inactive')}</div>
          {cameraError && !useDemoMode && (
            <div className="text-emergency">{cameraError}</div>
          )}
          {acousticError && !useDemoMode && (
            <div className="text-emergency">{acousticError}</div>
          )}
          {!lastDetection?.detected && !lastAcousticEvent && isMonitoring && (
            <div>Last scan: No threats detected</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
