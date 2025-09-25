'use client'

import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';

// SupabaseのUser型を拡張
interface AuthUser extends SupabaseUser {
  role?: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialLoading, setInitialLoading] = useState(true); // ★★★ 修正点1: 初回読み込み状態を追加
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // ユーザーデータを取得するヘルパー関数
    const fetchUserData = async (userId: string): Promise<AuthUser | null> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;

        // Supabaseのユーザー情報とDBのユーザー情報をマージ
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return null;

        return {
          ...authUser,
          role: data.role,
          name: data.name,
        };
      } catch (err) {
        console.error('Error fetching user data:', err);
        return null;
      }
    };

    // ★★★ 修正点2: セッション復元ロジックを改善 ★★★
    const getInitialSession = async () => {
      try {
        // getSessionはローカルストレージからセッションを同期的に復元しようとする
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user && mounted) {
          const userData = await fetchUserData(session.user.id);
          setUser(userData);
        }
      } catch (err) {
        console.error('Error in initial session fetch:', err);
        if(mounted) setError(err instanceof Error ? err.message : 'Authentication error');
      } finally {
        if (mounted) {
          setInitialLoading(false); // どちらの場合でも初回ローディングを終了
        }
      }
    };

    getInitialSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          setUser(userData);
        } else {
          setUser(null);
        }
        // onAuthStateChangeが呼ばれたら、それは初期チェック後なのでローディングはfalse
        setInitialLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err.message : 'Sign out error');
    }
  };

  return {
    user,
    loading: initialLoading, // ★★★ 修正点3: loadingとしてinitialLoadingを返す ★★★
    error,
    signOut,
  };
}
