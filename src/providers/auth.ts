import type { AuthProvider } from "@refinedev/core";
import { BACKEND_URL } from "@/constants/index";

const TOKEN_KEY = "nc_token";
const USER_KEY  = "nc_user";

export const getToken = (): string =>
  typeof window !== "undefined" ? (localStorage.getItem(TOKEN_KEY) ?? "") : "";

export const getCurrentUser = (): any => {
  const raw = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: { name: "LoginError", message: json.error ?? "Login failed." } };
      }
      localStorage.setItem(TOKEN_KEY, json.token);
      localStorage.setItem(USER_KEY, JSON.stringify(json.user));
      return { success: true, redirectTo: "/" };
    } catch {
      return { success: false, error: { name: "NetworkError", message: "Network error — is the server running?" } };
    }
  },

  register: async ({ email, password, name, role }: any) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: { name: "RegisterError", message: json.error ?? "Registration failed." } };
      }
      localStorage.setItem(TOKEN_KEY, json.token);
      localStorage.setItem(USER_KEY, JSON.stringify(json.user));
      return { success: true, redirectTo: "/" };
    } catch {
      return { success: false, error: { name: "NetworkError", message: "Network error — is the server running?" } };
    }
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = getToken();
    if (!token) return { authenticated: false, redirectTo: "/login" };

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return { authenticated: false, redirectTo: "/login" };
      }
      const { data } = await res.json();
      // Always refresh the stored user
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      return { authenticated: true };
    } catch {
      // Network down — trust local token, don't log out
      return { authenticated: true };
    }
  },

  getIdentity: async () => {
    return getCurrentUser();
  },

  getPermissions: async () => {
    const u = getCurrentUser();
    return u?.role ?? null;
  },

  onError: async (error) => {
    if (error?.statusCode === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  },
};
