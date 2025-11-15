// koecan_v0-main/hooks/useAuth.ts
'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js';
import { useSupabase } from '@/contexts/SupabaseProvider';

interface AuthUser extends SupabaseUser {
  role?: string;
  name?: string;
}

/**
 * Supabaseからユーザーの追加プロフィールデータを取得するヘルパー関数。
 * `users` テーブルから名前とロールを取得し、Supabaseのセッションユーザー情報と結合します。
 */
const fetchUserData = async (supabase: SupabaseClient, userId: string): Promise<AuthUser | null> => {
  try {
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', userId)
      .single();

    // 行が見つからない (PGRST116) 以外のエラーは警告として扱い、処理を続行
    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('ユーザープロファイルの取得に失敗しました。デフォルト値を使用します:', profileError.message);
    }

    // 最新のセッションユーザー情報を取得
    const { data: { user: sessionUser } } = await supabase.auth.getUser();

    if (sessionUser) {
      return {
        ...sessionUser,
        // プロファイルが見つからない場合は、メールアドレスから名前を推測し、デフォルトロールを設定
        name: userProfile?.name || sessionUser.email?.split('@')[0] || '名無し',
        role: userProfile?.role || 'monitor', // デフォルトロールを設定
      };
    }
    return null; // セッションユーザーが存在しない場合
  } catch (err) {
    console.error('ユーザーデータ取得中に致命的なエラーが発生しました。最小限のユーザー情報を返します:', err);
    // 致命的なエラーが発生した場合でも、セッションから取得できる基本情報を返すフォールバック
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (sessionUser) {
      return {
        ...sessionUser,
        name: sessionUser.email?.split('@')[0] || '名無し',
        role: 'monitor', // フォールバックロール
      };
    }
    return null;
  }
};


export function useAuth() {
  const supabase = useSupabase();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // 初期ロード状態は true のまま
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true); // コンポーネントのマウント状態を追跡

  // コンポーネントのマウント・アンマウント時に mountedRef を更新
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * ローカルストレージからSupabaseのセッションキャッシュを手動でクリアします。
   * 認証エラー時などにセッションをリセットするために使用されます。
   */
  const clearLocalSupabaseCache = () => {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb:') || (key.startsWith('sb-') && key.includes('-auth-token'))) { 
            localStorage.removeItem(key);
        }
    });
    console.log('ローカルのSupabaseセッションキャッシュをクリアしました。');
  }

  /**
   * ユーザーをログアウトさせます。
   */
  const signOut = async () => {
    if (!supabase) return;
    try {
      if (mountedRef.current) setLoading(true); // ログアウト処理中はローディング状態に
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      if (mountedRef.current) {
        setUser(null);
        setError(null);
      }
      clearLocalSupabaseCache(); // ローカルキャッシュもクリア
    } catch (err) {
      console.error('ログアウトエラー:', err);
      if (mountedRef.current) setError(err instanceof Error ? err.message : 'ログアウト中にエラーが発生しました');
    } finally {
      if (mountedRef.current) setLoading(false); // ログアウト処理完了後はローディングを解除
    }
  };

  /**
   * 現在のセッション状態をチェックし、ユーザーデータを取得・設定するヘルパー関数。
   * onAuthStateChangeが発火しない場合に備えて、手動でセッションをチェックする。
   */
  const recheckSession = useCallback(async () => {
    if (!supabase || !mountedRef.current) return;

    // ロード中ではない、かつ、エラー状態でもない場合は何もしない
    // ただし、現在ログインしていない場合はチェックを行う
    if (!loading && user !== null && error === null) {
        console.log('recheckSession: 現在セッションがあり、ロード中でもエラーでもないためスキップします。');
        return;
    }

    setLoading(true); // チェック中はローディング状態に
    setError(null);    // エラーをクリア

    try {
      console.log('recheckSession: 現在のセッションを再チェック中...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('recheckSession: セッション取得エラー:', sessionError.message);
        clearLocalSupabaseCache(); 
        if (mountedRef.current) {
          setError(`セッション検証に失敗しました: ${sessionError.message}。ローカルセッションをリセットしました。`);
          setUser(null);
        }
      } else if (session?.user) {
        console.log('recheckSession: アクティブなセッションが見つかりました (ユーザーID:', session.user.id, ')');
        const userData = await fetchUserData(supabase, session.user.id);
        if (mountedRef.current) setUser(userData);
      } else {
        console.log('recheckSession: アクティブなセッションは見つかりませんでした。ユーザーはログインしていません。');
        if (mountedRef.current) setUser(null);
      }
    } catch (err) {
      console.error('recheckSession: セッション再チェック中に致命的なエラーが発生しました:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : '認証中にエラーが発生しました');
        setUser(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false); // チェック完了後はローディングを停止
        console.log('recheckSession: セッション再チェックが完了しました。');
      }
    }
  }, [supabase, loading, user, error]);


  /**
   * コンポーネントマウント時の初期セッションチェックと、
   * ブラウザタブの可視性変更リスナーを設定するuseEffect。
   */
  useEffect(() => {
    if (!supabase) {
      if (mountedRef.current) {
        setError('Supabaseクライアントが初期化されていません。環境変数またはSupabaseProviderの設定を確認してください。');
        setLoading(false);
      }
      return;
    }

    // 1. コンポーネントマウント時に一度セッションをチェック (recheckSessionがloadingを管理)
    console.log('useAuth: useEffect: 初期ロード時にセッションチェックを実行します。');
    recheckSession();

    // 2. ブラウザタブの可視性変更リスナーを設定
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('visibilitychange: タブがアクティブになりました。セッションを再チェックします。');
        // タブがアクティブになった時、必ずセッションを再チェック
        recheckSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // クリーンアップ関数
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('useAuth: useEffect cleanup (visibilitychange).');
    };
  }, [supabase, recheckSession]); // recheckSession も依存配列に含める


  /**
   * SupabaseのonAuthStateChangeリスナーを設定するuseEffect。
   * これは主に認証イベント（ログイン、ログアウトなど）によってトリガーされる。
   */
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    if (!supabase) return; // supabaseクライアントがない場合はリスナーを設定しない

    console.log('useAuth: useEffect: onAuthStateChange リスナーを設定中...');
    const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mountedRef.current) return;
          console.log('onAuthStateChange: イベントを受信しました。セッション:', session ? 'アクティブ' : '非アクティブ', 'イベントタイプ:', _event);
          
          setLoading(true); // イベント処理中はローディング状態に
          setError(null);    // エラーをクリア

          try {
            if (session?.user) {
              const userData = await fetchUserData(supabase, session.user.id);
              if (mountedRef.current) setUser(userData);
            } else {
              if (mountedRef.current) setUser(null);
            }
          } catch(err) {
              console.error('onAuthStateChange: 状態変化処理中に致命的なエラーが発生しました:', err);
              if (mountedRef.current) setError(err instanceof Error ? err.message : '認証状態変更中にエラーが発生しました');
          } finally {
            if (mountedRef.current) {
              setLoading(false); // イベント処理完了後は常にローディングを解除
              console.log('onAuthStateChange: イベント処理が終了しました。');
            }
          }
        }
      );
    subscription = authListener.subscription;

    // クリーンアップ関数
    return () => {
      if (subscription) {
        console.log('useAuth: onAuthStateChange リスナーの購読を解除します。');
        subscription.unsubscribe();
      }
      console.log('useAuth: useEffect cleanup (onAuthStateChange).');
    };
  }, [supabase]); // supabaseクライアントが変更された場合にのみ再実行


  return {
    user,
    loading,
    error,
    signOut,
  };
}
