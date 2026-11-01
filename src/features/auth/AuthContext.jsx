import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { AUTH_MESSAGES } from "@/constants/auth";
import { api, setUnauthorizedHandler } from "@/lib/api";
import { ACCENT_STORAGE_KEY, THEME_STORAGE_KEY } from "@/constants/theme";

function applyUserAppearance(user) {
  const mode = user?.preferences?.appearance?.mode;
  const accent = user?.preferences?.appearance?.accentId;
  try {
    if (mode) localStorage.setItem(THEME_STORAGE_KEY, mode);
    if (accent) localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch {
    /* private mode */
  }
  // Dispatch so open tabs can react if needed
  window.dispatchEvent(new Event("dentalcore-appearance"));
}


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setUnauthorizedHandler(() => setUser(null));

    api(API_ENDPOINTS.ME, { signal: controller.signal })
      .then((data) => {
      applyUserAppearance(data.user);
      setUser(data.user);
    })
      .catch(() => {})
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
    applyUserAppearance(data.user);
    setUser(data.user);
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    const data = await api(API_ENDPOINTS.REGISTER, {
      method: HTTP_METHODS.POST,
      body: { name, email, password },
    });
    applyUserAppearance(data.user);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api(API_ENDPOINTS.LOGOUT, { method: HTTP_METHODS.POST });
    } finally {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api(API_ENDPOINTS.USERS_ME);
      applyUserAppearance(data.user);
      setUser(data.user);
      return data.user;
    } catch {
      const data = await api(API_ENDPOINTS.ME);
      applyUserAppearance(data.user);
      setUser(data.user);
      return data.user;
    }
  }, []);

  const setUserState = useCallback((next) => setUser(next), []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      signup,
      logout,
      refreshUser,
      setUser: setUserState,
    }),
    [user, isLoading, login, signup, logout, refreshUser, setUserState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error(AUTH_MESSAGES.MISSING_PROVIDER);
  return context;
}
