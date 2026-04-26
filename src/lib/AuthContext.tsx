import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role: AppRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_RANK: AppRole[] = ["admin", "responder", "staff", "guest"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer extra DB calls so Supabase listener doesn't deadlock
        setTimeout(() => loadRolesAndProfile(sess.user.id), 0);
      } else {
        setRoles([]);
        setDisplayName("");
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadRolesAndProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const loadRolesAndProfile = async (userId: string) => {
    setRolesLoading(true);
    try {
      const [{ data: roleRows }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
      ]);
      setRoles((roleRows?.map((r) => r.role) as AppRole[]) ?? []);
      setDisplayName(profile?.display_name ?? "");
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setRolesLoading(false);
    }
  };

  const primaryRole = ROLE_RANK.find((r) => roles.includes(r)) ?? null;

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName: string, role: AppRole) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { display_name: displayName, role },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    setDisplayName("");
  };

  const value: AuthContextValue = {
    user,
    session,
    roles,
    primaryRole,
    displayName,
    loading,
    rolesLoading,
    hasRole: (r) => roles.includes(r),
    signIn,
    signUp,
    signOut,
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
