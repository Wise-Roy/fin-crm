"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "./api";
import { useAuth } from "./auth-context";

export interface ThemeConfig {
  orgDisplayName?: string;
  logoUrl?: string;
  colors: {
    sidebar: string;
    sidebarText: string;
    navbar: string;
    navbarText: string;
    page: string;
    accent: string;
  };
}

const DEFAULT_THEME: ThemeConfig = {
  colors: {
    sidebar: "#0A0A0A",
    sidebarText: "#FFFFFF",
    navbar: "#FFFFFF",
    navbarText: "#111111",
    page: "#F4F4F4",
    accent: "#0A0A0A",
  },
};

interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  saveTheme: (theme: ThemeConfig) => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeToDOM(theme: ThemeConfig) {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty("--sidebar", c.sidebar);
  root.style.setProperty("--sidebar-foreground", c.sidebarText);
  root.style.setProperty("--navbar", c.navbar);
  root.style.setProperty("--navbar-foreground", c.navbarText);
  root.style.setProperty("--background", c.page);
  root.style.setProperty("--primary", c.accent);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { appUser } = useAuth();
  const [theme, setThemeState] = useState<ThemeConfig>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  // Fetch theme on mount when user is logged in
  useEffect(() => {
    if (!appUser) {
      setLoading(false);
      return;
    }

    api.config
      .get()
      .then((res) => {
        if (res.config) {
          const raw = res.config as unknown as ThemeConfig;
          const merged: ThemeConfig = { ...DEFAULT_THEME, ...raw, colors: { ...DEFAULT_THEME.colors, ...raw.colors } };
          setThemeState(merged);
          applyThemeToDOM(merged);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [appUser]);

  // Apply theme whenever it changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = useCallback((t: ThemeConfig) => {
    setThemeState(t);
    applyThemeToDOM(t);
  }, []);

  const saveTheme = useCallback(async (t: ThemeConfig) => {
    await api.config.update(t as unknown as Record<string, unknown>);
    setThemeState(t);
    applyThemeToDOM(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, saveTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
