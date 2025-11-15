// koecan_v0-main/hooks/useAuth.ts
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'; // useCallback をインポート
import { User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js';
import { useSupabase } from '@/contexts/SupabaseProvider';

interface AuthUser extends SupabaseUser {
  role?: string;
  name?: string;
}

export function useAuth() {
  const supabase = useSupabase();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // 初期ロード状態は true のまま
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ローカルストレージから Supabase のセッションキャッシュを手動でクリアする関数
  const clearLocalSupabaseCache = () => {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb:') || (key.startsWith('sb-') && key.includes('-auth-token'))) { 
            localStorage.removeItem(key);
        }
    });
    console.log('Local Supabase session cache cleared.');
  }

  // 独立した signOut 関数 (エラー時のセッションクリーンアップ用)
  const performSignOut = async () => {
    if (!supabase) return false;
    try {
      await supabase.auth.signOut(); 
      clearLocalSupabaseCache(); 
      if (mountedRef.current) {
        setUser(null);
        setError(null);
        setLoading(false); 
      }
      console.log('signOut: Successfully performed sign out.');
      return true;
    } catch (e) {
      console.error('Sign Out Failed in performSignOut:', e);
      return false;
    }
  }

  // ★★★ 修正箇所: getInitialSession を useCallback でラップし、useEffect から切り離す ★★★
  const getInitialSession = useCallback(async () => {
      console.log('getInitialSession: START. Supabase client status:', supabase ? 'Available' : 'Null');

      // 既に認証が完了しているか、ローディング中でなければ何もしない
      if (user !== null || !mountedRef.current) {
          console.log('getInitialSession: Already authenticated or component unmounted. Skipping.');
          setLoading(false); // 念のためローディングを false に
          return;
      }
      if (loading) {
          console.log('getInitialSession: Already loading. Skipping redundant call.');
          return;
      }
      
      setLoading(true); // 認証開始前にローディングを true に設定
      setError(null); // エラーもクリア

      if (!supabase) {
        if (mountedRef.current) {
          setLoading(false);
          setError('Supabaseクライアントが初期化されていません。環境変数またはSupabaseProviderの設定を確認してください。');
        }
        return;
      }
      
      try {
        console.log('getInitialSession: Attempting to get session.');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('getInitialSession: ERROR getting session:', sessionError.message);
          clearLocalSupabaseCache(); 
          if (mountedRef.current) {
            setError(`セッション検証に失敗しました: ${sessionError.message}。ローカルセッションをリセットしました。`);
          }
          return; 
        }

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
        console.error('getInitialSession: CRITICAL ERROR during initial session check:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : '初期認証中にエラーが発生しました');
        }
      } finally {
        if (mountedRef.current) {
          console.log('getInitialSession: Finished. Setting loading to false.');
          setLoading(false);
        }
      }
      console.log('getInitialSession: END.');
  }, [supabase, user, loading]); // user, loading を依存配列に追加して、getInitialSession の実行が重複しないようにする


  // ★★★ 修正箇所: onAuthStateChange のリスナー設定のみを行う useEffect ★★★
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    if (supabase) { 
        console.log('useEffect (onAuthStateChange): Setting up listener.');
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
                if (mountedRef.current) setLoading(false); // 認証状態変化時にはローディングを解除
              } catch(err) {
                  console.error('onAuthStateChange: CRITICAL ERROR during state change processing:', err);
                  if (mountedRef.current) setError(err instanceof Error ? err.message : '認証状態変更中にエラーが発生しました');
              }
              console.log('onAuthStateChange: END of event processing.');
            }
          );
          subscription = authListener.subscription;
    } else {
        console.log('useEffect (onAuthStateChange): Supabase client is null, cannot set up listener.');
    }

    return () => {
      if (subscription) {
        console.log('useEffect (onAuthStateChange): Unsubscribing from listener.');
        subscription.unsubscribe();
      }
      console.log('useEffect (onAuthStateChange): Cleanup complete.');
    };
  }, [supabase]); 
  // ★★★ 修正箇所ここまで ★★★

  // 公開する signOut 関数はそのまま維持
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
      clearLocalSupabaseCache(); 
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
    getInitialSession, // ★★★ 修正箇所: getInitialSession をリターンする ★★★
  };
}
