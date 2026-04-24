import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { IncidentType } from '@/lib/incidents';

export interface DetectionResult {
  detected: boolean;
  confidence: number;
  threatType: IncidentType | null;
  bbox?: [number, number, number, number]; // [x, y, width, height]
  timestamp: number;
}

export class EdgeAIDetection {
  private model: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;
  private lastDetectionTime = 0;
  private detectionCooldown = 3000; // 3 seconds between detections

  async initialize(): Promise<void> {
    try {
      console.log('Loading AI model...');
      await tf.ready();
      this.model = await cocoSsd.load();
      this.isInitialized = true;
      console.log('AI model loaded successfully');
    } catch (error) {
      console.error('Failed to load AI model:', error);
      throw error;
    }
  }

  async detectThreats(videoElement: HTMLVideoElement): Promise<DetectionResult> {
    if (!this.isInitialized || !this.model) {
      throw new Error('AI model not initialized');
    }

    const now = Date.now();
    if (now - this.lastDetectionTime < this.detectionCooldown) {
      return { detected: false, confidence: 0, threatType: null, timestamp: now };
    }

    try {
      const predictions = await this.model.detect(videoElement);
      this.lastDetectionTime = now;

      // Analyze predictions for threat indicators
      for (const prediction of predictions) {
        const threatType = this.classifyThreat(prediction.class, prediction.score);
        if (threatType) {
          return {
            detected: true,
            confidence: prediction.score,
            threatType,
            bbox: [prediction.bbox[0], prediction.bbox[1], prediction.bbox[2], prediction.bbox[3]],
            timestamp: now
          };
        }
      }

      return { detected: false, confidence: 0, threatType: null, timestamp: now };
    } catch (error) {
      console.error('Detection failed:', error);
      return { detected: false, confidence: 0, threatType: null, timestamp: now };
    }
  }

  private classifyThreat(className: string, confidence: number): IncidentType | null {
    const threatMapping: Record<string, IncidentType> = {
      'person': 'suspicious_activity', // Could be crowd surge or suspicious activity
      'cell phone': 'suspicious_activity',
      'laptop': 'suspicious_activity',
      'fire': 'smoke_fire', // Direct fire detection
      'smoke': 'smoke_fire', // Direct smoke detection
      'flame': 'smoke_fire', // Alternative flame detection
    };

    // Enhanced heuristics for emergency scenarios
    if (className === 'person' && confidence > 0.8) {
      // Multiple persons could indicate crowd surge or panic
      return 'crowd_surge';
    }

    // Any unusual object with high confidence could be suspicious
    if (confidence > 0.9 && !threatMapping[className]) {
      return 'suspicious_activity';
    }

    return threatMapping[className] || null;
  }

  // Simulated thermal detection using color analysis
  async detectThermalAnomalies(videoElement: HTMLVideoElement): Promise<DetectionResult> {
    if (!this.isInitialized) {
      return { detected: false, confidence: 0, threatType: null, timestamp: Date.now() };
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return { detected: false, confidence: 0, threatType: null, timestamp: Date.now() };

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simulate thermal detection by looking for bright/hot spots
      let hotPixels = 0;
      const threshold = 200; // Brightness threshold for "heat"

      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > threshold) {
          hotPixels++;
        }
      }

      const hotPixelRatio = hotPixels / (data.length / 4);
      const confidence = Math.min(hotPixelRatio * 10, 1); // Scale confidence

      if (confidence > 0.3) {
        return {
          detected: true,
          confidence,
          threatType: 'smoke_fire',
          timestamp: Date.now()
        };
      }

      return { detected: false, confidence: 0, threatType: null, timestamp: Date.now() };
    } catch (error) {
      console.error('Thermal detection failed:', error);
      return { detected: false, confidence: 0, threatType: null, timestamp: Date.now() };
    }
  }

  getStatus(): { isInitialized: boolean; modelLoaded: boolean } {
    return {
      isInitialized: this.isInitialized,
      modelLoaded: this.model !== null
    };
  }
}

// Singleton instance
export const edgeAIDetection = new EdgeAIDetection();
