import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export type AppRole = "guest" | "staff" | "responder" | "admin";

interface ExpressUser {
  id: string;
  email: string;
  displayName: string;
  roles: AppRole[];
  iat?: number;
  exp?: number;
}

interface AuthContextValue {
  user: ExpressUser | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  displayName: string;
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role: AppRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_RANK: AppRole[] = ["admin", "responder", "staff", "guest"];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function ExpressAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExpressUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Validate token by getting profile
      fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Invalid token');
      })
      .then(data => {
        setUser(data.user);
      })
      .catch(() => {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const primaryRole = ROLE_RANK.find((r) => user?.roles.includes(r)) ?? null;

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.user);
      localStorage.setItem('authToken', data.token);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string, role: AppRole) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setUser(data.user);
      localStorage.setItem('authToken', data.token);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('authToken');
    }
  };

  const value: AuthContextValue = useMemo(() => ({
    user,
    roles: user?.roles || [],
    primaryRole,
    displayName: user?.displayName || "",
    loading,
    hasRole: (r) => user?.roles.includes(r) || false,
    signIn,
    signUp,
    signOut,
  }), [user, primaryRole, loading, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useExpressAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useExpressAuth must be used inside ExpressAuthProvider");
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
