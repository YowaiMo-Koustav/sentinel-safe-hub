import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Zone = Database["public"]["Tables"]["zones"]["Row"];
export type EvacuationPath = Database["public"]["Tables"]["evacuation_paths"]["Row"];
export type SystemStatus = Database["public"]["Tables"]["system_status"]["Row"];
export type IncidentUpdate = Database["public"]["Tables"]["incident_updates"]["Row"];

export function useZones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    supabase.from("zones").select("*").order("name").then(({ data }) => {
      if (active) { setZones((data ?? []) as Zone[]); setLoading(false); }
    });
    const ch = supabase.channel("zones-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "zones" }, (p) => {
        setZones((curr) => {
          if (p.eventType === "INSERT") return [...curr, p.new as Zone];
          if (p.eventType === "UPDATE") return curr.map((z) => z.id === (p.new as Zone).id ? p.new as Zone : z);
          if (p.eventType === "DELETE") return curr.filter((z) => z.id !== (p.old as Zone).id);
          return curr;
        });
      }).subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, []);
  return { zones, loading };
}

export function useEvacuationPaths() {
  const [paths, setPaths] = useState<EvacuationPath[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    supabase.from("evacuation_paths").select("*").order("name").then(({ data }) => {
      if (active) { setPaths((data ?? []) as EvacuationPath[]); setLoading(false); }
    });
    return () => { active = false; };
  }, []);
  return { paths, loading };
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  useEffect(() => {
    let active = true;
    supabase.from("system_status").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { if (active) setStatus((data as SystemStatus) ?? null); });
    const ch = supabase.channel("status-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_status" },
        (p) => setStatus(p.new as SystemStatus))
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, []);
  return status;
}

export function useIncidentUpdates(incidentId: string | undefined) {
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  useEffect(() => {
    if (!incidentId) return;
    let active = true;
    supabase.from("incident_updates").select("*").eq("incident_id", incidentId).order("created_at", { ascending: true })
      .then(({ data }) => { if (active) setUpdates((data ?? []) as IncidentUpdate[]); });
    const ch = supabase.channel(`updates-${incidentId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "incident_updates", filter: `incident_id=eq.${incidentId}` },
        (p) => setUpdates((curr) => [...curr, p.new as IncidentUpdate]))
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [incidentId]);
  return updates;
}
