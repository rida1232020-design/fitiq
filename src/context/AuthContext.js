import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { API_URL } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [captain, setCaptain] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId) => {
    const { data: prof } = await supabase
      .from('profiles').select('*').eq('id', userId).single();
    setProfile(prof);

    if (prof?.role === 'captain') {
      const { data: cap } = await supabase
        .from('captains').select('*').eq('id', userId).single();
      setCaptain(cap);
    }
  };

  const signInWithPi = async (isAuto = false) => {
    try {
      if (!window.Pi) {
        console.warn('Pi SDK not loaded on window.');
        return;
      }

      // Treat Pi.init(...) as a Promise; await it fully before calling Pi.authenticate(...)
      await window.Pi.init({ version: '2.0', sandbox: true });

      const onIncompletePaymentFound = async (payment) => {
        console.log('Incomplete payment found on initialization:', payment);
        try {
          await fetch(`${API_URL}/api/payments/incomplete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment }),
          });
        } catch (err) {
          console.error('Failed to resolve incomplete payment:', err);
        }
      };

      // Authenticate with Pi using "username" scope
      const authResult = await window.Pi.authenticate(['username'], onIncompletePaymentFound);
      console.log('Pi authenticated successfully:', authResult);

      setLoading(true);

      // Send token to backend
      const response = await fetch(`${API_URL}/api/auth/pi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: authResult.accessToken }),
      });

      if (!response.ok) {
        throw new Error('Backend failed to validate Pi credentials.');
      }

      const { email, password, username } = await response.json();

      // Sign in to Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInError) {
        console.log('First time Pi user, registering profile...');
        // Sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        // Insert into profiles
        const { error: profileError } = await supabase.from('profiles').insert({
          id: signUpData.user.id,
          role: 'athlete',
          full_name: username,
          avatar_emoji: '💪'
        });
        if (profileError) console.error('Profile insertion error:', profileError);
        
        // Load the profile
        await loadProfile(signUpData.user.id);
      } else {
        await loadProfile(signInData.user.id);
      }
    } catch (err) {
      console.error('Pi Authentication failed:', err);
      if (!isAuto) {
        alert('حدث خطأ أثناء مصادقة Pi Network. يرجى فتح التطبيق داخل متصفح Pi Browser.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        // Automatically trigger Pi authentication when the app loads
        // 500ms delay to guarantee SDK initialization availability
        setTimeout(() => {
          signInWithPi(true);
        }, 500);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else { setProfile(null); setCaptain(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = () => {
    supabase.auth.signOut();
    setUser(null); setProfile(null); setCaptain(null);
  };

  const refreshCaptain = async () => {
    if (!user) return;
    const { data } = await supabase.from('captains').select('*').eq('id', user.id).single();
    setCaptain(data);
  };

  return (
    <AuthContext.Provider value={{ user, profile, captain, loading, signOut, loadProfile, refreshCaptain, signInWithPi }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
