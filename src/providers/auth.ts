import type { AuthProvider } from "@refinedev/core";
import { BACKEND_URL } from "@/constants/index";

const TOKEN_KEY   = "nc_token";
const REFRESH_KEY = "nc_refresh";
const USER_KEY    = "nc_user";

export const getToken = (): string =>
  typeof window !== "undefined" ? (localStorage.getItem(TOKEN_KEY) ?? "") : "";

export const getCurrentUser = (): any => {
  const raw = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

/** Silently refresh the access token using the stored refresh token */
async function tryRefresh(): Promise<boolean> {
  const refresh = typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null;
  if (!refresh) return false;
  try {
    const res  = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    localStorage.setItem(TOKEN_KEY,   json.token);
    localStorage.setItem(REFRESH_KEY, json.refreshToken);
    return true;
  } catch { return false; }
}

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: { name: "LoginError", message: json.error ?? "Login failed." } };
      }
      localStorage.setItem(TOKEN_KEY,   json.token);
      localStorage.setItem(REFRESH_KEY, json.refreshToken ?? "");
      localStorage.setItem(USER_KEY,    JSON.stringify(json.user));
      return { success: true, redirectTo: "/" };
    } catch {
      return { success: false, error: { name: "NetworkError", message: "Network error — is the server running?" } };
    }
  },

  register: async ({ email, password, name, role }: any) => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: { name: "RegisterError", message: json.error ?? "Registration failed." } };
      }
      if (json.token) {
        localStorage.setItem(TOKEN_KEY,   json.token);
        localStorage.setItem(REFRESH_KEY, json.refreshToken ?? "");
        localStorage.setItem(USER_KEY,    JSON.stringify(json.user));
        return { success: true, redirectTo: "/" };
      }
      return { success: true };
    } catch {
      return { success: false, error: { name: "NetworkError", message: "Network error — is the server running?" } };
    }
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = getToken();
    if (!token) return { authenticated: false, redirectTo: "/login" };
    
    // Simple token validation - just check if it exists and has valid format
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { authenticated: false, redirectTo: "/login" };
      
      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < now) {
        // Token expired, try refresh
        const refreshed = await tryRefresh();
        if (!refreshed) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_KEY);
          localStorage.removeItem(USER_KEY);
          return { authenticated: false, redirectTo: "/login" };
        }
      }
      
      return { authenticated: true };
    } catch {
      // If token parsing fails, try refresh
      const refreshed = await tryRefresh();
      if (!refreshed) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
        return { authenticated: false, redirectTo: "/login" };
      }
      return { authenticated: true };
    }
  },

  getIdentity: async () => getCurrentUser(),

  getPermissions: async () => {
    const u = getCurrentUser();
    return u?.role ?? null;
  },

  onError: async (error) => {
    if (error?.statusCode === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  },
};
