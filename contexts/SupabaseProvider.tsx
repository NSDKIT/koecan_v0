'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as supabaseClient } from '@/config/supabase'; // オリジナルのクライアントをインポート

// Contextを作成
const SupabaseContext = createContext<SupabaseClient | null>(null);

// アプリケーション全体でSupabaseクライアントを共有するためのProviderコンポーネント
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseContext.Provider value={supabaseClient}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Supabaseクライアントにアクセスするためのカスタムフック
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
