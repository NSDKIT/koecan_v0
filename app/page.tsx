'use client'

import React from 'react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/config/supabase';
import { AuthForm } from '@/components/AuthForm';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import MonitorDashboard from '@/components/MonitorDashboard';
import { ClientDashboard } from '@/components/ClientDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import SupportDashboard from '@/components/SupportDashboard';
import { Database, AlertCircle } from 'lucide-react';

export default function Home() {
  const { user, loading, error } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);

  // Supabaseが設定されていない場合の表示
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
            <Database className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500 mb-4">
            Supabaseの設定が必要です
          </h1>
          <p className="text-gray-600 mb-6">
            アプリケーションを使用するには、Supabaseプロジェクトを設定してください。
            <br /><br />
            環境変数が正しく設定されていない可能性があります。
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-orange-900 mb-2">設定手順:</h3>
            <ol className="text-sm text-orange-800 space-y-1">
              <li>1. .env.localファイルを確認してください</li>
              <li>2. NEXT_PUBLIC_SUPABASE_URLが正しく設定されているか確認</li>
              <li>3. NEXT_PUBLIC_SUPABASE_ANON_KEYが正しく設定されているか確認</li>
              <li>4. 開発サーバーを再起動してください</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // エラーがある場合の表示
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500 mb-4">
            接続エラー
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showWelcome) {
      return <WelcomeScreen onGetStarted={() => setShowWelcome(false)} />;
    }
    return <AuthForm onBack={() => setShowWelcome(true)} />;
  }

  // Route based on user role
  switch (user.role) {
    case 'monitor':
      return <MonitorDashboard />;
    case 'client':
      return <ClientDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'support':
      return <SupportDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">不明なユーザー役割です。再度ログインしてください。</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
            >
              再読み込み
            </button>
          </div>
        </div>
      );
  }
}