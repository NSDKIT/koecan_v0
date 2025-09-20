'use client'

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/config/supabase'; // Import isSupabaseConfigured

interface AuthUser extends User {
  role?: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    console.log('useAuth: useEffect started');
    
    if (!isSupabaseConfigured) {
      console.error('useAuth: Supabase is not configured. Skipping authentication logic.');
      setError('Supabaseが設定されていません。');
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      console.log('useAuth: getInitialSession called');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('useAuth: Error getting session:', sessionError);
          throw sessionError;
        }
        console.log('useAuth: Session obtained:', session ? 'present' : 'null');
        
        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          if (mounted) {
            setUser(userData);
            console.log('useAuth: User data set:', userData?.name);
          }
        } else if (mounted) {
          setUser(null);
          console.log('useAuth: No session user, setting user to null.');
        }
      } catch (err) {
        console.error('useAuth: Caught error in getInitialSession:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : '認証エラーが発生しました');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('useAuth: setLoading(false) in finally block.');
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('useAuth: onAuthStateChange event:', event);

        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          setUser(userData);
          console.log('useAuth: Auth state changed, user data set:', userData?.name);
        } else {
          setUser(null);
          console.log('useAuth: Auth state changed, user logged out.');
        }
        setLoading(false);
        console.log('useAuth: setLoading(false) in onAuthStateChange.');
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      console.log('useAuth: useEffect cleanup - subscription unsubscribed.');
    };
  }, []); // Empty dependency array means this runs once on mount

  const fetchUserData = async (userId: string): Promise<AuthUser | null> => {
    console.log('useAuth: fetchUserData called for userId:', userId);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('useAuth: Error fetching user data:', error);
        throw error;
      }
      console.log('useAuth: Fetched user data from "users" table:', data?.name);

      return {
        id: userId,
        email: data.email,
        role: data.role,
        name: data.name,
      } as AuthUser;
    } catch (err) {
      console.error('useAuth: Caught error in fetchUserData:', err);
      // Don't set error state here, let the calling function handle it.
      return null;
    }
  };

  const signOut = async () => {
    console.log('useAuth: signOut called');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      console.log('useAuth: User signed out successfully.');
    } catch (err) {
      console.error('useAuth: Error signing out:', err);
      setError(err instanceof Error ? err.message : 'ログアウト中にエラーが発生しました');
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
  };
}
