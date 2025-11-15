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
  const [loading, setLoading] = useState(true);
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

  // ★★★ 修正箇所: getInitialSession を useCallback でラップし、useAuth の外から呼び出せるようにする ★★★
  const getInitialSession = useCallback(async () => {
      console.log('getInitialSession: START. Supabase client status:', supabase ? 'Available' : 'Null');

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
            setError(`セッション検証に失敗しました: ${sessionError.message}。ローカルセッションをリセットしましたので、リロードしてください。`);
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
  }, [supabase]); // 依存配列に supabase を追加


  // ★★★ 修正箇所: getInitialSession を useEffect の外に出したため、この useEffect は onAuthStateChange のリスナー設定に専念 ★★★
  useEffect(() => {
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
              } catch(err) {
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
      if (subscription) {
        console.log('useEffect: Unsubscribing from onAuthStateChange.');
        subscription.unsubscribe();
      }
      console.log('Cleanup complete.');
    };
  }, [supabase]); 

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
      clearLocalSupabaseCache(); // サインアウト時にもローカルキャッシュをクリア
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
