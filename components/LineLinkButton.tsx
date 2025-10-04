'use client'

import React, { useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid'; // UUID生成ライブラリをインストールする必要があります (npm install uuid)

// 環境変数からGASのCallback URLとLINEのChannel IDを読み込む (ここでは仮のプレースホルダを使用)
// 実際には .env.local にて定義が必要です。
const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID || 'YOUR_LINE_CHANNEL_ID';
const LINE_REDIRECT_URI = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI || 'YOUR_GAS_WEB_APP_URL';

// 必須スコープ: profileとopenidは必須
const SCOPE = 'profile openid'; 
// 任意の友だち追加オプション: 公式LINEアカウントの友だち追加を推奨
const PROMPT = 'consent'; // 再同意を常に求める
const BOT_PROMPT = 'aggressive'; // 友だち追加を強制 (optional)

export function LineLinkButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLineLink = () => {
    if (!user?.id) {
      setError('ユーザーがログインしていません。');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
        // ① state の生成 (CSRF対策)
        // 実際には、この state と user.id をサーバー側で一時保存する必要があります。
        // ここでは簡略化のため user.id を state に含めてBase64エンコードします。
        // ★★★ 注: 運用環境では、stateをサーバー側(DB)に保存し、user.idと紐づけるのが最も安全です。★★★
        const rawState = JSON.stringify({ userId: user.id, random: uuidv4() });
        const encodedState = btoa(rawState); 
        
        // ② LINE 認証 URL の生成
        const lineAuthUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
        lineAuthUrl.searchParams.append('response_type', 'code');
        lineAuthUrl.searchParams.append('client_id', LINE_CLIENT_ID);
        lineAuthUrl.searchParams.append('redirect_uri', LINE_REDIRECT_URI);
        lineAuthUrl.searchParams.append('scope', SCOPE);
        lineAuthUrl.searchParams.append('state', encodedState);
        lineAuthUrl.searchParams.append('prompt', PROMPT);
        // 公式LINEを友だち追加させるためのオプション
        lineAuthUrl.searchParams.append('bot_prompt', BOT_PROMPT); 
        
        // ③ リダイレクト
        window.location.href = lineAuthUrl.toString();

    } catch (e) {
        console.error("LINE連携エラー:", e);
        setError('LINE連携を開始できませんでした。');
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-xl border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <MessageSquare className="w-5 h-5 mr-2 text-green-500" />
        LINE通知・連携
      </h3>
      <p className="text-gray-600 text-center mb-4">
        公式LINEと連携し、アンケート開始の通知を受け取りましょう。
      </p>
      
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <button
        onClick={handleLineLink}
        disabled={loading || !user?.id}
        className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            連携処理中...
          </>
        ) : (
          <>
            <img src="/line_icon.png" alt="LINE" className="w-5 h-5 mr-2" /> 
            LINEアカウントと連携する
          </>
        )}
      </button>
      <p className="text-xs text-gray-500 mt-2">※通知はLINE公式アカウントから届きます</p>
      {/* 備考: line_icon.png は publicフォルダに用意してください */}
    </div>
  );
}
