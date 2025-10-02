// koecan_v0-main/components/OneSignalButton.tsx

'use client'

import React, { useState, useEffect } from 'react';
// lucide-react から Bell, BellOff, Loader2 をインポート（元のファイルにインポートがなかったため追加します）
import { Bell, BellOff, Loader2 } from 'lucide-react'; 

export const OneSignalButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [oneSignalReady, setOneSignalReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    addDebugInfo('Component mounted');
    
    // 環境チェック
    addDebugInfo(`HTTPS: ${window.location.protocol === 'https:'}`);
    addDebugInfo(`Notification API: ${'Notification' in window}`);
    addDebugInfo(`Service Worker: ${'serviceWorker' in navigator}`);
    
    // OneSignalの準備状態を確認（isPushNotificationsEnabledは呼び出さない！）
    const checkOneSignalReady = () => {
      if ((window as any).OneSignal && typeof (window as any).OneSignal.push === 'function') {
        addDebugInfo('OneSignal object found');
        setOneSignalReady(true);
        clearInterval(interval); // ★★★ 準備できたらポーリングを即停止

        // ★★★ 初期状態を確認する関数をキューに入れる ★★★
        (window as any).OneSignal.push(function() {
            // SDKの初期化処理が完了してからこのブロックが実行される
            (window as any).OneSignal.isPushNotificationsEnabled(function(isEnabled: boolean) {
              setIsSubscribed(isEnabled);
              addDebugInfo(`Subscription status: ${isEnabled}`);
            });
        });

      } else {
        addDebugInfo('OneSignal object not found or not initialized yet.');
      }
    };

    let interval = setInterval(checkOneSignalReady, 1000); // intervalをletで宣言

    // 10秒後にタイムアウト
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!oneSignalReady) {
        addDebugInfo('OneSignal timeout after 10 seconds');
        setMessage('⚠️ OneSignalの読み込みに時間がかかっています。');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [oneSignalReady]);

  // ★★★ 修正された handleSubscribe 関数 ★★★
  const handleSubscribe = async () => {
    addDebugInfo('Subscribe button clicked');
    setIsLoading(true);
    setMessage('');
    
    try {
      // 1. 環境チェック
      if (!('Notification' in window)) {
        addDebugInfo('Notification API not supported');
        setMessage('❌ このブラウザはプッシュ通知をサポートしていません。');
        setIsLoading(false);
        return;
      }

      addDebugInfo(`Current permission: ${Notification.permission}`);

      if ((window as any).OneSignal && oneSignalReady) {
        addDebugInfo('Using OneSignal for subscription');
        
        // OneSignalの非同期キューに処理を追加
        (window as any).OneSignal.push(async function() { // push内の関数をasyncに
          addDebugInfo('Inside OneSignal.push');

          // 2. 購読状態をOneSignalに確認
          const isEnabled = await (window as any).OneSignal.isPushNotificationsEnabled();
          addDebugInfo(`OneSignal initial check status: ${isEnabled}`);
          
          if (isEnabled) {
            // 既にOneSignalに購読済みの場合
            addDebugInfo('Already enabled in OneSignal. Updating UI.');
          } else {
            // 未購読の場合、登録を試みる (最も確実な直接登録API)
            addDebugInfo('Attempting to register for push notifications...');
            
            // ブラウザ許可済みならプロンプトなしで登録、未許可ならプロンプトが表示される
            await (window as any).OneSignal.registerForPushNotifications();
            addDebugInfo('registerForPushNotifications resolved.');
          }
          
          // 3. 最終的な状態を再確認し、UIを更新
          const finalStatus = await (window as any).OneSignal.isPushNotificationsEnabled();
          setIsSubscribed(finalStatus);
          
          if (finalStatus) {
            setMessage('✅ プッシュ通知が有効になりました！OneSignalに登録されました。');
            (window as any).OneSignal.getUserId(function(userId: string) {
              addDebugInfo(`OneSignal User ID: ${userId}`);
            });
          } else {
            // 失敗した場合は、ブラウザの通知許可が拒否された可能性が高い
            setMessage('⚠️ 購読に失敗しました。ブラウザ設定またはOneSignal設定を確認してください。');
          }
        });
      } else {
        // OneSignal SDKが利用できない場合のフォールバック
        setMessage('❌ OneSignal SDKが利用できません。');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDebugInfo(`Subscribe error: ${errorMessage}`);
      setMessage('❌ プッシュ通知の設定に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };
// ★★★ 修正された handleSubscribe 関数ここまで ★★★

  const handleUnsubscribe = () => {
    addDebugInfo('Unsubscribe button clicked');
    if ((window as any).OneSignal && oneSignalReady) {
      (window as any).OneSignal.push(function() {
        (window as any).OneSignal.setSubscription(false).then(function() {
          setIsSubscribed(false);
          setMessage('🔕 プッシュ通知を無効にしました。');
          addDebugInfo('Unsubscribed successfully');
        });
      });
    }
  };

  const handleTestBrowserNotification = async () => {
    addDebugInfo('Testing browser notification');
    try {
      const permission = await Notification.requestPermission();
      addDebugInfo(`Browser permission: ${permission}`);
      
      if (permission === 'granted') {
        new Notification('テスト通知', {
          body: 'ブラウザの通知機能は正常に動作しています。',
          icon: '/icon-192x192.png'
        });
        addDebugInfo('Test notification sent');
      }
    } catch (error) {
      addDebugInfo(`Browser notification error: ${error}`);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800">プッシュ通知設定</h3>
      <p className="text-sm text-gray-600 text-center">
        重要なお知らせやアンケートの通知を受け取るために、プッシュ通知を有効にしてください。
      </p>
      
      {!oneSignalReady && (
        <div className="text-yellow-600 text-sm">OneSignalを読み込み中...</div>
      )}
      
      {!isSubscribed ? (
        <button
          onClick={handleSubscribe}
          disabled={isLoading || !oneSignalReady}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {isLoading ? '設定中...' : 'プッシュ通知を許可する'}
        </button>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <div className="text-green-600 font-semibold">✅ プッシュ通知が有効です</div>
          <button
            onClick={handleUnsubscribe}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            通知を無効にする
          </button>
        </div>
      )}
      
      {message && (
        <div className="text-sm text-center max-w-xs whitespace-pre-line bg-gray-50 p-3 rounded-lg">
          {message}
        </div>
      )}
      
      {/* デバッグセクション */}
      <div className="w-full max-w-md border-t pt-4">
        <h4 className="text-sm font-semibold mb-2">デバッグ情報</h4>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={handleTestBrowserNotification}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
          >
            ブラウザ通知テスト
          </button>
          <button
            onClick={clearDebugInfo}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
          >
            ログクリア
          </button>
        </div>
        
        <div className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-y-auto">
          {debugInfo.length === 0 ? (
            <div className="text-gray-500">デバッグ情報はここに表示されます</div>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index} className="mb-1">{info}</div>
            ))
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center max-w-xs">
        <p>📱 <strong>携帯端末をご利用の場合：</strong></p>
        <p>• <strong>Android:</strong> Chrome、Firefox、Edgeをご使用ください</p>
        <p>• <strong>iPhone:</strong> Safariでホーム画面に追加後、PWAとして起動してください</p>
      </div>
    </div>
  );
};
