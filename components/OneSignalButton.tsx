'use client'

import React, { useState, useEffect } from 'react';

// OneSignalの型定義
declare global {
  interface Window {
    OneSignal?: any[];
  }
}

export const OneSignalButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    // OneSignalの準備状態を確認
    const checkOneSignalReady = () => {
      if (window.OneSignal && typeof window.OneSignal.push === 'function') {
        setOneSignalReady(true);
        
        // 購読状態を確認
        window.OneSignal.push(function() {
          window.OneSignal.isPushNotificationsEnabled(function(isEnabled: boolean) {
            setIsSubscribed(isEnabled);
            console.log('Subscription status checked:', isEnabled);
          });
        });
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
        console.warn('OneSignal not ready after 10 seconds');
        setMessage('⚠️ OneSignalの読み込みに時間がかかっています。');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [oneSignalReady]);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      if (window.OneSignal && oneSignalReady) {
        console.log('Using OneSignal for subscription...');
        
        window.OneSignal.push(function() {
          // プッシュ通知を要求
          window.OneSignal.showNativePrompt().then(function() {
            console.log('Native prompt shown');
            
            // 購読状態を再確認
            setTimeout(() => {
              window.OneSignal.isPushNotificationsEnabled(function(isEnabled: boolean) {
                setIsSubscribed(isEnabled);
                
                if (isEnabled) {
                  setMessage('✅ プッシュ通知が有効になりました！OneSignalに登録されました。');
                  
                  // ユーザーIDを表示
                  window.OneSignal.getUserId(function(userId: string) {
                    console.log('OneSignal User ID:', userId);
                  });
                } else {
                  setMessage('⚠️ プッシュ通知の許可が必要です。');
                }
              });
            }, 2000);
          }).catch(function(error: any) {
            console.error('Native prompt error:', error);
            setMessage('❌ プッシュ通知の設定に失敗しました。');
          });
        });
      } else {
        console.log('OneSignal not available, using browser API...');
        // フォールバック: ブラウザ標準API
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setMessage('✅ ブラウザの通知は許可されましたが、OneSignalとの連携を確認してください。');
        } else {
          setMessage('❌ プッシュ通知が拒否されました。');
        }
      }
    } catch (error) {
      console.error('Notification permission request failed:', error);
      setMessage('❌ プッシュ通知の設定に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = () => {
    if (window.OneSignal && oneSignalReady) {
      window.OneSignal.push(function() {
        window.OneSignal.setSubscription(false).then(function() {
          setIsSubscribed(false);
          setMessage('🔕 プッシュ通知を無効にしました。');
        });
      });
    }
  };

  const handleDebugInfo = () => {
    if (window.OneSignal && oneSignalReady) {
      console.log('=== OneSignal Debug Info ===');
      console.log('OneSignal loaded:', !!window.OneSignal);
      
      window.OneSignal.push(function() {
        window.OneSignal.getUserId(function(userId: string) {
          console.log('User ID:', userId);
        });
        
        window.OneSignal.isPushNotificationsEnabled(function(isEnabled: boolean) {
          console.log('Subscribed:', isEnabled);
        });
      });
    } else {
      console.log('OneSignal not ready');
    }
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
      
      {/* デバッグボタン（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={handleDebugInfo}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
        >
          Debug Info
        </button>
      )}
      
      <div className="text-xs text-gray-500 text-center max-w-xs">
        <p>📱 <strong>携帯端末をご利用の場合：</strong></p>
        <p>• <strong>Android:</strong> Chrome、Firefox、Edgeをご使用ください</p>
        <p>• <strong>iPhone:</strong> Safariでホーム画面に追加後、PWAとして起動してください</p>
      </div>
    </div>
  );
};

