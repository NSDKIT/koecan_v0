'use client'

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, BellOff } from 'lucide-react';

export function NotificationButton() {
  const { user } = useAuth();
  const { isSubscribed, requestPermission, loading } = useNotifications(user);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggleNotifications = async () => {
    if (!isSubscribed) {
      const granted = await requestPermission();
      if (granted) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 3000);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleNotifications}
        disabled={loading}
        className={`p-2 rounded-lg transition-all duration-300 ${
          isSubscribed
            ? 'text-green-600 bg-green-50 hover:bg-green-100'
            : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        title={isSubscribed ? '通知が有効です' : '通知を有効にする'}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
        ) : isSubscribed ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg shadow-lg z-50">
          通知が有効になりました！
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-600 rotate-45"></div>
        </div>
      )}
    </div>
  );
}