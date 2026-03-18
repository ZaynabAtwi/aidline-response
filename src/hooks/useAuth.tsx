import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/integrations/mysql/client';

interface User {
  id: string;
  full_name: string | null;
  mother_full_name?: string | null;
  family_name?: string | null;
  sejel_number?: string | null;
  date_of_birth?: string | null;
  generated_identity_id?: string | null;
  intake_completed?: boolean;
  phone: string | null;
  preferred_language: string | null;
  created_at: string;
}

interface IdentityLoginInput {
  full_name: string;
  mother_full_name: string;
  sejel_number: string;
  date_of_birth: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOnboarded: boolean;
  setOnboarded: (v: boolean) => void;
  loginWithIdentity: (payload: IdentityLoginInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_ID_KEY = 'aidline_user_id';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const existingId = localStorage.getItem(USER_ID_KEY);
    if (!existingId) {
      setLoading(false);
      return;
    }

    try {
      const { user: userData, onboarding_completed } = await api.auth.getProfile(existingId);
      if (userData) {
        setUser(userData);
        const onboarded = Boolean(onboarding_completed);
        setIsOnboarded(onboarded);
        localStorage.setItem('aidline_onboarded', onboarded ? 'true' : 'false');
      }
    } catch {
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem('aidline_onboarded');
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

  const loginWithIdentity = async (payload: IdentityLoginInput) => {
    const { user: userData, onboarding_completed } = await api.auth.identityLogin(payload);
    setUser(userData);
    localStorage.setItem(USER_ID_KEY, userData.id);
    const onboarded = Boolean(onboarding_completed);
    setIsOnboarded(onboarded);
    localStorage.setItem('aidline_onboarded', onboarded ? 'true' : 'false');
  };

  const signOut = async () => {
    localStorage.removeItem('aidline_onboarded');
    localStorage.removeItem(USER_ID_KEY);
    setUser(null);
    setIsOnboarded(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOnboarded, setOnboarded, loginWithIdentity, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
