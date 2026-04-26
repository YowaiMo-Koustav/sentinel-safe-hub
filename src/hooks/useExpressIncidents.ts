import { useEffect, useState } from "react";
import type { IncidentRow as Incident, IncidentEventRow } from "@/lib/incidents";

export type { IncidentRow as Incident } from "@/lib/incidents";

interface Options {
  ownOnly?: boolean;
  userId?: string | null;
  status?: string;
  severity?: string;
  zone?: string;
  enabled?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export function useExpressIncidents({
  ownOnly,
  userId,
  status,
  severity,
  zone,
  enabled = true,
}: Options = {}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchIncidents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (severity) params.append('severity', severity);
        if (zone) params.append('zone', zone);
        if (ownOnly && userId) params.append('own_only', 'true');

        const response = await fetch(`${API_BASE_URL}/api/incidents${params.toString() ? `?${params.toString()}` : ''}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch incidents');
        }

        const data = await response.json();
        setIncidents(data.incidents || []);
      } catch (err) {
        console.error('Error fetching incidents:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Fallback to mock data if API fails
        const mockIncidents: Incident[] = [
          {
            id: '1',
            type: 'fire' as any,
            severity: 'high',
            status: 'new',
            zone: 'building-a',
            room: '101',
            note: 'Smoke detected in room 101',
            source: 'sensor' as any,
            reporter_id: 'system',
            reporter_name: 'Fire Detection System',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'medical' as any,
            severity: 'medium',
            status: 'acknowledged',
            zone: 'building-b',
            room: '205',
            note: 'Person feeling unwell',
            source: 'manual' as any,
            reporter_id: 'staff1',
            reporter_name: 'John Staff',
            created_at: new Date(Date.now() - 300000).toISOString(),
            updated_at: new Date(Date.now() - 240000).toISOString(),
          },
        ];
        setIncidents(mockIncidents);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();

    // Set up WebSocket for real-time updates (optional, can fail gracefully)
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5001';
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'incident_created') {
            setIncidents(prev => [...prev, data.incident]);
          } else if (data.type === 'incident_updated') {
            setIncidents(prev => prev.map(i => 
              i.id === data.incident.id ? data.incident : i
            ));
          } else if (data.type === 'incident_deleted') {
            setIncidents(prev => prev.filter(i => i.id !== data.id));
          }
        } catch (err) {
          console.error('WebSocket error:', err);
        }
      };

      ws.onerror = (error) => {
        console.warn('WebSocket connection failed, real-time updates disabled');
      };

      return () => {
        try {
          ws.close();
        } catch (err) {
          console.warn('Error closing WebSocket:', err);
        }
      };
    } catch (err) {
      console.warn('WebSocket not available, real-time updates disabled');
      return () => {}; // Return empty cleanup function
    }
  }, [enabled, status, severity, zone, ownOnly, userId]);

  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update incident');
      }

      const data = await response.json();
      setIncidents(prev => prev.map(i => 
        i.id === id ? data.incident : i
      ));

      return data.incident;
    } catch (err) {
      console.error('Error updating incident:', err);
      throw err;
    }
  };

  const createIncident = async (incident: Omit<Incident, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incident),
      });

      if (!response.ok) {
        throw new Error('Failed to create incident');
      }

      const data = await response.json();
      setIncidents(prev => [...prev, data.incident]);
      return data.incident;
    } catch (err) {
      console.error('Error creating incident:', err);
      throw err;
    }
  };

  return {
    incidents,
    loading,
    error,
    updateIncident,
    createIncident,
  };
}
