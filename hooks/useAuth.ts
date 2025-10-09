// koecan_v0-main/hooks/useAuth.ts
'use client'

import { useState, useEffect, useRef } from 'react';
import { User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js';
import { useSupabase } from '@/contexts/SupabaseProvider';

interface AuthUser extends SupabaseUser {
  role?: string;
  name?: string;
}

// タイムアウト時間を定義 (例: 10秒)
const AUTH_TIMEOUT_MS = 10000;

export function useAuth() {
  const supabase = useSupabase();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // コンポーネントのマウント状態を追跡するためのref
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 独立した signOut 関数 (タイムアウトループ対策)
  const performSignOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      if (mountedRef.current) {
        setUser(null);
        setError(null);
        setLoading(false);
      }
      console.log('signOut: Successfully performed sign out after error.');
    } catch (e) {
      console.error('Sign Out Failed in performSignOut:', e);
    }
  }

  useEffect(() => {
    console.log('--- useAuth useEffect START ---');
    console.log('useAuth useEffect triggered. Supabase client:', supabase ? 'Available' : 'Null', 'Loading state:', loading);

    // ヘルパー関数: ユーザーデータとプロファイルを取得
    const fetchUserData = async (client: SupabaseClient, userId: string): Promise<AuthUser | null> => {
      console.log('fetchUserData: START for user ID:', userId);
      try {
        const { data: userProfile, error: profileError } = await client
          .from('users')
          .select('role, name')
          .eq('id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('fetchUserData: ERROR fetching user profile (Non-PGRST116):', profileError.message);
          throw profileError;
        }
        
        const { data: { user: authUser }, error: authUserError } = await client.auth.getUser();
        if (authUserError) throw authUserError;

        if (!authUser) return null;
        
        console.log('fetchUserData: END successfully.');
        return {
          ...authUser,
          role: userProfile?.role,
          name: userProfile?.name,
        } as AuthUser;
      } catch (err) {
        console.error('fetchUserData: CRITICAL ERROR during user data retrieval:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'ユーザープロファイル取得中に致命的なエラーが発生しました');
        }
        return null;
      }
    };

    // 初期セッションを取得し、ローディング状態を設定するメイン関数
    const getInitialSession = async () => {
      console.log('getInitialSession: START. Supabase client status:', supabase ? 'Available' : 'Null');

      if (!supabase) {
        if (mountedRef.current) {
          setLoading(false);
          setError('Supabaseクライアントが初期化されていません。');
        }
        return;
      }
      
      let timeoutId: NodeJS.Timeout | null = null;
      let isTimedOut = false;

      try {
        const timeoutPromise = new Promise<void>((_, reject) => {
          timeoutId = setTimeout(() => {
            isTimedOut = true;
            reject(new Error('AUTH_TIMEOUT: Supabaseセッションの検証に時間がかかりすぎました。'));
          }, AUTH_TIMEOUT_MS);
        });

        console.log('getInitialSession: Attempting to get session with timeout.');
        
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise.then(() => ({ data: { session: null }, error: new Error('AUTH_TIMEOUT_INNER') })),
        ]);

        if (isTimedOut || (sessionResult as any).error?.message === 'AUTH_TIMEOUT_INNER') {
            throw new Error('AUTH_TIMEOUT');
        }

        const session = (sessionResult as any).data.session;
        
        if (session?.user) {
          console.log('getInitialSession: Active session found for user ID:', session.user.id);
          const userData = await fetchUserData(supabase, session.user.id);
          if (mountedRef.current) {
            setUser(userData);
          }
        } else {
          console.log('getInitialSession: No active session found. User is not logged in.');
          if (mountedRef.current) {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('getInitialSession: CRITICAL ERROR during initial session check or timeout:', err);
        
        // タイムアウトエラーの場合、セッションを強制的にクリーンアップ
        if (err instanceof Error && err.message.includes('AUTH_TIMEOUT')) {
            console.warn('Handling AUTH TIMEOUT: Forcing signOut to clear local cache.');
            if (mountedRef.current) {
              setError('認証に失敗しました。セッションをリセットしましたので、再度ログインしてください。');
              performSignOut(); // 外部の performSignOut を呼び出してローカルキャッシュをクリーン
            }
        } else if (mountedRef.current) {
          setError(err instanceof Error ? err.message : '初期認証中にエラーが発生しました');
        }
      } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        if (mountedRef.current) {
          console.log('getInitialSession: Finished. Setting loading to false.');
          setLoading(false);
        }
      }
      console.log('getInitialSession: END.');
    };

    // 初期セッションチェックを実行
    getInitialSession();

    // ... (onAuthStateChange のリスナー設定は変更なし) ...
    const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mountedRef.current) return;
          console.log('onAuthStateChange: Event received. Session:', session ? 'Active' : 'Inactive', 'Event Type:', _event);
          try {
            if (session?.user) {
              const userData = await fetchUserData(supabase, session.user.id);
              if (mountedRef.current) setUser(userData);
            } else {
              if (mountedRef.current) setUser(null);
            }
          } catch(err) {
              console.error('onAuthStateChange: CRITICAL ERROR during state change processing:', err);
              if (mountedRef.current) setError(err instanceof Error ? err.message : '認証状態変更中にエラーが発生しました');
          }
          console.log('onAuthStateChange: END of event processing.');
        }
      );

    return () => {
      if (authListener.subscription) {
        console.log('useEffect: Unsubscribing from onAuthStateChange.');
        authListener.subscription.unsubscribe();
      }
      console.log('useEffect: Cleanup complete.');
    };
  }, [supabase]); 

  // 公開する signOut 関数はそのまま維持
  const signOut = async () => {
    // ... (既存の signOut ロジックをそのまま使用) ...
    if (!supabase) return;
    try {
      if (mountedRef.current) setLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      if (mountedRef.current) {
        setUser(null);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : 'Sign out error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
  };
}
