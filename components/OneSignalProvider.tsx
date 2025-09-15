'use client'

import { useEffect } from 'react';

interface OneSignalProviderProps {
  children: React.ReactNode;
}

export const OneSignalProvider: React.FC<OneSignalProviderProps> = ({ children }) => {
  useEffect(() => {
    const initOneSignal = () => {
      // OneSignal Web SDKを直接読み込み
      if (typeof window !== 'undefined' && !window.OneSignal) {
        window.OneSignal = window.OneSignal || [];
        
        // OneSignal初期化関数をキューに追加
        window.OneSignal.push(function() {
          window.OneSignal.init({
            appId: "66b12ad6-dbe7-498f-9eb6-f9d8031fa8a1",
            allowLocalhostAsSecureOrigin: true,
            notificationClickHandlerMatch: 'origin',
            notificationClickHandlerAction: 'focus',
          });
          
          console.log('OneSignal initialized successfully (direct method)');
          
          // 初期化完了後の処理
          window.OneSignal.push(function() {
            // 購読状態を確認
            window.OneSignal.isPushNotificationsEnabled(function(isEnabled) {
              console.log('Push notifications enabled:', isEnabled);
            });
            
            // ユーザーIDを取得
            window.OneSignal.getUserId(function(userId) {
              console.log('OneSignal User ID:', userId);
            });
          });
        });

        // OneSignal SDKスクリプトを動的に読み込み
        const script = document.createElement('script');
        script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
        script.async = true;
        script.onload = () => {
          console.log('OneSignal SDK loaded successfully');
        };
        script.onerror = () => {
          console.error('Failed to load OneSignal SDK');
        };
        document.head.appendChild(script);
      }
    };

    // 初期化を実行
    initOneSignal();
  }, []);

  return <>{children}</>;
};

