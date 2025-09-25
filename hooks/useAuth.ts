// koecan_v0-main/hooks/useAuth.ts
'use client'

import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useSupabase } from '@/contexts/SupabaseProvider';

interface AuthUser extends SupabaseUser {
  role?: string;
  name?: string;
}

export function useAuth() {
  const supabase = useSupabase();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      if (!supabase) {
        // Supabase clientがまだ利用できない場合、処理を中断
        // ただし、loadingはtrueのまま。useEffectがsupabaseの変更を監視しているので、
        // 利用可能になり次第再度実行される
        return;
      }
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          if (mounted) {
            setUser(userData);
          }
        } else {
          if (mounted) {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error fetching initial session:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : '初期認証中にエラーが発生しました');
        }
      } finally {
        if (mounted) {
          // 初期セッションの確認が完了したら、loadingをfalseにする
          setLoading(false);
        }
      }
    };

    const fetchUserData = async (userId: string): Promise<AuthUser | null> => {
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('role, name')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) return null;
        
        return {
          ...authUser,
          role: userProfile.role,
          name: userProfile.name,
        };
      } catch (err) {
        console.error('Error fetching user data from DB:', err);
        setError(err instanceof Error ? err.message : 'ユーザープロファイル取得中にエラーが発生しました');
        return null;
      }
    };

    getInitialSession(); // コンポーネントマウント時に初期セッションを取得

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
            setError(err instanceof Error ? err.message : '認証状態変更中にエラーが発生しました');
        } finally {
            // onAuthStateChangeでのloading状態の更新は、必要に応じて調整可能。
            // 通常は初期ロード時のみloadingインジケータを表示する。
        }
      }
    );

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase]); // supabaseクライアントが変更された場合にのみ再実行

  const signOut = async () => {
    if (!supabase) return;
    try {
      setLoading(true); // ログアウト処理中にローディングを表示
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out error');
    } finally {
      setLoading(false); // ログアウト処理完了後にローディングを非表示
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
  };
}
