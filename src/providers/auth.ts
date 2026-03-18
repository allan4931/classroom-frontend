import type { AuthProvider } from "@refinedev/core";
import { BACKEND_URL } from "@/constants/index";
import { SecureStorage, CSRFProtection, SecureFetch, InputSanitizer } from "@/lib/security";

const TOKEN_KEY = "nc_token";
const USER_KEY  = "nc_user";

export const getToken = (): string => {
  if (typeof window === "undefined") return "";
  return SecureStorage.getItem(TOKEN_KEY) || "";
};

export const getCurrentUser = (): any => {
  return SecureStorage.getItem(USER_KEY);
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      // Validate and sanitize inputs
      const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
      if (!InputSanitizer.validateEmail(sanitizedEmail)) {
        return { success: false, error: { name: "ValidationError", message: "Invalid email format" } };
      }

      const res = await SecureFetch.apiRequest(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email: sanitizedEmail, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: { name: "LoginError", message: json.error ?? "Login failed." } };
      }
      SecureStorage.setItem(TOKEN_KEY, json.token);
      SecureStorage.setItem(USER_KEY, json.user);
      return { success: true, redirectTo: "/" };
    } catch {
      return { success: false, error: { name: "NetworkError", message: "Network error — is the server running?" } };
    }
  },

  register: async ({ email, password, name, role }: any) => {
    try {
      // Validate and sanitize inputs
      const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
      const sanitizedName = InputSanitizer.sanitizeName(name);
      
      if (!InputSanitizer.validateEmail(sanitizedEmail)) {
        return { success: false, error: { name: "ValidationError", message: "Invalid email format" } };
      }
      
      if (!sanitizedName || sanitizedName.length < 2) {
        return { success: false, error: { name: "ValidationError", message: "Name must be at least 2 characters long" } };
      }

      const res = await SecureFetch.apiRequest(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        body: JSON.stringify({ email: sanitizedEmail, password, name: sanitizedName, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: { name: "RegisterError", message: json.error ?? "Registration failed." } };
      }
      SecureStorage.setItem(TOKEN_KEY, json.token);
      SecureStorage.setItem(USER_KEY, json.user);
      return { success: true, redirectTo: "/" };
    } catch {
      return { success: false, error: { name: "NetworkError", message: "Network error — is the server running?" } };
    }
  },

  logout: async () => {
    SecureStorage.removeItem(TOKEN_KEY);
    SecureStorage.removeItem(USER_KEY);
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = getToken();
    if (!token) return { authenticated: false, redirectTo: "/login" };

    try {
      const res = await SecureFetch.authenticatedRequest(`${BACKEND_URL}/api/auth/me`, token);
      if (!res.ok) {
        SecureStorage.removeItem(TOKEN_KEY);
        SecureStorage.removeItem(USER_KEY);
        return { authenticated: false, redirectTo: "/login" };
      }
      const { data } = await res.json();
      // Always refresh the stored user
      SecureStorage.setItem(USER_KEY, data);
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
      SecureStorage.removeItem(TOKEN_KEY);
      SecureStorage.removeItem(USER_KEY);
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  },
};
