import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { AUTH_MESSAGES } from "@/constants/auth";
import { api, setUnauthorizedHandler } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until we know if a session exists

  // Restore the session from the httpOnly cookie, and sign out if the server ever says 401.
  useEffect(() => {
    const controller = new AbortController();
    setUnauthorizedHandler(() => setUser(null));

    api(API_ENDPOINTS.ME, { signal: controller.signal })
      .then((data) => setUser(data.user))
      .catch(() => {}) // not signed in
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const login = useCallback(async ({ email, password, remember }) => {
    const data = await api(API_ENDPOINTS.LOGIN, {
      method: HTTP_METHODS.POST,
      body: { email, password, remember },
    });
    setUser(data.user);
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    const data = await api(API_ENDPOINTS.REGISTER, {
      method: HTTP_METHODS.POST,
      body: { name, email, password },
    });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api(API_ENDPOINTS.LOGOUT, { method: HTTP_METHODS.POST });
    } finally {
      setUser(null); // ProtectedRoute then redirects to /login
    }
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), isLoading, login, signup, logout }),
    [user, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error(AUTH_MESSAGES.MISSING_PROVIDER);
  return context;
}
