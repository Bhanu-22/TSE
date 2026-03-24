"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type DatabricksUser = Record<string, unknown>;
const SESSION_KEY = "databricks_user";

function saveUserToSession(user: DatabricksUser): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // sessionStorage unavailable, fail silently
  }
}

function loadUserFromSession(): DatabricksUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DatabricksUser;
  } catch {
    return null;
  }
}

function clearUserFromSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // fail silently
  }
}

interface DatabricksAuthContextValue {
  databricksUser: DatabricksUser | null;
  setDatabricksUser: (user: DatabricksUser | null) => void;
  clearDatabricksUser: () => void;
}

const DatabricksAuthContext = createContext<
  DatabricksAuthContextValue | undefined
>(undefined);

export function DatabricksAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [databricksUser, setDatabricksUserState] =
    useState<DatabricksUser | null>(() => loadUserFromSession());

  const setDatabricksUser = useCallback((user: DatabricksUser | null) => {
    if (user) {
      saveUserToSession(user);
    } else {
      clearUserFromSession();
    }
    setDatabricksUserState(user);
  }, []);

  const clearDatabricksUser = useCallback(() => {
    clearUserFromSession();
    setDatabricksUserState(null);
  }, []);

  const value = useMemo(
    () => ({
      databricksUser,
      setDatabricksUser,
      clearDatabricksUser,
    }),
    [databricksUser, setDatabricksUser, clearDatabricksUser]
  );

  return (
    <DatabricksAuthContext.Provider value={value}>
      {children}
    </DatabricksAuthContext.Provider>
  );
}

export function useDatabricksAuth() {
  const context = useContext(DatabricksAuthContext);
  if (!context) {
    throw new Error(
      "useDatabricksAuth must be used within a DatabricksAuthProvider"
    );
  }
  return context;
}
