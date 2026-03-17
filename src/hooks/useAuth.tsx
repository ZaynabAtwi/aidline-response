import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setUserId } from '@/integrations/mysql/client';

interface User {
  id: string;
  is_anonymous: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOnboarded: boolean;
  roles: string[];
  setOnboarded: (v: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const existingId = localStorage.getItem('aidline_user_id');

    if (existingId) {
      try {
        const data = await api.auth.me();
        setUser(data.user);
        setRoles(data.roles || []);
        setIsOnboarded(localStorage.getItem('aidline_onboarded') === 'true');
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('aidline_user_id');
      }
    }

    try {
      const data = await api.auth.anonymous();
      setUserId(data.user.id);
      setUser(data.user);
      setRoles(['displaced_user']);
    } catch {
      console.error('Failed to create anonymous user');
    }
    setLoading(false);
  };

  const setOnboarded = (v: boolean) => {
    setIsOnboarded(v);
    localStorage.setItem('aidline_onboarded', v ? 'true' : 'false');
  };

  const signOut = async () => {
    localStorage.removeItem('aidline_onboarded');
    localStorage.removeItem('aidline_user_id');

    try {
      const data = await api.auth.anonymous();
      setUserId(data.user.id);
      setUser(data.user);
      setRoles(['displaced_user']);
    } catch {
      console.error('Failed to reset identity');
    }
    setIsOnboarded(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOnboarded, roles, setOnboarded, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
