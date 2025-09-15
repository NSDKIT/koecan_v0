'use client'

import React, { useState } from 'react';

export const OneSignalButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubscribe = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      // ブラウザの通知許可を直接要求
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          setMessage('✓ プッシュ通知が有効になりました！');
        } else if (permission === 'denied') {
          setMessage('❌ プッシュ通知が拒否されました。ブラウザの設定から許可してください。');
        } else {
          setMessage('⚠️ プッシュ通知の設定が保留中です。');
        }
      } else {
        setMessage('❌ このブラウザはプッシュ通知をサポートしていません。');
      }
    } catch (error) {
      console.error('Notification permission request failed:', error);
      setMessage('❌ プッシュ通知の設定に失敗しました。');
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
      
      <button
        onClick={handleSubscribe}
        disabled={isLoading}
        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
      >
        {isLoading ? '設定中...' : 'プッシュ通知を許可する'}
      </button>
      
      {message && (
        <div className="text-sm text-center max-w-xs">
          {message}
        </div>
      )}
      
      <div className='onesignal-customlink-container'></div>
    </div>
  );
};

