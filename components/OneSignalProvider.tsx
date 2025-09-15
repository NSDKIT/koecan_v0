'use client'

import React, { useEffect } from 'react';
import OneSignal from 'react-onesignal';

interface OneSignalProviderProps {
  children: React.ReactNode;
}

export const OneSignalProvider: React.FC<OneSignalProviderProps> = ({ children }) => {
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        // OneSignalが既に初期化されている場合はスキップ
        if (window.OneSignal && window.OneSignal.initialized) {
          console.log('OneSignal already initialized');
          return;
        }

        console.log('Initializing OneSignal...');
        await OneSignal.init({
          appId: '66b12ad6-dbe7-498f-9eb6-f9d8031fa8a1',
          safari_web_id: 'web.onesignal.auto.18b6e6e5-7e5f-4b8b-8e8e-8e8e8e8e8e8e',
          notifyButton: {
            enable: true,
            size: 'medium',
            theme: 'default',
            position: 'bottom-right',
            showCredit: true,
            text: {
              'tip.state.unsubscribed': 'プッシュ通知を購読する',
              'tip.state.subscribed': "プッシュ通知を購読中です",
              'tip.state.blocked': "プッシュ通知がブロックされています",
              'message.prenotify': 'プッシュ通知を許可しますか？',
              'message.action.subscribed': "ありがとうございます！",
              'message.action.resubscribed': "プッシュ通知を再開しました",
              'message.action.unsubscribed': "プッシュ通知を停止しました",
              'dialog.main.title': 'サイトからの通知を管理',
              'dialog.main.button.subscribe': '購読する',
              'dialog.main.button.unsubscribe': '購読を停止',
              'dialog.blocked.title': 'プッシュ通知のブロックを解除',
              'dialog.blocked.message': "プッシュ通知を受け取るには、ブラウザの設定でこのサイトの通知を許可してください。"
            }
          },
          allowLocalhostAsSecureOrigin: true,
        });
        
        console.log('OneSignal initialized successfully');
        
        // 初期化後に購読状態をチェック
        const isPushSupported = OneSignal.isPushNotificationsSupported();
        console.log('Push notifications supported:', isPushSupported);
        
        if (isPushSupported) {
          const permission = await OneSignal.getNotificationPermission();
          console.log('Current permission:', permission);
        }
        
      } catch (error) {
        console.error('OneSignal initialization failed:', error);
      }
    };

    // DOMが完全に読み込まれてから初期化
    if (document.readyState === 'complete') {
      initOneSignal();
    } else {
      window.addEventListener('load', initOneSignal);
      return () => window.removeEventListener('load', initOneSignal);
    }
  }, []);

  return <>{children}</>;
};

