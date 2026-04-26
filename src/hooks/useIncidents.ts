import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

export function useIncidents({
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

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        let q = supabase.from("incidents").select("*").order("created_at", { ascending: false });
        if (ownOnly && userId) q = q.eq("reporter_id", userId);
        if (status) q = q.eq("status", status as any);
        if (severity) q = q.eq("severity", severity as any);
        if (zone) q = q.eq("zone", zone);

        const { data, error } = await q;
        if (cancelled) return;
        if (error) {
          setError(error.message);
          setIncidents([]);
        } else {
          setIncidents((data ?? []) as Incident[]);
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    // Realtime subscription
    const channel = supabase
      .channel("incidents-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incidents" },
        (payload) => {
          setIncidents((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Incident;
              if (ownOnly && userId && row.reporter_id !== userId) return prev;
              if (prev.find((i) => i.id === row.id)) return prev;
              return [row, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Incident;
              return prev.map((i) => (i.id === row.id ? row : i));
            }
            if (payload.eventType === "DELETE") {
              const oldRow = payload.old as { id: string };
              return prev.filter((i) => i.id !== oldRow.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [ownOnly, userId, status, severity, zone, enabled]);

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
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("incidents").select("*").eq("id", id).maybeSingle();
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setIncident(null);
      } else {
        setIncident((data as Incident) ?? null);
        setError(null);
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`incident-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "incidents", filter: `id=eq.${id}` },
        (payload) => setIncident(payload.new as Incident)
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [id]);

  return { incident, loading, error };
}
