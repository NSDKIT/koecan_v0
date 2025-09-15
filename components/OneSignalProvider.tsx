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
        // OneSignalの最小限の初期化
        await OneSignal.init({
          appId: '66b12ad6-dbe7-498f-9eb6-f9d8031fa8a1',
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

