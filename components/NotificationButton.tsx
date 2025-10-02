'use client'

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';

export function NotificationButton() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOneSignalReady, setIsOneSignalReady] = useState(false);

  useEffect(() => {
    // OneSignalのグローバルオブジェクトが利用可能になるのを待つ
    const checkOneSignal = () => {
      if ((window as any).OneSignal) {
        setIsOneSignalReady(true);
        
        // OneSignal初期化完了を待つ
        (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
        (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
          try {
            // 現在のパーミッション状態を確認
            const permission = OneSignal.Notifications.permission;
            setIsSubscribed(permission);
            setLoading(false);

            // パーミッション変更のイベントリスナーを設定
            OneSignal.Notifications.addEventListener('permissionChange', function(isGranted: boolean) {
              setIsSubscribed(isGranted);
            });

          } catch (error) {
            console.error("Error checking OneSignal permission:", error);
            setLoading(false);
          }
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
        // 購読解除の案内
        alert('通知を無効にするには、ブラウザのサイト設定から通知をブロックしてください。\n\niOS端末の場合：\n1. ホーム画面のアプリアイコンを長押し\n2. 「設定」をタップ\n3. 「通知」をオフにする');
      } else {
        // パーミッションをリクエスト
        await (window as any).OneSignal.Notifications.requestPermission();
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
    } finally {
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
