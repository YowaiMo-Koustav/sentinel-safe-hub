import { useEffect, useState } from "react";
import { getRole, getName, type Role } from "./auth";

export function useAuth() {
  const [role, setRoleState] = useState<Role | null>(getRole());
  const [name, setName] = useState(getName());

  useEffect(() => {
    const handler = () => {
      setRoleState(getRole());
      setName(getName());
    };
    window.addEventListener("sentinel-auth", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("sentinel-auth", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { role, name, isAuthed: !!role };
}
