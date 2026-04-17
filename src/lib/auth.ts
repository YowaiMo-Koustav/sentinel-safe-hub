// Mock role state for prototype (no backend yet).
// Replace with Lovable Cloud auth in next prompt.
export type Role = "guest" | "staff" | "responder" | "admin";

const KEY = "sentinel.role";
const NAME_KEY = "sentinel.name";

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(KEY) as Role) || null;
}

export function setRole(role: Role, name?: string) {
  localStorage.setItem(KEY, role);
  if (name) localStorage.setItem(NAME_KEY, name);
  window.dispatchEvent(new Event("sentinel-auth"));
}

export function getName(): string {
  return localStorage.getItem(NAME_KEY) || "Demo User";
}

export function clearAuth() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(NAME_KEY);
  window.dispatchEvent(new Event("sentinel-auth"));
}

export function roleLabel(r: Role) {
  return { guest: "Guest", staff: "Staff", responder: "Responder", admin: "Admin" }[r];
}
