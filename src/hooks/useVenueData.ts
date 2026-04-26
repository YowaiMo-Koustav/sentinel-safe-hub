import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Zone {
  id: string;
  name: string;
  building?: string | null;
  floor?: string | null;
  capacity?: number | null;
  status: string;
  evacuation_path_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvacuationPath {
  id: string;
  name: string;
  from_zone: string;
  to_zone: string;
  steps: any;
  status: string;
  estimated_seconds?: number | null;
  created_at: string;
  updated_at: string;
}

export interface SystemStatus {
  id: string;
  sensors_online: number;
  sensors_total: number;
  network_ok: boolean;
  power_ok: boolean;
  responders_available: number;
  staff_on_duty: number;
  last_heartbeat?: string;
  updated_at: string;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  actor_id?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  new_status?: string | null;
  message: string;
  created_at: string;
  event_type?: string;
}

export function useZones(params?: { status?: string }) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      let q = supabase.from("zones").select("*").order("name");
      if (params?.status) q = q.eq("status", params.status as any);
      const { data, error } = await q;
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setZones([]);
      } else {
        setZones((data ?? []) as Zone[]);
        setError(null);
      }
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel("zones-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "zones" }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [params?.status]);

  return { zones, loading, error };
}

export function useEvacuationPaths(params?: { status?: string; from_zone?: string }) {
  const [paths, setPaths] = useState<EvacuationPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      let q = supabase.from("evacuation_paths").select("*").order("name");
      if (params?.status) q = q.eq("status", params.status as any);
      if (params?.from_zone) q = q.eq("from_zone", params.from_zone);
      const { data, error } = await q;
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setPaths([]);
      } else {
        setPaths((data ?? []) as EvacuationPath[]);
        setError(null);
      }
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel("paths-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "evacuation_paths" }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [params?.status, params?.from_zone]);

  return { paths, loading, error, dynamicPaths: paths };
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("system_status")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setStatus((data as SystemStatus) ?? null);
    };
    load();

    const ch = supabase
      .channel("system-status-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_status" }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
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
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("incident_updates")
        .select("*")
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        setUpdates((data ?? []) as IncidentUpdate[]);
        setLoading(false);
      }
    };
    load();

    const ch = supabase
      .channel(`incident-updates-${incidentId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "incident_updates", filter: `incident_id=eq.${incidentId}` },
        (payload) => setUpdates((prev) => [...prev, payload.new as IncidentUpdate])
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [incidentId]);

  return { updates, loading };
}
