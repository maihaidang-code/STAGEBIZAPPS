import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "../types";
import { api, getStoredToken, removeStoredToken, setStoredToken } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; name: string; bio?: string; avatar?: string }) => Promise<void>;
  logout: () => void;
  switchDemoAccount: (user: User, password?: string) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  updateUserLocally: (updated: Partial<User>) => void;
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  authModalState: { isOpen: boolean; initialTab: "login" | "register" };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; initialTab: "login" | "register" }>({
    isOpen: false,
    initialTab: "login",
  });

  const refreshCurrentUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      console.warn("Auth token invalid or expired:", err);
      removeStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  const login = async (identifier: string, pass: string) => {
    setIsLoading(true);
    try {
      const authData = await api.login(identifier, pass);
      setStoredToken(authData.token);
      setToken(authData.token);
      setUser(authData.user);
      setAuthModalState({ isOpen: false, initialTab: "login" });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { username: string; email: string; password: string; name: string; bio?: string; avatar?: string }) => {
    setIsLoading(true);
    try {
      const authData = await api.register(data);
      setStoredToken(authData.token);
      setToken(authData.token);
      setUser(authData.user);
      setAuthModalState({ isOpen: false, initialTab: "login" });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const switchDemoAccount = async (demoUser: User, password = "123456") => {
    await login(demoUser.username, password);
  };

  const updateUserLocally = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthModalState({ isOpen: true, initialTab: mode });
  };

  const closeAuthModal = () => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        switchDemoAccount,
        refreshCurrentUser,
        updateUserLocally,
        openAuthModal,
        closeAuthModal,
        authModalState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
