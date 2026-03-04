import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isOnboarded: boolean;
  setOnboarded: (v: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsOnboarded(localStorage.getItem('aidline_onboarded') === 'true');
      }
      setLoading(false);
    });

    // Try to get existing session, otherwise sign in anonymously
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        setIsOnboarded(localStorage.getItem('aidline_onboarded') === 'true');
        setLoading(false);
      } else {
        // Auto sign in anonymously
        const { data, error } = await supabase.auth.signInAnonymously();
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setOnboarded = (v: boolean) => {
    setIsOnboarded(v);
    localStorage.setItem('aidline_onboarded', v ? 'true' : 'false');
  };

  const signOut = async () => {
    localStorage.removeItem('aidline_onboarded');
    await supabase.auth.signOut();
    // Re-sign in anonymously after sign out
    const { data } = await supabase.auth.signInAnonymously();
    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    setIsOnboarded(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isOnboarded, setOnboarded, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
