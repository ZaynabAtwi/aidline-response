import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as authService from '@/services/authService';
import type { AuthUser as User, AuthSession, OnboardingPayload } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOnboarded: boolean;
  setOnboarded: (v: boolean) => void;
  login: (email: string, password: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  saveOnboarding: (payload: OnboardingPayload) => Promise<void>;
  checkRole: (role: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const session = await authService.restoreSession();
      if (session) {
        setUser(session.user);
        setIsOnboarded(session.onboardingCompleted);
      }
    } catch {
      setUser(null);
      setIsOnboarded(false);
    } finally {
      setLoading(false);
    }
  };

  const setOnboarded = (v: boolean) => {
    setIsOnboarded(v);
    localStorage.setItem('aidline_onboarded', v ? 'true' : 'false');
  };

  const login = async (email: string, password: string) => {
    const session = await authService.login(email, password);
    setUser(session.user);
    const onboarded = Boolean(session.onboardingCompleted);
    setIsOnboarded(onboarded);
    localStorage.setItem('aidline_onboarded', onboarded ? 'true' : 'false');
    return session;
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('aidline_onboarded');
    setUser(null);
    setIsOnboarded(false);
  };

  const saveOnboarding = async (payload: OnboardingPayload) => {
    await authService.saveOnboarding(payload);
    setOnboarded(true);
  };

  const checkRole = async (role: string) => {
    if (!user) return false;
    return authService.checkRole(user.id, role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOnboarded, setOnboarded, login, logout, signOut: logout, saveOnboarding, checkRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
