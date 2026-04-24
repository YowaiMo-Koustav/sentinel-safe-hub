import { useEffect, useState } from "react";
import { apiClient, type Incident } from "@/lib/api";

interface Options {
  /** if true, only the current user's incidents (guests). If false/undefined, fetch all (staff+). */
  ownOnly?: boolean;
  userId?: string | null;
  status?: string;
  severity?: string;
  zone?: string;
  enabled?: boolean;
}

export function useIncidents({ 
  ownOnly, 
  userId, 
  status, 
  severity, 
  zone, 
  enabled = true 
}: Options = {}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) { 
      setLoading(false); 
      return; 
    }
    
    const load = async () => {
      try {
        setLoading(true);
        
        const params: any = {};
        if (ownOnly) params.own_only = true;
        if (status) params.status = status;
        if (severity) params.severity = severity;
        if (zone) params.zone = zone;
        
        const response = await apiClient.getIncidents(params);
        
        if (response.error) {
          setError(response.error);
          setIncidents([]);
        } else if (response.data) {
          setIncidents(response.data);
          setError(null);
        }
      } catch (err) {
        setError("Failed to load incidents");
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [ownOnly, userId, status, severity, zone, enabled]);

  // Real-time updates using WebSocket
  useEffect(() => {
    // Set up WebSocket connection for real-time updates
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket for incident updates');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'incident_created' || data.type === 'incident_updated') {
          setIncidents(prev => {
            const index = prev.findIndex(i => i.id === data.incident.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = data.incident;
              return updated;
            } else {
              return [data.incident, ...prev];
            }
          });
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return () => {
      ws.close();
    };
  }, []);

  return { incidents, loading, error };
}

export function useIncident(id: string | undefined) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIncident(null);
      setLoading(false);
      return;
    }
    
    const load = async () => {
      try {
        setLoading(true);
        
        const response = await apiClient.getIncident(id);
        
        if (response.error) {
          setError(response.error);
          setIncident(null);
        } else if (response.data) {
          setIncident(response.data);
          setError(null);
        }
      } catch (err) {
        setError("Failed to load incident");
        setIncident(null);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [id]);

  // Real-time updates for specific incident
  useEffect(() => {
    if (!id) return;
    
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if ((data.type === 'incident_created' || data.type === 'incident_updated') && 
            data.incident.id === id) {
          setIncident(data.incident);
        }
        
        if (data.type === 'incident_comment_added' && data.incidentId === id) {
          setIncident(prev => prev ? { ...prev, events: data.events } : null);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    return () => {
      ws.close();
    };
  }, [id]);

  return { incident, loading, error };
}
