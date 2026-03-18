/**
 * Custom data provider — always injects the JWT token.
 * Implements the Refine DataProvider interface directly with fetch.
 */
import type { DataProvider, HttpError } from "@refinedev/core";
import { BACKEND_URL } from "@/constants/index";

const TOKEN_KEY = "nc_token";

function getToken(): string {
  return typeof window !== "undefined" ? (localStorage.getItem(TOKEN_KEY) ?? "") : "";
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: any = {};
  try { body = JSON.parse(text); } catch {}

  if (!res.ok) {
    const error: HttpError = {
      message: body?.error ?? body?.message ?? `Request failed (${res.status})`,
      statusCode: res.status,
    };
    throw error;
  }
  return body;
}

function buildUrl(path: string, params?: Record<string, string | number>): string {
  const url = new URL(`${BACKEND_URL}/${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }
  return url.toString();
}

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const page     = pagination?.currentPage ?? 1;
    const pageSize = pagination?.pageSize ?? 10;
    const params: Record<string, string | number> = { page, limit: pageSize };

    filters?.forEach((filter) => {
      if (!("field" in filter)) return;
      const { field, value } = filter;
      const v = String(value ?? "");
      if (!v) return;

      if (resource === "subjects") {
        if (field === "department") params.department = v;
        if (field === "name" || field === "code" || field === "search") params.search = v;
      } else if (resource === "classes") {
        if (field === "name" || field === "search") params.search = v;
        if (field === "subject") params.subject = v;
        if (field === "teacher") params.teacher = v;
        if (field === "status") params.status = v;
      } else if (resource === "users") {
        if (field === "role") params.role = v;
        if (field === "name" || field === "email" || field === "search") params.search = v;
      } else if (resource === "departments") {
        if (field === "name" || field === "code" || field === "search") params.search = v;
      }
    });

    const url = buildUrl(`api/${resource}`, params);
    const res = await fetch(url, { headers: authHeaders() });
    const body = await handleResponse<any>(res);

    return {
      data: body.data ?? [],
      total: body.pagination?.total ?? (body.data?.length ?? 0),
    };
  },

  create: async ({ resource, variables }) => {
    const res = await fetch(buildUrl(`api/${resource}`), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(variables),
    });
    const body = await handleResponse<any>(res);
    return { data: body.data ?? body };
  },

  getOne: async ({ resource, id }) => {
    const res = await fetch(buildUrl(`api/${resource}/${id}`), {
      headers: authHeaders(),
    });
    const body = await handleResponse<any>(res);
    return { data: body.data ?? body };
  },

  update: async ({ resource, id, variables }) => {
    const res = await fetch(buildUrl(`api/${resource}/${id}`), {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(variables),
    });
    const body = await handleResponse<any>(res);
    return { data: body.data ?? body };
  },

  deleteOne: async ({ resource, id }) => {
    const res = await fetch(buildUrl(`api/${resource}/${id}`), {
      method: "DELETE",
      headers: authHeaders(),
    });
    const body = await handleResponse<any>(res);
    return { data: body.data ?? body };
  },

  getApiUrl: () => BACKEND_URL,

  // Unused but required by interface
  custom: async ({ url, method, payload, headers }) => {
    const res = await fetch(url, {
      method: method?.toUpperCase() ?? "GET",
      headers: { ...authHeaders(), ...(headers ?? {}) },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const body = await handleResponse<any>(res);
    return { data: body };
  },
};
