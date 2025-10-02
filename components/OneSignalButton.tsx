// koecan_v0-main/components/OneSignalButton.tsx

'use client'

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react'; 

export const OneSignalButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  // 初期状態を null にして、OneSignalのチェックが終わるまでボタンを表示しない
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null); 
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
    
    // OneSignalDeferred の存在を保証
    (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];

    // ★★★ 修正箇所 1: 初期化後の購読状態チェックとイベントリスナーの設定 ★★★
    (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
        addDebugInfo('Inside OneSignalDeferred.push (after init)');
        setOneSignalReady(true);

        try {
            // 1. 初期状態の確認 (v16 API)
            const permission = await OneSignal.Notifications.getPermission();
            const isEnabled = permission === 'granted';
            setIsSubscribed(isEnabled);
            
            addDebugInfo(`Initial permission status: ${permission}`);
            
            if (isEnabled) {
                 OneSignal.User.getPushSubscriptionId().then((userId: string) => {
                    addDebugInfo(`OneSignal User ID: ${userId}`);
                 });
            }

            // 2. 購読状態変更のイベントリスナーを設定 (v16 API)
            OneSignal.Notifications.addEventListener('permissionChange', (isGranted: boolean) => {
              setIsSubscribed(isGranted);
              addDebugInfo(`Permission changed to: ${isGranted ? 'Granted' : 'Denied'}`);
            });

        } catch (error) {
             console.error("Error in OneSignal initial check:", error);
             addDebugInfo(`Error in initial check: ${error}`);
             setIsSubscribed(false); // エラー時は未購読として扱う
        }
        setIsLoading(false); // 初期チェック完了
    });
    // ★★★ 修正箇所 1 ここまで ★★★

  }, []);

  // ★★★ 修正箇所 2: 購読処理 (handleSubscribe) の修正 ★★★
  const handleSubscribe = async () => {
    addDebugInfo('Subscribe button clicked');
    setIsLoading(true);
    setMessage('');
    
    try {
      if (!('Notification' in window)) {
        addDebugInfo('Notification API not supported');
        setMessage('❌ このブラウザはプッシュ通知をサポートしていません。');
        setIsLoading(false);
        return;
      }
      
      if (!oneSignalReady) {
          setMessage('❌ OneSignal SDKがまだ初期化されていません。');
          setIsLoading(false);
          return;
      }

      // OneSignalDeferred.push で確実に初期化後の OneSignal オブジェクトを使う
      (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
        addDebugInfo('Inside OneSignalDeferred.push for subscription');

        // requestPermission() はプロンプトを表示し、ユーザーの許可を待つ (v16 API)
        const result = await OneSignal.Notifications.requestPermission();
        
        if (result) {
           // 許可された場合
           setMessage('✅ プッシュ通知が有効になりました！OneSignalに登録されました。');
           OneSignal.User.getPushSubscriptionId().then((userId: string) => {
               addDebugInfo(`OneSignal User ID after subscription: ${userId}`);
           });
        } else {
           // 拒否された場合
           setMessage('⚠️ 購読に失敗しました。ブラウザ設定またはOneSignal設定を確認してください。');
        }
        
        // 最終的な状態を再確認し、UIを更新
        const finalPermission = await OneSignal.Notifications.getPermission();
        setIsSubscribed(finalPermission === 'granted');
        setIsLoading(false);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDebugInfo(`Subscribe error: ${errorMessage}`);
      setMessage('❌ プッシュ通知の設定に失敗しました。');
      setIsLoading(false);
    }
  };
// ★★★ 修正箇所 2 ここまで ★★★

  // ★★★ 修正箇所 3: 購読解除処理 (handleUnsubscribe) の修正 ★★★
  const handleUnsubscribe = () => {
    addDebugInfo('Unsubscribe button clicked');
    setIsLoading(true);

    if ((window as any).OneSignal && oneSignalReady) {
      (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
        try {
            // v16 SDKでプッシュ通知を無効化（ブラウザ設定を変更するわけではない点に注意）
            await OneSignal.Notifications.requestPermission(false); 
            setIsSubscribed(false);
            setMessage('🔕 プッシュ通知を無効にしました。');
            addDebugInfo('Unsubscribed successfully');
        } catch (error) {
            console.error("Error unsubscribing:", error);
            setMessage('❌ 通知の無効化に失敗しました。');
        } finally {
            setIsLoading(false);
        }
      });
    } else {
        setIsLoading(false);
    }
  };
// ★★★ 修正箇所 3 ここまで ★★★


  const handleTestBrowserNotification = async () => {
    // ... (ブラウザ通知テスト関数はそのまま) ...
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

  // isSubscribed が null の間はローディング表示
  if (isSubscribed === null) {
      return (
          <div className="flex items-center justify-center space-y-4 p-6 bg-white rounded-lg shadow-lg">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
              <p className="text-gray-600">通知状態を確認中...</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800">プッシュ通知設定</h3>
      {/* ... (その他のUI要素はそのまま) ... */}
      
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
      
      {/* デバッグセクション (デバッグ情報ログはそのまま) */}
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
