import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // 環境変数のチェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
    const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET;
    const LINE_REDIRECT_URI = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase環境変数が設定されていません');
      return NextResponse.redirect(
        new URL('/?line_link_status=failure&error=サーバー設定エラー: Supabase環境変数が設定されていません', request.url)
      );
    }

    if (!LINE_CLIENT_ID || !LINE_CLIENT_SECRET || !LINE_REDIRECT_URI) {
      console.error('LINE OAuth環境変数が設定されていません');
      return NextResponse.redirect(
        new URL('/?line_link_status=failure&error=サーバー設定エラー: LINE OAuth環境変数が設定されていません', request.url)
      );
    }

    // Supabaseクライアントを作成（サーバーサイド用）
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // エラーがある場合
    if (error) {
      const errorMsg = errorDescription || error;
      return NextResponse.redirect(
        new URL(`/?line_link_status=failure&error=${encodeURIComponent(errorMsg)}`, request.url)
      );
    }

    // codeとstateがない場合
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?line_link_status=failure&error=認証パラメータが不足しています', request.url)
      );
    }

    // stateから一時トークンを復元
    let tempToken: string;
    try {
      // URL-safe base64デコード（- → +, _ → /, パディング追加）
      let stateBase64 = state.replace(/-/g, '+').replace(/_/g, '/');
      // パディングを追加（必要に応じて）
      while (stateBase64.length % 4) {
        stateBase64 += '=';
      }
      const decodedState = Buffer.from(stateBase64, 'base64').toString('utf-8');
      const stateData = JSON.parse(decodedState);
      tempToken = stateData.token;
      console.log('State復号化成功。トークン:', tempToken?.substring(0, 8) + '...');
    } catch (err) {
      console.error('State復号化エラー:', err);
      return NextResponse.redirect(
        new URL('/?line_link_status=failure&error=認証情報の検証に失敗しました', request.url)
      );
    }

    if (!tempToken) {
      console.error('トークンが抽出できませんでした');
      return NextResponse.redirect(
        new URL('/?line_link_status=failure&error=トークンが抽出できませんでした', request.url)
      );
    }

    // 一時トークンからユーザーIDを取得
    let userId: string;
    try {
      console.log('セッション検索開始:', {
        token: tempToken?.substring(0, 8) + '...',
        tokenLength: tempToken?.length
      });

      const { data: sessionData, error: sessionError } = await supabase
        .from('line_link_sessions')
        .select('user_id, expires_at, created_at')
        .eq('token', tempToken)
        .single();

      console.log('セッション検索結果:', {
        hasData: !!sessionData,
        hasError: !!sessionError,
        error: sessionError ? {
          message: sessionError.message,
          code: sessionError.code,
          details: sessionError.details,
          hint: sessionError.hint
        } : null,
        data: sessionData ? {
          user_id: sessionData.user_id,
          expires_at: sessionData.expires_at,
          created_at: sessionData.created_at
        } : null
      });

      if (sessionError) {
        console.error('セッション取得エラー詳細:', {
          message: sessionError.message,
          code: sessionError.code,
          details: sessionError.details,
          hint: sessionError.hint
        });

        // エラーコードに応じた詳細なメッセージ
        let errorMessage = 'セッションが見つかりません';
        if (sessionError.code === 'PGRST116') {
          errorMessage = 'セッションが見つかりません（テーブルが存在しないか、データがありません）';
        } else if (sessionError.code === '42501') {
          errorMessage = 'セッション取得権限がありません（RLSポリシーを確認してください）';
        }

        return NextResponse.redirect(
          new URL(`/?line_link_status=failure&error=${encodeURIComponent(errorMessage)}`, request.url)
        );
      }

      if (!sessionData) {
        console.error('セッションデータがnullです');
        
        // デバッグ用: テーブル内の最新セッションを確認
        const { data: debugData } = await supabase
          .from('line_link_sessions')
          .select('token, user_id, expires_at, created_at')
          .order('created_at', { ascending: false })
          .limit(5);
        
        console.log('デバッグ: テーブル内の最新セッション（最新5件）:', debugData);
        
        return NextResponse.redirect(
          new URL('/?line_link_status=failure&error=セッションが見つかりません', request.url)
        );
      }

      // 期限チェック
      const expiresAt = new Date(sessionData.expires_at);
      const now = new Date();
      
      console.log('期限チェック:', {
        expiresAt: expiresAt.toISOString(),
        now: now.toISOString(),
        expiresAtLocal: expiresAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        nowLocal: now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        isExpired: expiresAt < now,
        timeDiff: expiresAt.getTime() - now.getTime(),
        timeDiffMinutes: Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60)
      });
      
      if (expiresAt < now) {
        console.error('セッションの期限が切れています', {
          expiresAt: expiresAt.toISOString(),
          now: now.toISOString(),
          diff: expiresAt.getTime() - now.getTime()
        });
        return NextResponse.redirect(
          new URL('/?line_link_status=failure&error=セッションの期限が切れています', request.url)
        );
      }

      userId = sessionData.user_id;
      console.log('ユーザーID取得成功:', userId);

      // セッションを削除（使い捨て）
      await supabase
        .from('line_link_sessions')
        .delete()
        .eq('token', tempToken);
    } catch (err) {
      console.error('セッション取得中にエラー:', err);
      return NextResponse.redirect(
        new URL('/?line_link_status=failure&error=セッション取得に失敗しました', request.url)
      );
    }

    // LINE OAuthトークンを取得
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: LINE_REDIRECT_URI,
        client_id: LINE_CLIENT_ID,
        client_secret: LINE_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('LINE トークン取得エラー:', errorText);
      return NextResponse.redirect(
        new URL('/?line_link_status=failure&error=トークン取得に失敗しました', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token;

    // IDトークンからユーザー情報を取得
    let lineUserId: string;
    try {
      // IDトークンのペイロードをデコード（簡易版）
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      lineUserId = payload.sub; // LINEユーザーID
    } catch (err) {
      console.error('IDトークンデコードエラー:', err);
      // フォールバック: LINE Profile APIから取得
      const profileResponse = await fetch('https://api.line.me/v2/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!profileResponse.ok) {
        throw new Error('プロフィール取得に失敗しました');
      }
      
      const profileData = await profileResponse.json();
      lineUserId = profileData.userId;
    }

    // user_line_linksテーブルに保存または更新
    console.log('LINE連携データを保存中...', {
      userId,
      lineUserId: lineUserId?.substring(0, 10) + '...', // セキュリティのため一部のみ表示
    });

    const { data: upsertData, error: upsertError } = await supabase
      .from('user_line_links')
      .upsert({
        user_id: userId,
        line_user_id: lineUserId,
        access_token: accessToken, // 必要に応じて保存（セキュリティに注意）
      }, {
        onConflict: 'user_id',
      })
      .select();

    if (upsertError) {
      console.error('LINE連携データ保存エラー:', upsertError);
      console.error('エラー詳細:', {
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
        code: upsertError.code
      });
      return NextResponse.redirect(
        new URL(`/?line_link_status=failure&error=データ保存に失敗しました: ${encodeURIComponent(upsertError.message || '不明なエラー')}`, request.url)
      );
    }

    console.log('LINE連携データ保存成功:', {
      userId,
      lineUserId: lineUserId?.substring(0, 10) + '...',
      saved: !!upsertData
    });

    // 成功時はリダイレクト
    return NextResponse.redirect(
      new URL('/?line_link_status=success', request.url)
    );
  } catch (error) {
    console.error('LINE連携コールバックエラー:', error);
    return NextResponse.redirect(
      new URL(`/?line_link_status=failure&error=${encodeURIComponent(error instanceof Error ? error.message : '不明なエラー')}`, request.url)
    );
  }
}

