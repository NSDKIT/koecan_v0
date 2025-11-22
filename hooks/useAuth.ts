// koecan_v0-main/hooks/useAuth.ts
'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { User as SupabaseUser, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
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
  const [loading, setLoading] = useState(false); // 初期ロード状態を false に変更（セッション確認後に必要に応じて true にする）
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true); // コンポーネントのマウント状態を追跡
  const isInitialSessionChecked = useRef(false); // NEW: 初期セッションチェックが完了したか追跡
  const sessionCheckInProgress = useRef(false); // セッションチェックが進行中かどうかを追跡
  const isPageVisibleRef = useRef(true); // ページが可視状態かどうかを追跡

  // コンポーネントのマウント・アンマウント時に mountedRef を更新
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ページの可視性を監視（タブ切り替えを検知）
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      console.log('ページの可視性が変更されました:', isPageVisibleRef.current ? '可視' : '非可視');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
   * 主要な認証ロジックを管理するuseEffect。
   * 初回マウント時のセッションチェックと、認証状態変化のリアルタイムリスナー設定を行います。
   */
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    const setupAuth = async () => {
      if (!supabase) {
        if (mountedRef.current) {
          setError('Supabaseクライアントが初期化されていません。環境変数またはSupabaseProviderの設定を確認してください。');
          setLoading(false); // Supabaseが設定されていない場合はローディングを停止
        }
        return;
      }

      // 1. 初回マウント時のみセッションを明示的にチェック
      // (isInitialSessionChecked.current を使用して二重実行を防止)
      if (!isInitialSessionChecked.current && !sessionCheckInProgress.current) {
        sessionCheckInProgress.current = true; // チェック開始をマーク
        setError(null); // エラーをクリア
        
        try {
          console.log('useAuth: 初期セッションチェックを実行中...');
          // getSession()は通常localStorageから即座に読み取れるため、高速
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('useAuth: 初期セッション取得エラー:', sessionError.message);
            clearLocalSupabaseCache(); 
            if (mountedRef.current) {
              setError(`セッション検証に失敗しました: ${sessionError.message}。ローカルセッションをリセットしました。`);
              setUser(null);
              setLoading(false);
            }
          } else if (session?.user) {
            console.log('useAuth: アクティブな初期セッションが見つかりました (ユーザーID:', session.user.id, ')');
            // セッションが存在する場合、ユーザーデータを取得
            // この間はローディングを表示しない（既にセッションがあるため）
            const userData = await fetchUserData(supabase, session.user.id);
            if (mountedRef.current) {
              setUser(userData);
              setLoading(false); // 確実にローディングを解除
            }
          } else {
            console.log('useAuth: アクティブな初期セッションは見つかりませんでした。ユーザーはログインしていません。');
            if (mountedRef.current) {
              setUser(null);
              setLoading(false);
            }
          }
        } catch (err) {
          console.error('useAuth: 初期セッションチェック中に致命的なエラーが発生しました:', err);
          if (mountedRef.current) {
            setError(err instanceof Error ? err.message : '初期認証中にエラーが発生しました');
            setUser(null);
            setLoading(false);
          }
        } finally {
          if (mountedRef.current) {
            isInitialSessionChecked.current = true; // チェック済みとマーク
            sessionCheckInProgress.current = false; // チェック完了をマーク
            console.log('useAuth: 初期セッションチェックが完了しました。');
          }
        }
      }

      // 2. リアルタイムリスナーを設定し、今後の認証状態変化を処理
      console.log('useAuth: onAuthStateChange リスナーを設定中...');
      const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
            if (!mountedRef.current) return;
            console.log('onAuthStateChange: イベントを受信しました。セッション:', session ? 'アクティブ' : '非アクティブ', 'イベントタイプ:', event, 'ページ可視性:', isPageVisibleRef.current ? '可視' : '非可視');
            
            // ページが非可視の時（タブが切り替わっている時）は、TOKEN_REFRESHED以外のイベントをスキップ
            // ただし、SIGNED_INやSIGNED_OUTなどの重要なイベントは処理する
            if (!isPageVisibleRef.current && (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
              console.log('onAuthStateChange: ページが非可視のため、このイベントをスキップします:', event);
              return;
            }
            
            // TOKEN_REFRESHED イベントの場合は、ローディング状態を設定せず、ユーザーデータの再取得もスキップ
            // これは通常の動作であり、ユーザーに影響を与えるべきではない
            if (event === 'TOKEN_REFRESHED') {
              console.log('onAuthStateChange: トークンがリフレッシュされました。ローディング状態は変更しません。');
              return;
            }

            // INITIAL_SESSION イベントの場合も、既に初期チェックで処理済みなのでスキップ
            // これにより、リロード時の二重処理を防ぐ
            if (event === 'INITIAL_SESSION') {
              console.log('onAuthStateChange: 初期セッションイベントを受信しました。初期チェックで既に処理済みのためスキップします。');
              return;
            }

            // その他の認証イベント（SIGNED_IN, SIGNED_OUT, USER_UPDATED など）のみローディング状態を設定
            console.log('onAuthStateChange: 認証イベントを処理中...', event, session?.user?.id);
            setLoading(true); // 認証状態変化処理中はローディング状態に
            setError(null); // エラーをクリア
            
            // タイムアウトを設定して、処理が完了しない場合でもローディングを解除する
            const timeoutId = setTimeout(() => {
              if (mountedRef.current) {
                console.warn('onAuthStateChange: 処理がタイムアウトしました。ローディングを解除します。');
                setLoading(false);
              }
            }, 10000); // 10秒でタイムアウト
            
            try {
              if (session?.user) {
                console.log('onAuthStateChange: ユーザーデータを取得中...', session.user.id);
                const userData = await fetchUserData(supabase, session.user.id);
                console.log('onAuthStateChange: ユーザーデータ取得完了', userData ? userData.id : null, userData?.role);
                if (mountedRef.current) {
                  setUser(userData);
                  console.log('onAuthStateChange: ユーザー情報を設定しました');
                }
              } else {
                console.log('onAuthStateChange: セッションがありません。ユーザーをnullに設定します。');
                if (mountedRef.current) setUser(null);
              }
            } catch(err) {
                console.error('onAuthStateChange: 状態変化処理中に致命的なエラーが発生しました:', err);
                if (mountedRef.current) setError(err instanceof Error ? err.message : '認証状態変更中にエラーが発生しました');
            } finally {
              clearTimeout(timeoutId); // タイムアウトをクリア
              if (mountedRef.current) {
                setLoading(false); // イベント処理完了後は常にローディングを解除
                console.log('onAuthStateChange: イベント処理が終了しました。');
              }
            }
          }
        );
        subscription = authListener.subscription;
    };

    setupAuth(); // コンポーネントマウント時に認証設定ロジックを実行

    // クリーンアップ関数
    return () => {
      if (subscription) {
        console.log('useAuth: リスナーの購読を解除します。');
        subscription.unsubscribe();
      }
      console.log('useAuth: クリーンアップが完了しました。');
    };
  }, [supabase]); // supabaseクライアントが変更された場合にのみ再実行

  /**
   * セッションを再確認して、ユーザー情報を更新します。
   * ログイン成功後など、onAuthStateChangeが発火しない場合に使用します。
   */
  const refreshSession = async () => {
    if (!supabase) return;
    if (!mountedRef.current) return;
    
    try {
      console.log('useAuth: セッションを再確認中...');
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('useAuth: セッション再確認エラー:', sessionError.message);
        if (mountedRef.current) {
          setError(`セッション検証に失敗しました: ${sessionError.message}`);
          setUser(null);
          setLoading(false);
        }
        return;
      }
      
      if (session?.user) {
        console.log('useAuth: セッション再確認成功 (ユーザーID:', session.user.id, ')');
        const userData = await fetchUserData(supabase, session.user.id);
        if (mountedRef.current) {
          setUser(userData);
          setLoading(false);
          console.log('useAuth: ユーザー情報を更新しました');
        }
      } else {
        console.log('useAuth: セッションが見つかりませんでした');
        if (mountedRef.current) {
          setUser(null);
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('useAuth: セッション再確認中にエラーが発生しました:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'セッション再確認中にエラーが発生しました');
        setUser(null);
        setLoading(false);
      }
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
    refreshSession, // セッション再確認関数を公開
    // getInitialSession はuseAuthフック内部で管理されるため、外部には公開しない
  };
}
