'use client'

import { useEffect } from 'react';

interface OneSignalProviderProps {
  children: React.ReactNode;
}

export const OneSignalProvider: React.FC<OneSignalProviderProps> = ({ children }) => {
  useEffect(() => {
    // このコンポーネントがマウントされた時に一度だけ実行
    if (typeof window !== 'undefined' && !(window as any).OneSignal) {
      // OneSignalのグローバルオブジェクトを初期化
      (window as any).OneSignal = (window as any).OneSignal || [];
      const OneSignal = (window as any).OneSignal;
      
      // OneSignalの初期化コマンドをキューに入れる
      OneSignal.push(function() {
        OneSignal.init({
          appId: "66b12ad6-dbe7-498f-9eb6-f9d8031fa8a1", // あなたのApp ID
          allowLocalhostAsSecureOrigin: true,
        });
      });
      console.log('OneSignal init command pushed.');
    }
  }, []); // 空の依存配列で、初回レンダリング時のみ実行

  return <>{children}</>;
};
