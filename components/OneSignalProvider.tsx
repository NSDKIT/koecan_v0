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
          notifyButton: {
            enable: true,
            size: 'medium',
            theme: 'default',
            position: 'bottom-right',
            text: {
              'message.prenotify': 'プッシュ通知を受け取りますか？',
              'message.action.subscribed': 'プッシュ通知を有効にしました！',
              'message.action.resubscribed': 'プッシュ通知を再度有効にしました！',
              'message.action.unsubscribed': 'プッシュ通知を無効にしました。',
              'dialog.main.title': 'プッシュ通知の設定',
              'dialog.main.button.subscribe': '有効にする',
              'dialog.main.button.unsubscribe': '無効にする',
              'dialog.blocked.title': 'プッシュ通知がブロックされています',
              'dialog.blocked.message': 'ブラウザの設定からプッシュ通知を許可してください。'
            }
          },
          allowLocalhostAsSecureOrigin: true,
        });
        
        console.log('OneSignal initialized successfully');
      } catch (error) {
        console.error('OneSignal initialization failed:', error);
      }
    };

    // OneSignalの初期化を実行
    initOneSignal();
  }, []);

  return <>{children}</>;
};

