import OneSignal from 'react-onesignal';

export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';

let isOneSignalInitialized = false;

export const initializeOneSignal = async () => {
  // Skip initialization if already initialized or no valid App ID
  if (isOneSignalInitialized || !ONESIGNAL_APP_ID || ONESIGNAL_APP_ID === 'your-onesignal-app-id' || ONESIGNAL_APP_ID.includes('｛') || ONESIGNAL_APP_ID.includes('｝')) {
    console.log('OneSignal initialization skipped - already initialized or no valid App ID');
    return;
  }

  try {
    console.log('Initializing OneSignal...');
    
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: true,
        prenotify: true,
        showCredit: false,
        position: 'bottom-right',
        size: 'medium',
        text: {
          'tip.state.unsubscribed': '通知を受け取る',
          'tip.state.subscribed': '通知設定',
          'tip.state.blocked': '通知がブロックされています',
          'message.prenotify': '通知を許可しますか？',
          'message.action.subscribed': '通知を受け取っています',
          'message.action.resubscribed': '通知を再開しました',
          'message.action.unsubscribed': '通知を停止しました',
          'dialog.main.title': '通知設定',
          'dialog.main.button.subscribe': '許可',
          'dialog.main.button.unsubscribe': '拒否',
          'dialog.blocked.title': '通知をブロック解除',
          'dialog.blocked.message': 'ブラウザの設定で通知を許可してください'
        }
      }
    });

    isOneSignalInitialized = true;
    console.log('OneSignal initialized successfully');
  } catch (error) {
    console.error('OneSignal initialization failed:', error);
  }
};