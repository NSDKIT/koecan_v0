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
import { useRouter } from 'next/navigation';


// URLハッシュを操作するヘルパー
const navigateToAuth = () => {
    window.location.hash = 'auth';
};
const navigateToWelcome = () => {
    window.location.hash = '';
};


export default function Home() {
  const { user, loading, error, signOut } = useAuth();
  const router = useRouter(); 
  const [isAuthScreen, setIsAuthScreen] = useState(false); // サーバーでの window アクセスを回避
  const [isClient, setIsClient] = useState(false); // クライアント側でレンダリングされているかを追跡
  // ★★★ 修正箇所: selectedAdminPanel ステートを再宣言 ★★★
  const [selectedAdminPanel, setSelectedAdminPanel] = useState<'admin' | 'support' | null>(null);


  // ★★★ 修正箇所: URLハッシュの変更をリッスンして画面を切り替えるロジック ★★★
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

  // エラーがある場合の表示 (useAuth側でエラーが設定された場合)
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
            onClick={() => {
              signOut(); 
              router.replace(window.location.pathname); 
            }}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            再試行（セッションリセット）
          </button>
        </div>
      </div>
    );
  }

  // 認証状態の初回チェック中はローディング画面を表示
  if (loading || !isClient) { 
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
    // URLハッシュに基づくルーティング
    if (isAuthScreen) {
      return <AuthForm onBack={navigateToWelcome} />;
    }
    return <WelcomeScreen onGetStarted={navigateToAuth} />;
  }

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
