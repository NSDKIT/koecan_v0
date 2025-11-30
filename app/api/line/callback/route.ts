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
    // service_roleキーを使用することで、RLSポリシーをバイパスします
    console.log('Supabaseクライアント作成開始...', {
      supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
      serviceKeyLength: supabaseServiceKey?.length,
      serviceKeyPrefix: supabaseServiceKey?.substring(0, 20) + '...',
    });
    
    // service_roleキーを使用する場合、オプションを指定しない方が確実
    // 参考: app/api/line/send-notification/route.ts と同じ方法
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Supabaseクライアント作成完了（service_role使用）');
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

    // stateからuser.idを復元
    let userId: string;
    try {
      // URL-safe base64デコード（- → +, _ → /, パディング追加）
      let stateBase64 = state.replace(/-/g, '+').replace(/_/g, '/');
      // パディングを追加（必要に応じて）
      while (stateBase64.length % 4) {
        stateBase64 += '=';
      }
      const decodedState = Buffer.from(stateBase64, 'base64').toString('utf-8');
      const stateData = JSON.parse(decodedState);
      userId = stateData.userId;
      console.log('State復号化成功。ユーザーID:', userId?.substring(0, 8) + '...');
    } catch (err) {
      console.error('State復号化エラー:', err);
      return NextResponse.redirect(
        new URL('/?line_link_status=failure&error=認証情報の検証に失敗しました', request.url)
      );
    }

    if (!userId) {
      console.error('ユーザーIDが抽出できませんでした');
      return NextResponse.redirect(
        new URL('/?line_link_status=failure&error=ユーザーIDが抽出できませんでした', request.url)
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

    // まず既存レコードを確認
    console.log('既存レコードを確認中...', { userId });
    const { data: existingData, error: selectError } = await supabase
      .from('user_line_links')
      .select('user_id, line_user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('既存レコード確認エラー:', {
        message: selectError.message,
        code: selectError.code,
        details: selectError.details,
        hint: selectError.hint,
      });
    } else {
      console.log('既存レコード確認結果:', existingData ? '存在する' : '存在しない');
    }

    let upsertData;
    let upsertError;

    if (existingData) {
      // 既存レコードがある場合はUPDATE
      console.log('既存レコードを更新します:', existingData);
      const { data: updateData, error: updateError } = await supabase
        .from('user_line_links')
        .update({
          line_user_id: lineUserId,
        })
        .eq('user_id', userId)
        .select();

      upsertData = updateData;
      upsertError = updateError;
    } else {
      // 新規レコードの場合はINSERT
      console.log('新規レコードを挿入します');
      const { data: insertData, error: insertError } = await supabase
        .from('user_line_links')
        .insert({
          user_id: userId,
          line_user_id: lineUserId,
        })
        .select();

      upsertData = insertData;
      upsertError = insertError;
    }

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

