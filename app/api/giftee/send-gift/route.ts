import { NextRequest, NextResponse } from 'next/server';

// Giftee API設定
const GIFTEE_ACCESS_TOKEN = process.env.GIFTEE_ACCESS_TOKEN || '8db9f9d2-9ea7-4295-a8a0-db9eef54af0b';
const GIFTEE_API_URL = 'https://g4b.giftee.biz/api/gift_cards';

// 選べるペイと選べるギフトの設定コード
const GIFTEE_CONFIG_CODES = {
  erabepay: '4c431248-f915-4b3c-be52-2f3cd689bf26', // 選べるペイ（仮のコード）
  erabegift: '4c431248-f915-4b3c-be52-2f3cd689bf26', // 選べるギフト（仮のコード）
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exchangeType, pointsAmount, userId, userEmail } = body;

    if (!exchangeType || !pointsAmount || !userId) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    // 交換タイプに応じた設定コードを取得
    const giftCardConfigCode = 
      exchangeType === 'erabepay' 
        ? GIFTEE_CONFIG_CODES.erabepay 
        : GIFTEE_CONFIG_CODES.erabegift;

    // Giftee APIを呼び出し
    const basicAuth = Buffer.from(`${GIFTEE_ACCESS_TOKEN}:`).toString('base64');
    
    const requestBody = {
      gift_card_config_code: giftCardConfigCode,
      issue_identity: userId, // ユーザーIDを識別子として使用
    };
    
    console.log('Giftee API呼び出し開始:', {
      url: GIFTEE_API_URL,
      method: 'POST',
      giftCardConfigCode,
      userId,
      userEmail,
      exchangeType,
      pointsAmount,
    });
    
    const response = await fetch(GIFTEE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Giftee APIレスポンス:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Giftee API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        requestBody,
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
          error: 'ギフト送信に失敗しました', 
          details: errorDetails,
          status: response.status,
          statusText: response.statusText,
          requestBody,
        },
        { status: response.status }
      );
    }

    const giftData = await response.json();
    console.log('Giftee API成功レスポンス:', JSON.stringify(giftData, null, 2));

    // Rubyコードと同じように、レスポンスからURLを抽出
    const giftCardUrl = giftData?.gift_card?.url || null;

    if (!giftCardUrl) {
      console.error('Giftee APIレスポンスにURLが含まれていません:', {
        fullResponse: giftData,
        giftCardPath: giftData?.gift_card,
        availableKeys: Object.keys(giftData || {}),
      });
      return NextResponse.json(
        { 
          error: 'ギフトカードURLの取得に失敗しました', 
          details: giftData,
          fullResponse: giftData,
        },
        { status: 500 }
      );
    }
    
    console.log('ギフトカードURL取得成功:', giftCardUrl);

    return NextResponse.json({
      success: true,
      giftData,
      giftCardUrl, // URLを明示的に返す
      exchangeType,
      pointsAmount,
    });
  } catch (error) {
    console.error('Giftee API呼び出しエラー:', error);
    return NextResponse.json(
      { error: 'ギフト送信処理中にエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

