// koecan_v0-main/app/page.tsx

'use client'

import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/config/supabase';
import { AuthForm } from '@/components/AuthForm';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import MonitorDashboard from '@/components/MonitorDashboard';
import { ClientDashboard } from '@/components/ClientDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import SupportDashboard from '@/components/SupportDashboard';
// 新しい閲覧用コンポーネントをインポート
import { AdminSupportChatViewer } from '@/components/AdminSupportChatViewer'; 
import { Database, AlertCircle, Settings, MessageCircle, ArrowLeft } from 'lucide-react';

// URLハッシュを操作するヘルパー
const navigateToAuth = () => {
    window.location.hash = 'auth';
};
const navigateToWelcome = () => {
    window.location.hash = '';
};


export default function Home() {
  const { user, loading, error, signOut } = useAuth();
  // ★★★ 修正箇所: 初期値を false に設定し、サーバーでの window アクセスを回避 ★★★
  const [isAuthScreen, setIsAuthScreen] = useState(false); 
  const [isClient, setIsClient] = useState(false); // クライアント側でレンダリングされているかを追跡
  // ... (中略) ...

  // ★★★ 修正箇所: window.location.hash を useEffect で読み込むロジック ★★★
  useEffect(() => {
    // クライアント側での初回レンダリング後に実行
    setIsClient(true);
    setIsAuthScreen(window.location.hash === '#auth');

    const handleHashChange = () => {
      setIsAuthScreen(window.location.hash === '#auth');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  // ★★★ 修正箇所ここまで ★★★

  // Supabaseが設定されていない場合の表示
  if (!isSupabaseConfigured) {
    // ... (中略) ...
  }

  // エラーがある場合の表示 (useAuth側でエラーが設定された場合)
  if (error) {
    // ... (中略) ...
  }

  // 認証状態の初回チェック中はローディング画面を表示
  if (loading || !isClient) { // ★★★ 修正: isClient が true になるまで待機 ★★★
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    );
  }

  // 認証チェックが完了し、ユーザーがいない場合の処理
  if (!user) {
    // ★★★ 修正箇所: URLハッシュに基づくルーティング ★★★
    if (isAuthScreen) {
      return <AuthForm onBack={navigateToWelcome} />;
    }
    return <WelcomeScreen onGetStarted={navigateToAuth} />;
  }

  // ... (後略: ユーザーがいる場合の処理は変更なし) ...
  // ...
  // 認証チェックが完了し、ユーザーがいる場合の処理
  // AdminまたはSupportロールの場合のルーティング
  if (user.role === 'admin' || user.role === 'support') {
    // admin@example.comがAdminDashboardとSupportDashboardのどちらかを選択
    if (user.role === 'admin' && selectedAdminPanel === null) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-purple-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">どちらの管理パネルを利用しますか？</h2>
            <div className="space-y-4">
              <button
                onClick={() => setSelectedAdminPanel('admin')}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <Settings className="w-5 h-5 mr-2" />
                システム管理者パネル
              </button>
              <button
                onClick={() => setSelectedAdminPanel('support')}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                サポートパネル
              </button>
            </div>
          </div>
        </div>
      );
    }

    // パネルが選択された、またはsupportロールでログインした場合
    if (user.role === 'admin' && selectedAdminPanel === 'admin') {
      return <AdminDashboard />;
    } else if (user.role === 'admin' && selectedAdminPanel === 'support') {
      return <AdminSupportChatViewer onBack={() => setSelectedAdminPanel(null)} />;
    } else if (user.role === 'support') {
      return <SupportDashboard />;
    }
  }


  // その他のユーザー役割のルーティング (monitor, client)
  switch (user.role) {
    case 'monitor':
      return <MonitorDashboard />;
    case 'client':
      return <ClientDashboard />;
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
