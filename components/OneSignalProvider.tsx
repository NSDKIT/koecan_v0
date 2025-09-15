'use client'

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

interface OneSignalProviderProps {
  children: React.ReactNode;
}

export const OneSignalProvider: React.FC<OneSignalProviderProps> = ({ children }) => {
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        // OneSignalの初期化
        await OneSignal.init({
          appId: '66b12ad6-dbe7-498f-9eb6-f9d8031fa8a1',
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false, // カスタムボタンを使用するため無効化
          },
        });
        
        console.log('OneSignal initialized successfully');
        
        // 購読状態を確認
        try {
          const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
          console.log('User subscription status:', isSubscribed);
          
          // ユーザーIDを確認
          const userId = OneSignal.User.onesignalId;
          console.log('OneSignal User ID:', userId);
        } catch (statusError) {
          console.log('Could not check subscription status yet:', statusError);
        }
        
      } catch (error) {
        console.error('OneSignal initialization failed:', error);
      }
    };

    // OneSignalの初期化を実行
    initOneSignal();
  }, []);

  return <>{children}</>;
};

