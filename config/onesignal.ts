import OneSignal from 'react-onesignal';

export const ONESIGNAL_APP_ID = '66b12ad6-dbe7-498f-9eb6-f9d8031fa8a1';

let isOneSignalInitialized = false;

export const initializeOneSignal = async () => {
  // Skip initialization if already initialized
  if (isOneSignalInitialized) {
    console.log('OneSignal initialization skipped - already initialized');
    return;
  }

  try {
    console.log('Initializing OneSignal...');
    
    // 最小限の設定でOneSignalを初期化
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
    });

    isOneSignalInitialized = true;
    console.log('OneSignal initialized successfully');
  } catch (error) {
    console.error('OneSignal initialization failed:', error);
  }
};

