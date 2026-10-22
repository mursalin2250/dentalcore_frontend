import { API_MESSAGES, API_URL, HTTP_METHODS, HTTP_STATUS } from "@/constants/api";

// Thrown for every failed request. `fieldErrors` is { field: message } from server validation.
export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

let onUnauthorized = () => {};

// Called when any request comes back 401 (e.g. the session expired).
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function buildUrl(path, params = {}) {
  const url = new URL(`${API_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  }
  return url;
}

// The one place that talks to the backend. Resolves to the response `data`.
export async function api(path, { method = HTTP_METHODS.GET, body, params, signal } = {}) {
  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      credentials: "include", // send the httpOnly auth cookie
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(API_MESSAGES.NETWORK, 0);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    if (response.status === HTTP_STATUS.UNAUTHORIZED) onUnauthorized();
    throw new ApiError(payload?.message || API_MESSAGES.UNKNOWN, response.status, payload?.errors);
  }
  return payload.data;
}
