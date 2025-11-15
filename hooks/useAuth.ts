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
   * 初期ロード時とタブの再アクティブ化時に呼び出されます。
   */
  const checkAndSetSession = useCallback(async () => {
    if (!supabase || !mountedRef.current) return;

    setLoading(true); // チェック中はローディング状態に
    setError(null);    // エラーをクリア

    try {
      console.log('checkAndSetSession: 現在のセッションをチェック中...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('checkAndSetSession: セッション取得エラー:', sessionError.message);
        clearLocalSupabaseCache(); 
        if (mountedRef.current) {
          setError(`セッション検証に失敗しました: ${sessionError.message}。ローカルセッションをリセットしました。`);
          setUser(null);
        }
      } else if (session?.user) {
        console.log('checkAndSetSession: アクティブなセッションが見つかりました (ユーザーID:', session.user.id, ')');
        const userData = await fetchUserData(supabase, session.user.id);
        if (mountedRef.current) setUser(userData);
      } else {
        console.log('checkAndSetSession: アクティブなセッションは見つかりませんでした。ユーザーはログインしていません。');
        if (mountedRef.current) setUser(null);
      }
    } catch (err) {
      console.error('checkAndSetSession: セッションチェック中に致命的なエラーが発生しました:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : '認証中にエラーが発生しました');
        setUser(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false); // チェック完了後はローディングを停止
        console.log('checkAndSetSession: セッションチェックが完了しました。');
      }
    }
  }, [supabase]);


  /**
   * 主要な認証ロジックを管理するuseEffect。
   * 初回マウント時のセッションチェック、認証状態変化のリアルタイムリスナー、
   * およびブラウザタブの可視性変更リスナー設定を行います。
   */
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    if (!supabase) {
      if (mountedRef.current) {
        setError('Supabaseクライアントが初期化されていません。環境変数またはSupabaseProviderの設定を確認してください。');
        setLoading(false); // Supabaseが設定されていない場合はローディングを停止
      }
      return;
    }

    // 1. コンポーネントマウント時に一度セッションをチェック
    console.log('useAuth: 初期ロード時にセッションチェックを実行します。');
    checkAndSetSession();

    // 2. リアルタイムリスナーを設定し、今後の認証状態変化を処理
    console.log('useAuth: onAuthStateChange リスナーを設定中...');
    const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mountedRef.current) return;
          console.log('onAuthStateChange: イベントを受信しました。セッション:', session ? 'アクティブ' : '非アクティブ', 'イベントタイプ:', _event);
          setLoading(true); // 認証状態変化処理中はローディング状態に
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

    // 3. ブラウザタブの可視性変更リスナーを設定
    // タブが再度アクティブになったときに認証状態を再確認します。
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('visibilitychange: タブがアクティブになりました。セッションを再チェックします。');
        checkAndSetSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);


    // クリーンアップ関数
    return () => {
      if (subscription) {
        console.log('useAuth: onAuthStateChange リスナーの購読を解除します。');
        subscription.unsubscribe();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('useAuth: クリーンアップが完了しました。');
    };
  }, [supabase, checkAndSetSession]); // checkAndSetSession も依存配列に含める

  return {
    user,
    loading,
    error,
    signOut,
  };
}
