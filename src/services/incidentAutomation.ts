import { DetectionResult } from './edgeAIDetection';
import { AcousticEvent } from './acousticDetection';
import { IncidentType } from '@/lib/incidents';

export class IncidentAutomationService {
  private static instance: IncidentAutomationService;
  private isEnabled = true;

  static getInstance(): IncidentAutomationService {
    if (!IncidentAutomationService.instance) {
      IncidentAutomationService.instance = new IncidentAutomationService();
    }
    return IncidentAutomationService.instance;
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  async createIncidentFromDetection(
    detection: DetectionResult,
    zone: string = 'Unknown',
    room?: string
  ): Promise<string | null> {
    if (!this.isEnabled || !detection.detected || !detection.threatType) {
      return null;
    }

    try {
      const incidentData = {
        type: detection.threatType,
        severity: this.getSeverityFromConfidence(detection.confidence),
        status: 'new' as const,
        zone,
        room: room || null,
        note: `AI Detection: ${detection.threatType} detected with ${(detection.confidence * 100).toFixed(1)}% confidence. Camera: ${room || 'Unknown'}`,
        source: 'sensor' as const,
        reporter_id: '00000000-0000-0000-0000-000000000000', // System UUID for sensor reports
        reporter_name: 'AI Detection System'
      };

      // Mock API call - replace with actual API implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      const newId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Incident created from AI detection:', newId);
      return newId;
    } catch (error) {
      console.error('Error creating incident from detection:', error);
      return null;
    }
  }

  async createIncidentFromAcousticEvent(
    event: AcousticEvent,
    zone: string = 'Unknown',
    room?: string
  ): Promise<string | null> {
    if (!this.isEnabled) {
      return null;
    }

    try {
      const incidentType = this.mapAcousticEventToIncidentType(event);
      const incidentData = {
        type: incidentType,
        severity: this.getSeverityFromConfidence(event.confidence),
        status: 'new' as const,
        zone,
        room: room || null,
        note: `Acoustic Detection: ${event.type} detected with ${(event.confidence * 100).toFixed(1)}% confidence at ${event.frequency.toFixed(0)}Hz. Location: ${zone}`,
        source: 'sensor' as const,
        reporter_id: '00000000-0000-0000-0000-000000000000', // System UUID for sensor reports
        reporter_name: 'Acoustic Detection System'
      };

      // Mock API call - replace with actual API implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      const newId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Incident created from acoustic detection:', newId);
      return newId;
    } catch (error) {
      console.error('Error creating incident from acoustic event:', error);
      return null;
    }
  }

  private getSeverityFromConfidence(confidence: number): 'critical' | 'high' | 'medium' | 'low' {
    if (confidence >= 0.9) return 'critical';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  private mapAcousticEventToIncidentType(event: AcousticEvent): IncidentType {
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

  // Create incidents from mesh network SOS signals
  async createIncidentFromMeshSOS(
    location: string,
    incidentType: string,
    severity: string,
    senderName: string
  ): Promise<string | null> {
    if (!this.isEnabled) {
      return null;
    }

    try {
      const incidentData = {
        type: incidentType as IncidentType,
        severity: severity as 'critical' | 'high' | 'medium' | 'low',
        status: 'new' as const,
        zone: location,
        room: null,
        note: `SOS received via mesh network from ${senderName}. Device: ${senderName}`,
        source: 'guest' as const,
        reporter_id: '00000000-0000-0000-0000-000000000001', // System UUID for mesh SOS
        reporter_name: senderName
      };

      // Mock API call - replace with actual API implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      const newId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Incident created from mesh SOS:', newId);
      return newId;
    } catch (error) {
      console.error('Error creating incident from mesh SOS:', error);
      return null;
    }
  }

  // Auto-escalate incidents based on multiple detections
  async escalateIncidentIfMultipleDetections(incidentId: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Mock escalation logic - replace with actual API implementation
      console.log(`Checking for escalation opportunities for incident: ${incidentId}`);
      
      // Simulate checking for similar incidents
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock escalation decision
      const shouldEscalate = Math.random() > 0.8; // 20% chance of escalation
      
      if (shouldEscalate) {
        console.log(`Incident ${incidentId} would be escalated to critical severity`);
      }
    } catch (error) {
      console.error('Error escalating incident:', error);
    }
  }

  private escalateSeverity(current: 'critical' | 'high' | 'medium' | 'low'): 'critical' | 'high' | 'medium' | 'low' {
    switch (current) {
      case 'low': return 'medium';
      case 'medium': return 'high';
      case 'high': return 'critical';
      case 'critical': return 'critical'; // Already at max
      default: return 'medium';
    }
  }
}

// Export singleton instance
export const incidentAutomation = IncidentAutomationService.getInstance();
