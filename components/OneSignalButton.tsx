'use client'

import React, { useState, useEffect } from 'react';

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
    
    // OneSignalの準備状態を確認
    const checkOneSignalReady = () => {
      if ((window as any).OneSignal) {
        addDebugInfo('OneSignal object found');
        
        if (typeof (window as any).OneSignal.push === 'function') {
          addDebugInfo('OneSignal.push is function - Ready!');
          setOneSignalReady(true);
          
          // 購読状態を確認
          (window as any).OneSignal.push(function() {
            (window as any).OneSignal.isPushNotificationsEnabled(function(isEnabled: boolean) {
              setIsSubscribed(isEnabled);
              addDebugInfo(`Subscription status: ${isEnabled}`);
            });
          });
        } else {
          addDebugInfo(`OneSignal.push type: ${typeof (window as any).OneSignal.push}`);
        }
      } else {
        addDebugInfo('OneSignal object not found');
      }
    };

    // OneSignalが準備できるまで待機
    const interval = setInterval(() => {
      checkOneSignalReady();
      if (oneSignalReady) {
        clearInterval(interval);
      }
    }, 1000);

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

  const handleSubscribe = async () => {
    addDebugInfo('Subscribe button clicked');
    setIsLoading(true);
    setMessage('');
    
    try {
      // まずブラウザの通知許可を確認
      if (!('Notification' in window)) {
        addDebugInfo('Notification API not supported');
        setMessage('❌ このブラウザはプッシュ通知をサポートしていません。');
        setIsLoading(false);
        return;
      }

      addDebugInfo(`Current permission: ${Notification.permission}`);

      if ((window as any).OneSignal && oneSignalReady) {
        addDebugInfo('Using OneSignal for subscription');
        
        (window as any).OneSignal.push(function() {
          addDebugInfo('Inside OneSignal.push');
          
          // プッシュ通知を要求
          (window as any).OneSignal.showNativePrompt().then(function() {
            addDebugInfo('showNativePrompt resolved');
            
            // 購読状態を再確認
            setTimeout(() => {
              (window as any).OneSignal.isPushNotificationsEnabled(function(isEnabled: boolean) {
                addDebugInfo(`Post-prompt subscription status: ${isEnabled}`);
                setIsSubscribed(isEnabled);
                
                if (isEnabled) {
                  setMessage('✅ プッシュ通知が有効になりました！OneSignalに登録されました。');
                  
                  // ユーザーIDを表示
                  (window as any).OneSignal.getUserId(function(userId: string) {
                    addDebugInfo(`OneSignal User ID: ${userId}`);
                  });
                } else {
                  setMessage('⚠️ プッシュ通知の許可が必要です。');
                }
              });
            }, 2000);
          }).catch(function(error: any) {
            addDebugInfo(`showNativePrompt error: ${error}`);
            setMessage('❌ プッシュ通知の設定に失敗しました。');
          });
        });
      } else {
        addDebugInfo('OneSignal not available, using browser API');
        
        // フォールバック: ブラウザ標準API
        const permission = await Notification.requestPermission();
        addDebugInfo(`Browser permission result: ${permission}`);
        
        if (permission === 'granted') {
          setMessage('✅ ブラウザの通知は許可されましたが、OneSignalとの連携を確認してください。');
        } else {
          setMessage('❌ プッシュ通知が拒否されました。');
        }
      }
    } catch (error) {
      addDebugInfo(`Subscribe error: ${error}`);
      setMessage('❌ プッシュ通知の設定に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

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

