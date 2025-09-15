'use client'

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { initializeOneSignal } from '@/config/onesignal';

export function useNotifications(user: User | null) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      initializeNotifications();
    }
  }, [user]);

  const initializeNotifications = async () => {
    try {
      setLoading(true);
      await initializeOneSignal();
      setIsInitialized(true);
      
      // Check subscription status
      const permission = await Notification.permission;
      setIsSubscribed(permission === 'granted');
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    try {
      setLoading(true);
      const permission = await Notification.requestPermission();
      setIsSubscribed(permission === 'granted');
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isInitialized,
    isSubscribed,
    loading,
    requestPermission,
  };
}