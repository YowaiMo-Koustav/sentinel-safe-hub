import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient, type User } from "@/lib/api";

export type AppRole = "guest" | "staff" | "responder" | "admin";

interface AuthContextValue {
  user: User | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  displayName: string;
  loading: boolean;
  rolesLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_RANK: AppRole[] = ["admin", "responder", "staff", "guest"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    // Check for existing token in localStorage
    const token = localStorage.getItem("auth_token");
    if (token) {
      apiClient.setToken(token);
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      setRolesLoading(true);
      const response = await apiClient.getProfile();
      
      if (response.data) {
        setUser(response.data);
        setRoles(response.data.roles as AppRole[]);
        setDisplayName(response.data.displayName);
      } else {
        // Token invalid, clear it
        localStorage.removeItem("auth_token");
        apiClient.setToken("");
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
      localStorage.removeItem("auth_token");
      apiClient.setToken("");
    } finally {
      setRolesLoading(false);
      setLoading(false);
    }
  };

  const primaryRole = ROLE_RANK.find((r) => roles.includes(r)) ?? null;

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        const { user: userData, token } = response.data;
        
        // Store token
        localStorage.setItem("auth_token", token);
        apiClient.setToken(token);
        
        // Set user data
        setUser(userData);
        setRoles(userData.roles as AppRole[]);
        setDisplayName(userData.displayName);
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    // Clear token and user data
    localStorage.removeItem("auth_token");
    apiClient.setToken("");
    setUser(null);
    setRoles([]);
    setDisplayName("");
  };

  const value: AuthContextValue = {
    user,
    roles,
    primaryRole,
    displayName,
    loading,
    rolesLoading,
    hasRole: (r) => roles.includes(r),
    signIn,
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
