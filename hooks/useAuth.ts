// koecan_v0-main/hooks/useAuth.ts
// 修正版: タイムアウト機構とセッション検証を追加
'use client'

import { useState, useEffect, useRef } from 'react';
import { User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js';
import { useSupabase } from '@/contexts/SupabaseProvider';

interface AuthUser extends SupabaseUser {
  role?: string;
  name?: string;
}

// タイムアウト時間を設定（5秒）
const AUTH_TIMEOUT_MS = 5000;

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

  // タイムアウト付きのPromiseラッパー
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('認証チェックがタイムアウトしました')), timeoutMs)
      )
    ]);
  };

  // 独立した signOut 関数
  const performSignOut = async () => {
    if (!supabase) return false;
    try {
      await supabase.auth.signOut();
      if (mountedRef.current) {
        setUser(null);
        setError(null);
        setLoading(false);
      }
      console.log('signOut: Successfully performed sign out after error.');
      return true;
    } catch (e) {
      console.error('Sign Out Failed in performSignOut:', e);
      return false;
    }
  }

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

  useEffect(() => {
    console.log('--- useAuth useEffect START ---');
    console.log('useAuth useEffect triggered. Supabase client:', supabase ? 'Available' : 'Null', 'Loading state:', loading);

    // 初期セッションを取得し、ローディング状態を設定するメイン関数
    const getInitialSession = async () => {
      console.log('getInitialSession: START. Supabase client status:', supabase ? 'Available' : 'Null');

      if (!supabase) {
        if (mountedRef.current) {
          setLoading(false);
          setError('Supabaseクライアントが初期化されていません。環境変数またはSupabaseProviderの設定を確認してください。');
        }
        return;
      }

      try {
        console.log('getInitialSession: Attempting to get session with timeout.');
        
        // ★★★ 修正1: タイムアウト機構を追加 ★★★
        const { data: { session }, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_TIMEOUT_MS
        );

        if (sessionError) {
          console.error('getInitialSession: ERROR getting session:', sessionError.message);
          throw sessionError;
        }

        if (session?.user) {
          console.log('getInitialSession: Active session found for user ID:', session.user.id);
          
          // ★★★ 修正2: セッションの有効性を検証 ★★★
          try {
            const { data: { user: validUser }, error: userError } = await withTimeout(
              supabase.auth.getUser(),
              AUTH_TIMEOUT_MS
            );

            if (userError || !validUser) {
              console.warn('getInitialSession: Session exists but user validation failed. Clearing session.');
              await supabase.auth.signOut();
              if (mountedRef.current) {
                setUser(null);
              }
              return;
            }

            // セッションが有効な場合のみユーザーデータを取得
            const userData = await fetchUserData(supabase, session.user.id);
            if (mountedRef.current) {
              setUser(userData);
            }
          } catch (validationError) {
            console.error('getInitialSession: User validation error:', validationError);
            // 検証に失敗した場合はセッションをクリア
            await supabase.auth.signOut();
            if (mountedRef.current) {
              setUser(null);
            }
          }
        } else {
          console.log('getInitialSession: No active session found. User is not logged in.');
          if (mountedRef.current) {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('getInitialSession: CRITICAL ERROR during initial session check:', err);
        
        // ★★★ 修正3: タイムアウトエラーの場合はセッションをクリア ★★★
        if (err instanceof Error && err.message.includes('タイムアウト')) {
          console.warn('getInitialSession: Timeout detected. Clearing potentially stale session.');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('getInitialSession: Failed to sign out after timeout:', signOutError);
          }
        }
        
        if (mountedRef.current) {
          setError('認証セッションが不安定です。再試行してください。');
          setUser(null);
        }
      } finally {
        // ★★★ 修正4: 必ずloadingをfalseにする ★★★
        if (mountedRef.current) {
          console.log('getInitialSession: Finished. Setting loading to false.');
          setLoading(false);
        }
      }
      console.log('getInitialSession: END.');
    };

    // 初期セッションチェックを実行
    getInitialSession();

    // onAuthStateChange のリスナー設定
    let subscription: { unsubscribe: () => void } | undefined;
    if (supabase) {
      console.log('useEffect: Setting up onAuthStateChange listener.');
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
          } catch (err) {
            console.error('onAuthStateChange: CRITICAL ERROR during state change processing:', err);
            if (mountedRef.current) setError(err instanceof Error ? err.message : '認証状態変更中にエラーが発生しました');
          }
          console.log('onAuthStateChange: END of event processing.');
        }
      );
      subscription = authListener.subscription;
    } else {
      console.log('useEffect: Supabase client is null, cannot set up onAuthStateChange listener.');
    }

    console.log('--- useAuth useEffect END ---');

    return () => {
      // クリーンアップ
      if (subscription) {
        console.log('useEffect: Unsubscribing from onAuthStateChange.');
        subscription.unsubscribe();
      }
      console.log('useEffect: Cleanup complete.');
    };
  }, [supabase]);

  // 公開する signOut 関数
  const signOut = async () => {
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

