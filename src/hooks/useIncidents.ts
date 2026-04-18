import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IncidentRow } from "@/lib/incidents";

interface Options {
  /** if true, only the current user's incidents (guests). If false/undefined, fetch all (staff+). */
  ownOnly?: boolean;
  userId?: string | null;
  enabled?: boolean;
}

export function useIncidents({ ownOnly, userId, enabled = true }: Options = {}) {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      let q = supabase.from("incidents").select("*").order("created_at", { ascending: false }).limit(200);
      if (ownOnly && userId) q = q.eq("reporter_id", userId);
      const { data, error } = await q;
      if (cancelled) return;
      if (error) setError(error.message);
      else setIncidents((data ?? []) as IncidentRow[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`incidents-live-${ownOnly ? "own" : "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, (payload) => {
        setIncidents((curr) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as IncidentRow;
            if (ownOnly && userId && row.reporter_id !== userId) return curr;
            if (curr.find((i) => i.id === row.id)) return curr;
            return [row, ...curr];
          }
          if (payload.eventType === "UPDATE") {
            const row = payload.new as IncidentRow;
            return curr.map((i) => (i.id === row.id ? row : i));
          }
          if (payload.eventType === "DELETE") {
            const row = payload.old as IncidentRow;
            return curr.filter((i) => i.id !== row.id);
          }
          return curr;
        });
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [ownOnly, userId, enabled]);

  return { incidents, loading, error };
}

export function useIncident(id: string | undefined) {
  const [incident, setIncident] = useState<IncidentRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    supabase.from("incidents").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (!cancelled) { setIncident((data as IncidentRow) ?? null); setLoading(false); }
    });

    const channel = supabase
      .channel(`incident-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "incidents", filter: `id=eq.${id}` },
        (payload) => setIncident(payload.new as IncidentRow))
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [id]);

  return { incident, loading };
}
