'use client'

import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useSupabase } from '@/contexts/SupabaseProvider'; // ★★★ supabaseのインポートをこちらに変更 ★★★

// SupabaseのUser型を拡張
interface AuthUser extends SupabaseUser {
  role?: string;
  name?: string;
}

export function useAuth() {
  const supabase = useSupabase(); // ★★★ ContextからSupabaseクライアントを取得 ★★★
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ★★★ supabaseがnullの場合は何もしない（Providerの準備ができていない）★★★
    if (!supabase) {
      return;
    }

    let mounted = true;

    const fetchUserData = async (userId: string): Promise<AuthUser | null> => {
      try {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('role, name')
          .eq('id', userId)
          .single();
        if (error) throw error;
        
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return null;
        
        return {
          ...authUser,
          role: userProfile.role,
          name: userProfile.name,
        };
      } catch (err) {
        console.error('Error fetching user data:', err);
        return null;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        try {
          if (session?.user) {
            const userData = await fetchUserData(session.user.id);
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch(err) {
            setError(err instanceof Error ? err.message : '認証中にエラーが発生しました');
        } finally {
            setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]); // ★★★ useEffectの依存配列にsupabaseを追加 ★★★

  const signOut = async () => {
    if (!supabase) return; // supabaseの存在をチェック
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out error');
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
  };
}
