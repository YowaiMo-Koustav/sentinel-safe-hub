import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { AlertTriangle, Camera, CameraOff, Loader2, Eye } from 'lucide-react';
import { edgeAIDetection, type DetectionResult } from '@/services/edgeAIDetection';
import { acousticDetection, type AcousticEvent } from '@/services/acousticDetection';
import { incidentAutomation } from '@/services/incidentAutomation';
import { toast } from 'sonner';

export function AIDetectionMonitor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(null);
  const [lastAcousticEvent, setLastAcousticEvent] = useState<AcousticEvent | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [acousticError, setAcousticError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraError(null);
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      setCameraError('Unable to access camera. Please check permissions.');
      toast.error('Camera access denied', { description: 'Please allow camera access for AI detection.' });
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
      await edgeAIDetection.initialize();
      await acousticDetection.initialize();
      await startCamera();
      
      // Set up acoustic detection callback
      acousticDetection.onDetection((event) => {
        setLastAcousticEvent(event);
        toast.warning(`Acoustic threat detected: ${event.type}`, {
          description: `Confidence: ${(event.confidence * 100).toFixed(1)}%`
        });
        
        // Automatically create incident from acoustic detection
        incidentAutomation.createIncidentFromAcousticEvent(
          event,
          'Tower A · Lobby', // Default zone - this could be dynamic based on microphone location
          'Microphone 1' // Microphone identifier
        );
      });
      
      acousticDetection.startListening();
      setIsMonitoring(true);
      setIsInitializing(false);
      toast.success('AI detection started', { description: 'Monitoring for visual and acoustic threats...' });
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      setIsInitializing(false);
      toast.error('Failed to start AI detection', { description: 'Please try again.' });
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    stopCamera();
    acousticDetection.stopListening();
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    toast.success('AI detection stopped');
  };

  useEffect(() => {
    if (isMonitoring && videoRef.current) {
      // Start detection loop
      const detect = async () => {
        if (!videoRef.current || !edgeAIDetection.getStatus().modelLoaded) return;

        try {
          // Regular object detection
          const detection = await edgeAIDetection.detectThreats(videoRef.current);
          
          // Thermal anomaly detection
          const thermalDetection = await edgeAIDetection.detectThermalAnomalies(videoRef.current);

          // Use the detection with higher confidence
          const finalDetection = detection.confidence > thermalDetection.confidence 
            ? detection 
            : thermalDetection;

          setLastDetection(finalDetection);

          // If threat detected, create incident
          if (finalDetection.detected && finalDetection.threatType) {
            toast.warning(`Threat detected: ${finalDetection.threatType}`, {
              description: `Confidence: ${(finalDetection.confidence * 100).toFixed(1)}%`
            });
            
            // Automatically create incident
            incidentAutomation.createIncidentFromDetection(
              finalDetection, 
              'Tower A · Lobby', // Default zone - this could be dynamic based on camera location
              'Camera 1' // Camera identifier
            );
          }
        } catch (error) {
          console.error('Detection error:', error);
        }
      };

      // Run detection every 2 seconds
      detectionIntervalRef.current = setInterval(detect, 2000);
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isMonitoring]);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Edge AI Detection
        </CardTitle>
        <StatusChip 
          label={isMonitoring ? "Active" : "Inactive"} 
          tone={isMonitoring ? "success" : "muted"}
          pulse={isMonitoring}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Feed */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ display: isMonitoring ? 'block' : 'none' }} // Keeping inline style for conditional video display
          />
          
          {!isMonitoring && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <CameraOff className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">AI monitoring inactive</p>
              </div>
            </div>
          )}

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
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Monitoring
                </>
              )}
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

        {/* Status Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Visual AI: {edgeAIDetection.getStatus().modelLoaded ? 'Active' : 'Not loaded'}</div>
          <div>Acoustic AI: {isMonitoring ? 'Listening' : 'Inactive'}</div>
          {cameraError && (
            <div className="text-emergency">{cameraError}</div>
          )}
          {acousticError && (
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
