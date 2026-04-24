import { IncidentType } from '@/lib/incidents';

export interface AcousticEvent {
  type: 'glass_break' | 'gunshot' | 'structural_collapse' | 'screaming' | 'alarm';
  confidence: number;
  timestamp: number;
  frequency: number;
  amplitude: number;
}

export class AcousticDetection {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private isListening = false;
  private detectionCallbacks: ((event: AcousticEvent) => void)[] = [];

  async initialize(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.microphone.connect(this.analyser);
      
      console.log('Acoustic detection initialized');
    } catch (error) {
      console.error('Failed to initialize acoustic detection:', error);
      throw error;
    }
  }

  startListening(): void {
    if (!this.analyser || this.isListening) return;
    
    this.isListening = true;
    this.listenForSounds();
    console.log('Acoustic detection started');
  }

  stopListening(): void {
    this.isListening = false;
    console.log('Acoustic detection stopped');
  }

  private listenForSounds(): void {
    if (!this.isListening || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!this.isListening) return;

      this.analyser!.getByteFrequencyData(dataArray);
      this.analyser!.getByteTimeDomainData(timeDataArray);

      // Analyze frequency patterns for specific sounds
      const event = this.detectAcousticEvent(dataArray, timeDataArray);
      
      if (event) {
        this.notifyDetection(event);
      }

      requestAnimationFrame(analyze);
    };

    analyze();
  }

  private detectAcousticEvent(frequencyData: Uint8Array, timeData: Uint8Array): AcousticEvent | null {
    const avgFrequency = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;
    const maxAmplitude = Math.max(...frequencyData);
    
    // Detect glass breaking (high frequency, sharp peak)
    if (this.isGlassBreak(frequencyData, maxAmplitude)) {
      return {
        type: 'glass_break',
        confidence: 0.8,
        timestamp: Date.now(),
        frequency: this.getDominantFrequency(frequencyData),
        amplitude: maxAmplitude
      };
    }

    // Detect gunshots (very high amplitude, broad frequency)
    if (this.isGunshot(frequencyData, maxAmplitude, avgFrequency)) {
      return {
        type: 'gunshot',
        confidence: 0.9,
        timestamp: Date.now(),
        frequency: this.getDominantFrequency(frequencyData),
        amplitude: maxAmplitude
      };
    }

    // Detect structural collapse (low frequency, sustained high amplitude)
    if (this.isStructuralCollapse(frequencyData, avgFrequency)) {
      return {
        type: 'structural_collapse',
        confidence: 0.7,
        timestamp: Date.now(),
        frequency: this.getDominantFrequency(frequencyData),
        amplitude: maxAmplitude
      };
    }

    // Detect screaming (human voice frequency range)
    if (this.isScreaming(frequencyData, timeData)) {
      return {
        type: 'screaming',
        confidence: 0.6,
        timestamp: Date.now(),
        frequency: this.getDominantFrequency(frequencyData),
        amplitude: maxAmplitude
      };
    }

    return null;
  }

  private isGlassBreak(frequencyData: Uint8Array, maxAmplitude: number): boolean {
    // Glass break: very high frequency components (> 15kHz) with sharp attack
    const highFreqRange = frequencyData.slice(Math.floor(frequencyData.length * 0.7));
    const highFreqAvg = highFreqRange.reduce((a, b) => a + b, 0) / highFreqRange.length;
    
    return maxAmplitude > 200 && highFreqAvg > 100;
  }

  private isGunshot(frequencyData: Uint8Array, maxAmplitude: number, avgFrequency: number): boolean {
    // Gunshot: extremely high amplitude across all frequencies
    return maxAmplitude > 230 && avgFrequency > 150;
  }

  private isStructuralCollapse(frequencyData: Uint8Array, avgFrequency: number): boolean {
    // Structural collapse: low frequency dominant (< 2kHz) with sustained high amplitude
    const lowFreqRange = frequencyData.slice(0, Math.floor(frequencyData.length * 0.2));
    const lowFreqAvg = lowFreqRange.reduce((a, b) => a + b, 0) / lowFreqRange.length;
    
    return avgFrequency > 120 && lowFreqAvg > 150;
  }

  private isScreaming(frequencyData: Uint8Array, timeData: Uint8Array): boolean {
    // Screaming: human voice frequency range (1kHz-4kHz) with irregular pattern
    const voiceFreqStart = Math.floor(frequencyData.length * 0.1);
    const voiceFreqEnd = Math.floor(frequencyData.length * 0.4);
    const voiceRange = frequencyData.slice(voiceFreqStart, voiceFreqEnd);
    const voiceAvg = voiceRange.reduce((a, b) => a + b, 0) / voiceRange.length;
    
    // Check for irregular amplitude pattern (screaming is not steady)
    const amplitudeVariance = this.calculateVariance(timeData);
    
    return voiceAvg > 80 && amplitudeVariance > 30;
  }

  private getDominantFrequency(frequencyData: Uint8Array): number {
    let maxValue = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxIndex = i;
      }
    }
    
    // Convert index to actual frequency (assuming 44.1kHz sample rate)
    const nyquist = 44100 / 2;
    return (maxIndex / frequencyData.length) * nyquist;
  }

  private calculateVariance(data: Uint8Array): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
  }

  private notifyDetection(event: AcousticEvent): void {
    this.detectionCallbacks.forEach(callback => callback(event));
  }

  onDetection(callback: (event: AcousticEvent) => void): void {
    this.detectionCallbacks.push(callback);
  }

  convertToIncidentType(event: AcousticEvent): IncidentType {
    switch (event.type) {
      case 'glass_break':
      case 'structural_collapse':
        return 'blocked_exit';
      case 'gunshot':
        return 'suspicious_activity';
      case 'screaming':
        return 'crowd_surge';
      case 'alarm':
        return 'smoke_fire';
      default:
        return 'other';
    }
  }

  destroy(): void {
    this.stopListening();
    
    if (this.microphone) {
      this.microphone.disconnect();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.detectionCallbacks = [];
  }
}

// Singleton instance
export const acousticDetection = new AcousticDetection();
