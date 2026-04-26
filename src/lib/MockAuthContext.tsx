import React, { createContext, useContext, useState } from "react";

export type AppRole = "guest" | "staff" | "responder" | "admin";

interface MockUser {
  id: string;
  email: string;
  displayName: string;
  roles: AppRole[];
  createdAt: string;
}

interface AuthContextValue {
  user: MockUser | null;
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

// Mock user database for development
const MOCK_USERS: MockUser[] = [
  {
    id: "1",
    email: "admin@sentinel.com",
    displayName: "Admin User",
    roles: ["admin"],
    createdAt: new Date().toISOString()
  },
  {
    id: "2", 
    email: "staff@sentinel.com",
    displayName: "Staff User",
    roles: ["staff"],
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    email: "responder@sentinel.com", 
    displayName: "Responder User",
    roles: ["responder"],
    createdAt: new Date().toISOString()
  },
  {
    id: "4",
    email: "guest@sentinel.com",
    displayName: "Guest User", 
    roles: ["guest"],
    createdAt: new Date().toISOString()
  }
];

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for stored session on mount
  React.useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const primaryRole = ROLE_RANK.find((r) => user?.roles.includes(r)) ?? null;

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user in mock database (password is ignored for demo)
      const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!foundUser) {
        throw new Error("Invalid credentials");
      }
      
      setUser(foundUser);
      localStorage.setItem('mockUser', JSON.stringify(foundUser));
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string, role: AppRole) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      if (MOCK_USERS.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("User already exists");
      }
      
      const newUser: MockUser = {
        id: Date.now().toString(),
        email,
        displayName,
        roles: [role],
        createdAt: new Date().toISOString()
      };
      
      setUser(newUser);
      localStorage.setItem('mockUser', JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  const value: AuthContextValue = {
    user,
    roles: user?.roles || [],
    primaryRole,
    displayName: user?.displayName || "",
    loading,
    hasRole: (r) => user?.roles.includes(r) || false,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useMockAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useMockAuth must be used inside MockAuthProvider");
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
