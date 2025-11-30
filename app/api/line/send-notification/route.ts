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

    if (!userId || !message) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    if (!lineChannelAccessToken) {
      return NextResponse.json(
        { error: 'サーバー設定エラー: LINE_CHANNEL_ACCESS_TOKENが設定されていません' },
        { status: 500 }
      );
    }

    // user_line_linksテーブルからLINEのユーザーIDを取得
    const { data: lineLink, error: linkError } = await supabase
      .from('user_line_links')
      .select('line_user_id')
      .eq('user_id', userId)
      .single();

    if (linkError || !lineLink?.line_user_id) {
      return NextResponse.json(
        { error: 'LINE連携が見つかりませんでした' },
        { status: 404 }
      );
    }

    // LINE Messaging APIでプッシュ通知を送信
    const response = await fetch(LINE_MESSAGING_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lineChannelAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: lineLink.line_user_id,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE API Error:', errorText);
      return NextResponse.json(
        { error: 'LINE通知の送信に失敗しました', details: errorText },
        { status: response.status }
      );
    }

    const lineData = await response.json();

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

