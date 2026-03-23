/**
 * Reads the current user synchronously from localStorage.
 * No async — available immediately on every render.
 */
export function useCurrentUser() {
  const raw = typeof window !== "undefined" ? localStorage.getItem("nc_user") : null;
  let user: any = null;
  try { user = raw ? JSON.parse(raw) : null; } catch {}

  return {
    user,
    role:          (user?.role ?? null) as "admin" | "teacher" | "student" | null,
    isAdmin:       user?.role === "admin",
    isTeacher:     user?.role === "teacher",
    isStudent:     user?.role === "student",
    isMainAdmin:   user?.isMainAdmin === true,
  };
}
