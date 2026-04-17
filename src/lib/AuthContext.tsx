import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "guest" | "staff" | "responder" | "admin";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  displayName: string;
  loading: boolean;
  rolesLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_RANK: AppRole[] = ["admin", "responder", "staff", "guest"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    // 1. Synchronous listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess) {
        setRoles([]);
        setDisplayName("");
      } else {
        // Defer DB calls to avoid deadlock inside the callback
        setTimeout(() => {
          loadRolesAndProfile(sess.user.id);
        }, 0);
      }
    });

    // 2. Then check existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess) loadRolesAndProfile(sess.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadRolesAndProfile(uid: string) {
    setRolesLoading(true);
    const [{ data: roleRows }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("display_name").eq("id", uid).maybeSingle(),
    ]);
    setRoles((roleRows ?? []).map((r) => r.role as AppRole));
    setDisplayName(profile?.display_name ?? "");
    setRolesLoading(false);
  }

  const primaryRole = ROLE_RANK.find((r) => roles.includes(r)) ?? null;

  const value: AuthContextValue = {
    user,
    session,
    roles,
    primaryRole,
    displayName,
    loading,
    rolesLoading,
    hasRole: (r) => roles.includes(r),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  guest: "Guest",
  staff: "Staff",
  responder: "Responder",
  admin: "Admin",
};

export function defaultRouteForRole(role: AppRole | null): string {
  switch (role) {
    case "admin": return "/dashboard";
    case "staff": return "/dashboard";
    case "responder": return "/responder";
    case "guest": return "/sos";
    default: return "/";
  }
}
