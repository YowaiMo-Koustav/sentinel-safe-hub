import { useEffect, useState } from "react";
import { apiClient, type Zone, type EvacuationPath } from "@/lib/api";

export interface SystemStatus {
  id: string;
  status: string;
  message?: string;
  updated_at: string;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  actor_id?: string;
  actor_name?: string;
  event_type: string;
  message?: string;
  created_at: string;
}

export function useZones(params?: { status?: string }) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        const response = await apiClient.getZones(params);
        
        if (response.error) {
          setError(response.error);
          setZones([]);
        } else if (response.data) {
          setZones(response.data);
          setError(null);
        }
      } catch (err) {
        setError("Failed to load zones");
        setZones([]);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [params?.status]);

  // Real-time updates for zones
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'zone_created') {
          setZones(prev => [...prev, data.zone]);
        } else if (data.type === 'zone_updated') {
          setZones(prev => {
            const index = prev.findIndex(z => z.id === data.zone.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = data.zone;
              return updated;
            }
            return prev;
          });
        } else if (data.type === 'zone_deleted') {
          setZones(prev => prev.filter(z => z.id !== data.id));
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    return () => {
      ws.close();
    };
  }, []);

  return { zones, loading, error };
}

export function useEvacuationPaths(params?: { status?: string; from_zone?: string }) {
  const [paths, setPaths] = useState<EvacuationPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dynamicPaths, setDynamicPaths] = useState<EvacuationPath[]>([]);
  
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        const response = await apiClient.getEvacuationPaths(params);
        
        if (response.error) {
          setError(response.error);
          setPaths([]);
          setDynamicPaths([]);
        } else if (response.data) {
          setPaths(response.data);
          setDynamicPaths(response.data);
          setError(null);
        }
      } catch (err) {
        setError("Failed to load evacuation paths");
        setPaths([]);
        setDynamicPaths([]);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [params?.status, params?.from_zone]);

  // Real-time updates for evacuation paths
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'evacuation_path_created') {
          setPaths(prev => [...prev, data.path]);
          setDynamicPaths(prev => [...prev, data.path]);
        } else if (data.type === 'evacuation_path_updated') {
          const updatePaths = (prev: EvacuationPath[]) => {
            const index = prev.findIndex(p => p.id === data.path.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = data.path;
              return updated;
            }
            return prev;
          };
          
          setPaths(updatePaths);
          setDynamicPaths(updatePaths);
        } else if (data.type === 'evacuation_path_deleted') {
          const filterPaths = (prev: EvacuationPath[]) => 
            prev.filter(p => p.id !== data.id);
          
          setPaths(filterPaths);
          setDynamicPaths(filterPaths);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    return () => {
      ws.close();
    };
  }, []);

  return { paths, loading, error, dynamicPaths };
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // For now, use a mock system status since we don't have a dedicated endpoint
        const mockStatus: SystemStatus = {
          id: "1",
          status: "operational",
          message: "All systems operational",
          updated_at: new Date().toISOString(),
        };
        
        setStatus(mockStatus);
      } catch (err) {
        console.error("Failed to load system status:", err);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, []);
  
  return status;
}

export function useIncidentUpdates(incidentId: string | undefined) {
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!incidentId) {
      setUpdates([]);
      setLoading(false);
      return;
    }
    
    const load = async () => {
      try {
        setLoading(true);
        
        const response = await apiClient.getIncident(incidentId);
        
        if (response.data?.events) {
          setUpdates(response.data.events);
        } else {
          setUpdates([]);
        }
      } catch (err) {
        console.error("Failed to load incident updates:", err);
        setUpdates([]);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [incidentId]);

  // Real-time updates for incident events
  useEffect(() => {
    if (!incidentId) return;
    
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'incident_comment_added' && data.incidentId === incidentId) {
          setUpdates(data.events);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    return () => {
      ws.close();
    };
  }, [incidentId]);
  
  return { updates, loading };
}
