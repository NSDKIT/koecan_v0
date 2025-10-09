// koecan_v0-main/hooks/useAuth.ts
'use client'

import { useState, useEffect, useRef } from 'react';
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

  // コンポーネントのマウント状態を追跡するためのref
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true; // マウント時にtrueに設定
    return () => {
      mountedRef.current = false; // アンマウント時にfalseに設定
    };
  }, []);

  useEffect(() => {
    console.log('--- useAuth useEffect START ---');
    console.log('useAuth useEffect triggered. Supabase client:', supabase ? 'Available' : 'Null', 'Loading state:', loading);

    // ヘルパー関数: ユーザーデータとプロファイルを取得
    const fetchUserData = async (client: SupabaseClient, userId: string): Promise<AuthUser | null> => {
      console.log('fetchUserData: START for user ID:', userId);
      try {
        console.log('fetchUserData: Attempting to select from "users" table for ID:', userId);
        const { data: userProfile, error: profileError } = await client
          .from('users')
          .select('role, name')
          .eq('id', userId)
          .single();

        // ★★★ 修正箇所: 行がない場合 (PGRST116) のエラーを安全に処理する ★★★
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('fetchUserData: ERROR fetching user profile (Non-PGRST116):', profileError.message);
          throw profileError;
        }

        console.log('fetchUserData: Successfully fetched user profile:', userProfile);
        
        console.log('fetchUserData: Attempting to get auth user data using client.auth.getUser().');
        const { data: { user: authUser }, error: authUserError } = await client.auth.getUser();
        if (authUserError) {
          // AuthError は message プロパティがメイン
          console.error('fetchUserData: ERROR fetching auth user:', authUserError.message); // details, hint を削除
          throw authUserError;
        }

        if (!authUser) {
          console.log('fetchUserData: No auth user found after profile fetch - this should not happen if session was active.');
          return null;
        }
        
        console.log('fetchUserData: Auth user data fetched successfully. Returning combined user data.');
        console.log('fetchUserData: END successfully.');
        
        // userProfile が null の場合もあるため、安全に結合
        return {
          ...authUser,
          role: userProfile?.role,
          name: userProfile?.name,
        } as AuthUser; // AuthUser 型への明示的なキャスト
      } catch (err) {
        console.error('fetchUserData: CRITICAL ERROR during user data retrieval:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'ユーザープロファイル取得中に致命的なエラーが発生しました');
        }
        console.log('fetchUserData: END with error.');
        return null;
      }
    };

    // 初期セッションを取得し、ローディング状態を設定するメイン関数
    const getInitialSession = async () => {
      console.log('getInitialSession: START. Supabase client status:', supabase ? 'Available' : 'Null');

      if (!supabase) {
        console.log('getInitialSession: Supabase client is null. Cannot proceed with session check.');
        if (mountedRef.current) {
          // Supabaseが利用できない場合、ローディングを停止しエラーを表示
          setLoading(false);
          setError('Supabaseクライアントが初期化されていません。環境変数またはSupabaseProviderの設定を確認してください。');
        }
        console.log('getInitialSession: END early due to null Supabase client.');
        return;
      }
      
      try {
        console.log('getInitialSession: Attempting to get session using supabase.auth.getSession().');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          // AuthError は message プロパティがメイン
          console.error('getInitialSession: ERROR getting session:', sessionError.message); // details, hint を削除
          throw sessionError;
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
    };

    // 初期セッションチェックを実行
    getInitialSession();

    // 認証状態の変化を監視するリスナーを設定
    let subscription: { unsubscribe: () => void } | undefined;
    if (supabase) {
      console.log('useEffect: Setting up onAuthStateChange listener.');
      const { data } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mountedRef.current) return;
          console.log('onAuthStateChange: Event received. Session:', session ? 'Active' : 'Inactive', 'Event Type:', _event);
          try {
            if (session?.user) {
              console.log('onAuthStateChange: Session user found. Fetching user data.');
              const userData = await fetchUserData(supabase, session.user.id);
              if (mountedRef.current) {
                setUser(userData);
              }
            } else {
              console.log('onAuthStateChange: No session user found. Setting user to null.');
              if (mountedRef.current) {
                setUser(null);
              }
            }
          } catch(err) {
              console.error('onAuthStateChange: CRITICAL ERROR during state change processing:', err);
              if (mountedRef.current) {
                setError(err instanceof Error ? err.message : '認証状態変更中にエラーが発生しました');
              }
          }
          console.log('onAuthStateChange: END of event processing.');
        }
      );
      subscription = data.subscription;
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
  }, [supabase]); // supabaseクライアントが変更された場合にのみ再実行

  const signOut = async () => {
    if (!supabase) {
      if (mountedRef.current) {
        setError('Supabaseクライアントが初期化されていません。ログアウトできません。');
      }
      console.log('signOut: END early due to null Supabase client.');
      return;
    }
    try {
      if (mountedRef.current) {
        setLoading(true); // ログアウト処理中にローディングを表示
      }
      console.log('signOut: START. Attempting to sign out.');
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('signOut: ERROR during sign out:', signOutError);
        throw signOutError;
      }
      if (mountedRef.current) {
        setUser(null);
        setError(null); // ログアウト成功時はエラーもクリア
      }
      console.log('signOut: Successfully signed out.');
    } catch (err) {
      console.error('signOut: CRITICAL ERROR during sign out:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Sign out error');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false); // ログアウト処理完了後にローディングを非表示
      }
      console.log('signOut: END.');
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
  };
}
