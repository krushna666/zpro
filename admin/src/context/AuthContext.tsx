import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { apiClient } from '../lib/apiClient';
import { authStorage, type StoredAdminUser } from '../lib/authStorage';

interface AuthContextValue {
  user: StoredAdminUser | null;
  isAuthenticated: boolean;
  login: (user: StoredAdminUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredAdminUser | null>(() => authStorage.getUser());

  const login = (nextUser: StoredAdminUser, accessToken: string, refreshToken: string) => {
    authStorage.setSession(nextUser, accessToken, refreshToken);
    setUser(nextUser);
  };

  const logout = () => {
    const refreshToken = authStorage.getRefreshToken();
    authStorage.clear();
    setUser(null);
    if (refreshToken) {
      // Best-effort server-side revocation — the client-side session is already gone either way.
      void apiClient.post('/auth/logout', { refreshToken }).catch(() => undefined);
    }
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
