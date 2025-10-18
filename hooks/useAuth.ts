// koecan_v0-main/hooks/useAuth.ts
// 修正版: タイムアウト機構、セッション検証、自動リトライを追加
'use client'

import { useState, useEffect, useRef } from 'react';
import { User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js';
import { useSupabase } from '@/contexts/SupabaseProvider';

interface AuthUser extends SupabaseUser {
  role?: string;
  name?: string;
}

// リトライ間隔（ミリ秒）
const RETRY_INTERVALS = [1000, 2000, 3000, 4000, 5000]; // 1秒、2秒、3秒、4秒、5秒
const AUTH_TIMEOUT_MS = 3000; // 各試行のタイムアウト時間を3秒に短縮

export function useAuth() {
  const supabase = useSupabase();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // コンポーネントのマウント状態を追跡するためのref
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0); // リトライ回数を追跡

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

    // ★★★ 新機能: 自動リトライ機構 ★★★
    const getInitialSessionWithRetry = async () => {
      console.log('getInitialSessionWithRetry: START');

      if (!supabase) {
        if (mountedRef.current) {
          setLoading(false);
          setError('Supabaseクライアントが初期化されていません。環境変数またはSupabaseProviderの設定を確認してください。');
        }
        return;
      }

      // リトライループ
      for (let attempt = 0; attempt <= RETRY_INTERVALS.length; attempt++) {
        if (!mountedRef.current) {
          console.log('Component unmounted, stopping retry loop');
          return;
        }

        try {
          console.log(`getInitialSession: Attempt ${attempt + 1}/${RETRY_INTERVALS.length + 1}`);

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

            // セッションの有効性を検証
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
                  setLoading(false);
                }
                return;
              }

              // セッションが有効な場合のみユーザーデータを取得
              const userData = await fetchUserData(supabase, session.user.id);
              if (mountedRef.current) {
                setUser(userData);
                setLoading(false);
              }
              console.log('getInitialSession: SUCCESS');
              return; // 成功したらリトライループを終了
            } catch (validationError) {
              console.error('getInitialSession: User validation error:', validationError);
              // 検証に失敗した場合はセッションをクリア
              await supabase.auth.signOut();
              if (mountedRef.current) {
                setUser(null);
                setLoading(false);
              }
              return;
            }
          } else {
            console.log('getInitialSession: No active session found. User is not logged in.');
            if (mountedRef.current) {
              setUser(null);
              setLoading(false);
            }
            return; // セッションがない場合も終了
          }
        } catch (err) {
          console.error(`getInitialSession: ERROR on attempt ${attempt + 1}:`, err);

          // 最後の試行の場合
          if (attempt === RETRY_INTERVALS.length) {
            console.error('getInitialSession: All retry attempts failed. Clearing session.');
            
            // タイムアウトエラーの場合はセッションをクリア
            if (err instanceof Error && err.message.includes('タイムアウト')) {
              console.warn('getInitialSession: Timeout detected. Clearing potentially stale session.');
              try {
                await supabase.auth.signOut();
                // ★★★ 最終手段: ローカルストレージをクリアして強制リロード ★★★
                console.warn('getInitialSession: Clearing localStorage and reloading...');
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
                return;
              } catch (signOutError) {
                console.error('getInitialSession: Failed to sign out after timeout:', signOutError);
              }
            }

            if (mountedRef.current) {
              setError('認証セッションが不安定です。再試行してください。');
              setUser(null);
              setLoading(false);
            }
            return;
          }

          // 次の試行まで待機
          const waitTime = RETRY_INTERVALS[attempt];
          console.log(`getInitialSession: Waiting ${waitTime}ms before retry ${attempt + 2}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      console.log('getInitialSessionWithRetry: END');
    };

    // 初期セッションチェックを実行
    getInitialSessionWithRetry();

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

