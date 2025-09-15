'use client'

import React, { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';

export const OneSignalButton: React.FC = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // OneSignalの購読状態をチェック
    const checkSubscription = async () => {
      try {
        if (window.OneSignal) {
          const isSubscribed = await OneSignal.Notifications.permission;
          setIsSubscribed(isSubscribed === 'granted');
        }
      } catch (error) {
        console.error('OneSignal subscription check failed:', error);
      }
    };

    checkSubscription();
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await OneSignal.Notifications.requestPermission();
      const permission = await OneSignal.Notifications.permission;
      setIsSubscribed(permission === 'granted');
    } catch (error) {
      console.error('OneSignal subscription failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800">プッシュ通知を有効にする</h3>
      <p className="text-sm text-gray-600 text-center">
        重要なお知らせやアンケートの通知を受け取るために、プッシュ通知を有効にしてください。
      </p>
      
      {isSubscribed ? (
        <div className="text-green-600 font-semibold">
          ✓ プッシュ通知が有効になっています
        </div>
      ) : (
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {isLoading ? '設定中...' : 'プッシュ通知を許可する'}
        </button>
      )}
      
      <div className='onesignal-customlink-container'></div>
    </div>
  );
};

