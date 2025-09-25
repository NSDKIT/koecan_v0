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
  const [loading, setLoading] = useState(true); // ★★★ 修正点1: 名前を'loading'に戻し、初期値はtrueのまま ★★★
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // ユーザーのカスタムデータを 'users' テーブルから取得する関数
    const fetchUserData = async (userId: string): Promise<AuthUser | null> => {
      try {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('role, name')
          .eq('id', userId)
          .single();
        if (error) throw error;

        // Supabase authから最新のユーザー情報を取得
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return null;
        
        // 認証情報とプロフィール情報をマージして返す
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

    // ★★★ 修正点2: onAuthStateChangeリスナーに処理を一本化 ★★★
    // getSession()の呼び出しを削除し、このリスナーにすべてを任せる
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
            console.error('Error during auth state change handling:', err);
            setError(err instanceof Error ? err.message : '認証中にエラーが発生しました');
        } finally {
            // 最初のイベント（INITIAL_SESSIONなど）が処理されたら、ローディングを終了する
            setLoading(false);
        }
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
    loading,
    error,
    signOut,
  };
}
