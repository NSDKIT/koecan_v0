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
    console.log('useAuth useEffect triggered. Supabase client:', supabase ? 'Available' : 'Null', 'Loading state:', loading);

    // ヘルパー関数: ユーザーデータとプロファイルを取得
    const fetchUserData = async (client: SupabaseClient, userId: string): Promise<AuthUser | null> => {
      console.log('fetchUserData: Fetching profile for user ID:', userId);
      try {
        console.log('fetchUserData: Attempting to select from "users" table.');
        const { data: userProfile, error: profileError } = await client
          .from('users')
          .select('role, name')
          .eq('id', userId)
          .single();
    
        if (profileError) {
          console.error('fetchUserData: ERROR fetching user profile:', profileError.message, profileError.details, profileError.hint);
          throw profileError;
        }
        console.log('fetchUserData: Successfully fetched user profile:', userProfile);
        
        console.log('fetchUserData: Attempting to get auth user data.');
        const { data: { user: authUser }, error: authUserError } = await client.auth.getUser();
        if (authUserError) {
          console.error('fetchUserData: ERROR fetching auth user:', authUserError.message, authUserError.details, authUserError.hint);
          throw authUserError;
        }
    
        if (!authUser) {
          console.log('fetchUserData: No auth user found after profile fetch.');
          return null;
        }
        
        console.log('fetchUserData: Auth user data fetched successfully. Returning combined user data.');
        return {
          ...authUser,
          role: userProfile.role,
          name: userProfile.name,
        };
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
      console.log('getInitialSession: Called. Supabase client status:', supabase ? 'Available' : 'Null');

      if (!supabase) {
        console.log('getInitialSession: Supabase client is null. Exiting early from getInitialSession.');
        // supabaseがnullの場合、処理を続行できない。
        // loadingをfalseにし、app/page.tsxにSupabase設定エラーを表示させるか、
        // 一時的なレースコンディションであればuseEffectが再実行されるのを待つ。
        if (mountedRef.current) {
          setLoading(false);
          setError('Supabaseクライアントが初期化されていません。環境変数またはSupabaseProviderの設定を確認してください。'); 
        }
        return;
      }
      
      try {
        console.log('getInitialSession: Attempting to get session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('getInitialSession: Error getting session:', sessionError);
          throw sessionError;
        }

        if (session?.user) {
          console.log('getInitialSession: Session found for user ID:', session.user.id);
          const userData = await fetchUserData(supabase, session.user.id);
          if (mountedRef.current) {
            setUser(userData);
          }
        } else {
          console.log('getInitialSession: No active session found.');
          if (mountedRef.current) {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('getInitialSession: Error during initial session check:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : '初期認証中にエラーが発生しました');
        }
      } finally {
        if (mountedRef.current) {
          console.log('getInitialSession: Finished. Setting loading to false.');
          setLoading(false);
        }
      }
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
          console.log('onAuthStateChange: Event received. Session:', session ? 'Active' : 'Inactive');
          try {
            if (session?.user) {
              const userData = await fetchUserData(supabase, session.user.id);
              if (mountedRef.current) {
                setUser(userData);
              }
            } else {
              if (mountedRef.current) {
                setUser(null);
              }
            }
          } catch(err) {
              console.error('onAuthStateChange: Error during state change processing:', err);
              if (mountedRef.current) {
                setError(err instanceof Error ? err.message : '認証状態変更中にエラーが発生しました');
              }
          }
          // Note: ここではsetLoading(false)は呼び出されない。初期ロードはgetInitialSessionで処理済み。
          // このリスナーは初期ロード後の後続の変更用。
        }
      );
      subscription = data.subscription;
    } else {
      console.log('useEffect: Supabase client is null, cannot set up onAuthStateChange listener.');
    }

    return () => {
      // クリーンアップ
      if (subscription) {
        console.log('useEffect: Unsubscribing from onAuthStateChange.');
        subscription.unsubscribe();
      }
      console.log('useEffect: Cleanup complete.');
    };
  }, [supabase, loading]); // supabaseまたはloadingが変更された場合に再実行（loadingを追加したのは、loadingがtrueに戻った際に再チェックさせるため）

  const signOut = async () => {
    if (!supabase) {
      if (mountedRef.current) {
        setError('Supabaseクライアントが初期化されていません。ログアウトできません。');
      }
      return;
    }
    try {
      if (mountedRef.current) {
        setLoading(true); // ログアウト処理中にローディングを表示
      }
      console.log('signOut: Attempting to sign out.');
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('signOut: Error during sign out:', signOutError);
        throw signOutError;
      }
      if (mountedRef.current) {
        setUser(null);
        setError(null); // ログアウト成功時はエラーもクリア
      }
      console.log('signOut: Successfully signed out.');
    } catch (err) {
      console.error('signOut: Sign out error:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Sign out error');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false); // ログアウト処理完了後にローディングを非表示
      }
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
  };
}
