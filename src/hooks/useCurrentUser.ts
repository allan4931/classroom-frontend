/**
 * Read the stored user from localStorage synchronously.
 * Works without any async round-trip — the token is already there.
 */
export function useCurrentUser() {
  const raw = typeof window !== "undefined" ? localStorage.getItem("nc_user") : null;
  let user: any = null;
  try { user = raw ? JSON.parse(raw) : null; } catch {}

  return {
    user,
    role:      (user?.role ?? null) as "admin" | "teacher" | "student" | null,
    isAdmin:   user?.role === "admin",
    isTeacher: user?.role === "teacher",
    isStudent: user?.role === "student",
  };
}
