'use client'

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';

export function NotificationButton() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true); // 初期状態の確認中はローディング
  const [isOneSignalReady, setIsOneSignalReady] = useState(false);

  useEffect(() => {
    // OneSignalのグローバルオブジェクトが利用可能になるのを待つ
    const checkOneSignal = () => {
      if ((window as any).OneSignal) {
        setIsOneSignalReady(true);
        (window as any).OneSignal.push(async function() {
          // OneSignalの初期化が完了するのを待つ
          await (window as any).OneSignal.showSlidedownPrompt();
          
          // 現在の購読状態を確認
          const subscribed = await (window as any).OneSignal.isPushNotificationsEnabled();
          setIsSubscribed(subscribed);
          setLoading(false);

          // 購読状態が変化したときのイベントリスナーを設定
          (window as any).OneSignal.on('subscriptionChange', function(isSubscribed: boolean) {
            setIsSubscribed(isSubscribed);
          });
        });
      }
    };
    
    // 100msごとにチェックし、5秒経っても利用できなければタイムアウト
    const interval = setInterval(() => {
      if ((window as any).OneSignal) {
        clearInterval(interval);
        checkOneSignal();
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!(window as any).OneSignal) {
        console.error("OneSignal SDK failed to load.");
        setLoading(false);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };

  }, []);

  const handleToggleNotifications = async () => {
    if (!isOneSignalReady) return;
    setLoading(true);

    try {
      if (isSubscribed) {
        // 購読解除（ブラウザの設定から手動で行うよう促すのが一般的）
        // ここでは何もしないか、解除方法を案内するUIを表示する
        alert('通知を無効にするには、ブラウザのサイト設定から通知をブロックしてください。');
      } else {
        // 購読を要求
        await (window as any).OneSignal.registerForPushNotifications();
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
    } finally {
      // on('subscriptionChange')イベントが状態を更新するので、ここではローディングを解除するだけ
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleNotifications}
        disabled={loading || !isOneSignalReady}
        className={`p-2 rounded-lg transition-all duration-300 ${
          isSubscribed
            ? 'text-green-600 bg-green-50 hover:bg-green-100'
            : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
        } ${loading || !isOneSignalReady ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        title={isSubscribed ? '通知が有効です' : '通知を有効にする'}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
