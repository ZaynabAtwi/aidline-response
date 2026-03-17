import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/integrations/mysql/client';

interface User {
  id: string;
  full_name: string | null;
  phone: string | null;
  preferred_language: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOnboarded: boolean;
  setOnboarded: (v: boolean) => void;
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
    try {
      const existingId = localStorage.getItem(USER_ID_KEY);
      const { user: userData } = await api.auth.anonymousSignIn(existingId || undefined);

      if (userData) {
        setUser(userData);
        localStorage.setItem(USER_ID_KEY, userData.id);
        setIsOnboarded(localStorage.getItem('aidline_onboarded') === 'true');
      }
    } catch {
      // API might not be available - create a local-only user for demo
      const existingId = localStorage.getItem(USER_ID_KEY);
      if (existingId) {
        setUser({ id: existingId, full_name: null, phone: null, preferred_language: null, created_at: new Date().toISOString() });
        setIsOnboarded(localStorage.getItem('aidline_onboarded') === 'true');
      } else {
        const id = crypto.randomUUID();
        localStorage.setItem(USER_ID_KEY, id);
        setUser({ id, full_name: null, phone: null, preferred_language: null, created_at: new Date().toISOString() });
      }
    } finally {
      setLoading(false);
    }
  };

  const setOnboarded = (v: boolean) => {
    setIsOnboarded(v);
    localStorage.setItem('aidline_onboarded', v ? 'true' : 'false');
  };

  const signOut = async () => {
    localStorage.removeItem('aidline_onboarded');
    localStorage.removeItem(USER_ID_KEY);
    setIsOnboarded(false);

    // Create new anonymous user
    try {
      const { user: newUser } = await api.auth.anonymousSignIn();
      if (newUser) {
        setUser(newUser);
        localStorage.setItem(USER_ID_KEY, newUser.id);
      }
    } catch {
      const id = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, id);
      setUser({ id, full_name: null, phone: null, preferred_language: null, created_at: new Date().toISOString() });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOnboarded, setOnboarded, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
