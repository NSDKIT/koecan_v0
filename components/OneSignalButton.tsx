'use client'

import React, { useState, useEffect } from 'react';

// OneSignalの型定義を追加
declare global {
  interface Window {
    OneSignal?: any;
  }
}

export const OneSignalButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    // OneSignalの購読状態を確認
    const checkSubscriptionStatus = async () => {
      try {
        if (window.OneSignal) {
          setOneSignalReady(true);
          const subscribed = await window.OneSignal.User.PushSubscription.optedIn;
          setIsSubscribed(subscribed);
          console.log('Subscription status checked:', subscribed);
        }
      } catch (error) {
        console.error('Failed to check subscription status:', error);
      }
    };

    // OneSignalが初期化されるまで待機
    const interval = setInterval(() => {
      if (window.OneSignal) {
        checkSubscriptionStatus();
        clearInterval(interval);
      }
    }, 1000);

    // 10秒後にタイムアウト
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.OneSignal) {
        console.warn('OneSignal not loaded after 10 seconds');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      if (window.OneSignal) {
        console.log('Using OneSignal for subscription...');
        
        // OneSignalを使用してプッシュ通知を要求
        const permission = await window.OneSignal.Notifications.requestPermission();
        console.log('Permission result:', permission);
        
        if (permission) {
          // 購読を確実に行う
          await window.OneSignal.User.PushSubscription.optIn();
          console.log('OptIn completed');
          
          // 少し待ってから購読状態を再確認
          setTimeout(async () => {
            try {
              const isNowSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
              setIsSubscribed(isNowSubscribed);
              
              if (isNowSubscribed) {
                setMessage('✅ プッシュ通知が有効になりました！OneSignalに登録されました。');
                
                // ユーザーIDを表示（デバッグ用）
                const userId = window.OneSignal.User.onesignalId;
                console.log('OneSignal User ID:', userId);
              } else {
                setMessage('⚠️ 購読に失敗しました。再度お試しください。');
              }
            } catch (error) {
              console.error('Error checking subscription after opt-in:', error);
              setMessage('⚠️ 購読状態の確認に失敗しました。');
            }
          }, 2000);
        } else {
          setMessage('❌ プッシュ通知が拒否されました。ブラウザの設定から許可してください。');
        }
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

  const handleUnsubscribe = async () => {
    try {
      if (window.OneSignal) {
        await window.OneSignal.User.PushSubscription.optOut();
        setIsSubscribed(false);
        setMessage('🔕 プッシュ通知を無効にしました。');
      }
    } catch (error) {
      console.error('Unsubscribe failed:', error);
    }
  };

  const handleDebugInfo = () => {
    if (window.OneSignal) {
      console.log('=== OneSignal Debug Info ===');
      console.log('OneSignal loaded:', !!window.OneSignal);
      console.log('User ID:', window.OneSignal.User?.onesignalId);
      window.OneSignal.User.PushSubscription.optedIn.then((subscribed: boolean) => {
        console.log('Subscribed:', subscribed);
      });
    } else {
      console.log('OneSignal not loaded');
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
      
      <div className='onesignal-customlink-container'></div>
    </div>
  );
};

