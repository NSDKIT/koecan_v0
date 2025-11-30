import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// LINE Messaging API設定
const LINE_MESSAGING_API_URL = 'https://api.line.me/v2/bot/message/push';

export async function POST(request: NextRequest) {
  try {
    // 環境変数のチェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase環境変数が設定されていません');
      return NextResponse.json(
        { error: 'サーバー設定エラー: Supabase環境変数が設定されていません' },
        { status: 500 }
      );
    }

    // Supabaseクライアントを作成（サーバーサイド用）
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { userId, message } = body;

    console.log('LINE通知送信API呼び出し開始:', {
      userId,
      messageLength: message?.length,
      messagePreview: message?.substring(0, 100) + '...',
    });

    if (!userId || !message) {
      console.error('必要なパラメータが不足しています:', { userId: !!userId, message: !!message });
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    if (!lineChannelAccessToken) {
      console.error('LINE_CHANNEL_ACCESS_TOKENが設定されていません');
      return NextResponse.json(
        { error: 'サーバー設定エラー: LINE_CHANNEL_ACCESS_TOKENが設定されていません' },
        { status: 500 }
      );
    }

    // user_line_linksテーブルからLINEのユーザーIDを取得
    console.log('LINE連携情報を取得中...', { userId });
    const { data: lineLink, error: linkError } = await supabase
      .from('user_line_links')
      .select('line_user_id')
      .eq('user_id', userId)
      .single();

    if (linkError) {
      console.error('LINE連携情報取得エラー:', {
        message: linkError.message,
        code: linkError.code,
        details: linkError.details,
        hint: linkError.hint,
      });
      return NextResponse.json(
        { error: 'LINE連携情報の取得に失敗しました', details: linkError },
        { status: 500 }
      );
    }

    if (!lineLink?.line_user_id) {
      console.error('LINE連携が見つかりませんでした:', { userId, lineLink });
      return NextResponse.json(
        { error: 'LINE連携が見つかりませんでした', details: { userId, lineLink } },
        { status: 404 }
      );
    }

    console.log('LINE連携情報取得成功:', {
      userId,
      lineUserId: lineLink.line_user_id?.substring(0, 10) + '...',
    });

    // LINE Messaging APIでプッシュ通知を送信
    const requestBody = {
      to: lineLink.line_user_id,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    };

    console.log('LINE Messaging API呼び出し開始:', {
      url: LINE_MESSAGING_API_URL,
      to: lineLink.line_user_id?.substring(0, 10) + '...',
      messageLength: message.length,
      hasAccessToken: !!lineChannelAccessToken,
    });

    const response = await fetch(LINE_MESSAGING_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lineChannelAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('LINE Messaging APIレスポンス:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        requestBody: {
          ...requestBody,
          to: requestBody.to?.substring(0, 10) + '...', // セキュリティのため一部のみ表示
        },
      });
      
      // JSONとしてパースを試みる
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }
      
      return NextResponse.json(
        { 
          error: 'LINE通知の送信に失敗しました', 
          details: errorDetails,
          status: response.status,
          statusText: response.statusText,
        },
        { status: response.status }
      );
    }

    const lineData = await response.json();
    console.log('LINE通知送信成功:', lineData);

    return NextResponse.json({
      success: true,
      lineData,
    });
  } catch (error) {
    console.error('LINE通知送信エラー:', error);
    return NextResponse.json(
      { error: 'LINE通知送信処理中にエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

