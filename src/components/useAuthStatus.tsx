"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSubscriptionActive } from "@/lib/subscription";

type AuthStatus = {
  loading: boolean;
  isAuthenticated: boolean;
  isActive: boolean;
  isAdmin: boolean;
  username: string;
  refresh: () => void;
};

const AuthStatusContext = createContext<AuthStatus | null>(null);

export function AuthStatusProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/user/me");
      if (!res.ok) {
        setIsAuthenticated(false);
        setIsActive(false);
        setIsAdmin(false);
        setUsername("");
        return;
      }
      const data = await res.json().catch(() => null);
      const user = data?.user;
      if (!user) {
        setIsAuthenticated(false);
        setIsActive(false);
        setIsAdmin(false);
        setUsername("");
        return;
      }
      const active = isSubscriptionActive(user?.subscription, Boolean(user?.isAdmin));
      setIsAuthenticated(true);
      setIsActive(active);
      setIsAdmin(Boolean(user?.isAdmin));
      setUsername(user?.username || "");
    } catch {
      setIsAuthenticated(false);
      setIsActive(false);
      setIsAdmin(false);
      setUsername("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function loadGuarded() {
      if (!mounted) return;
      await load();
    }
    loadGuarded();
    function onAuthChanged() {
      loadGuarded();
    }
    window.addEventListener("auth-changed", onAuthChanged);
    return () => {
      mounted = false;
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, []);

  const value = useMemo<AuthStatus>(
    () => ({ loading, isAuthenticated, isActive, isAdmin, username, refresh: load }),
    [loading, isAuthenticated, isActive, isAdmin, username]
  );

  return <AuthStatusContext.Provider value={value}>{children}</AuthStatusContext.Provider>;
}

export function useAuthStatus() {
  const context = useContext(AuthStatusContext);
  if (context) return context;
  return {
    loading: true,
    isAuthenticated: false,
    isActive: false,
    isAdmin: false,
    username: "",
    refresh: () => {}
  };
}
