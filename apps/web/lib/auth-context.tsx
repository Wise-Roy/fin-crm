"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { api, setToken, getToken, clearToken, ApiError } from "./api";
import type { AuthUser, Role } from "./types";

const USER_KEY = "fincrm_user";

interface AuthState {
  appUser: AuthUser | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    organizationName: string,
    phone: string
  ) => Promise<string>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  signOut: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(data: {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenant: { id: string; name: string; subdomain: string };
}): AuthUser {
  const initials = data.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    orgName: data.tenant.name,
    orgId: data.tenant.id,
    orgSubdomain: data.tenant.subdomain,
    initials,
  };
}

function saveUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function loadUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function removeUser() {
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    appUser: null,
    loading: true,
    error: null,
  });

  // On mount: if token exists, validate with /me
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setState({ appUser: null, loading: false, error: null });
      removeUser();
      return;
    }

    api.auth
      .me()
      .then((res) => {
        const user = toAuthUser(res.user);
        saveUser(user);
        setState({ appUser: user, loading: false, error: null });
      })
      .catch(() => {
        clearToken();
        removeUser();
        setState({ appUser: null, loading: false, error: null });
      });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const res = await api.auth.login({ email, password });
      setToken(res.token);
      const user = toAuthUser(res.user);
      saveUser(user);
      setState({ appUser: user, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login failed";
      setState((s) => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string, organizationName: string, phone: string): Promise<string> => {
      setState((s) => ({ ...s, error: null }));
      try {
        const res = await api.auth.signup({ name, email, password, organizationName, phone }) as unknown as { email: string; message: string };
        return res.email;
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Signup failed";
        setState((s) => ({ ...s, loading: false, error: msg }));
        throw new Error(msg);
      }
    },
    []
  );

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const res = await api.auth.verifyOtp({ email, otp });
      setToken(res.token);
      const user = toAuthUser(res.user);
      saveUser(user);
      setState({ appUser: user, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "OTP verification failed";
      setState((s) => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    removeUser();
    setState({ appUser: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signUp, verifyOtp, signOut, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
