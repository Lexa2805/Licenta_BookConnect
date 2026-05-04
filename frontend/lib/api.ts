const BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

type RequestOptions = {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<{ data: T }> {
  let url = BASE_URL + path;

  if (options?.params) {
    const qs = new URLSearchParams();
    for (const [key, val] of Object.entries(options.params)) {
      if (val !== undefined) qs.append(key, String(val));
    }
    const queryString = qs.toString();
    if (queryString) url += (url.includes("?") ? "&" : "?") + queryString;
  }

  const headers: Record<string, string> = { ...options?.headers };
  let fetchBody: BodyInit | undefined;

  if (body !== undefined) {
    if (body instanceof FormData) {
      // Do NOT set Content-Type — browser sets multipart/form-data with the correct boundary
      delete headers["Content-Type"];
      fetchBody = body;
    } else {
      headers["Content-Type"] = "application/json";
      fetchBody = JSON.stringify(body);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: fetchBody,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  if (res.status === 204) {
    return { data: undefined as T };
  }

  const data = (await res.json()) as T;
  return { data };
}

export const api = {
  get: <T = any>(url: string, options?: RequestOptions) =>
    request<T>("GET", url, undefined, options),
  post: <T = any>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", url, body, options),
  patch: <T = any>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", url, body, options),
  put: <T = any>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", url, body, options),
  delete: <T = any>(url: string, options?: RequestOptions) =>
    request<T>("DELETE", url, undefined, options),
};
