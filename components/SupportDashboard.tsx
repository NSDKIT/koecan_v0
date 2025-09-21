'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/config/supabase'; // 必要であれば残す
import { 
  MessageCircle, 
  LogOut, 
  User as UserIcon,
  Headphones, // ヘッダーアイコン用
  MessageSquareText // チャットアイコン用
} from 'lucide-react';
import { SparklesCore } from '@/components/ui/sparkles';
import { ChatModal } from '@/components/ChatModal'; // ChatModalをインポート

export default function SupportDashboard() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true); // 初回読み込み用
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    // ユーザー情報があればローディングを解除
    if (user) {
      setLoading(false);
    }
    // ここでチャット管理に必要な初期データフェッチ（もしあれば）
    // 例: アクティブなチャットルームリストの取得など
  }, [user]);

  // サポートダッシュボードからチャットを開くハンドラ
  const handleOpenChat = () => {
    setShowChatModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Sparkles Background */}
      <div className="w-full absolute inset-0 h-screen">
        <SparklesCore
          id="tsparticlessupport"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={60}
          className="w-full h-full"
          particleColor="#10B981"
          speed={0.5}
        />
      </div>

      {/* Subtle Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-white to-green-50/30"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/80"></div>

      <div className="relative z-20">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-green-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500">
                  声キャン！
                </h1>
                <span className="ml-3 px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full text-sm font-medium">
                  サポート
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {}}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <UserIcon className="w-5 h-5" />
                  <span>{user?.name}</span>
                </button>
                <button
                  onClick={signOut}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  サポートダッシュボード
                </h2>
                <p className="text-gray-600 mb-4">
                  ユーザーからの問い合わせにチャットで対応します
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 shadow-lg">
                  <Headphones className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-green-100 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">サポートチャット</h3>
            <p className="text-gray-600 mb-8">
              ユーザーからの問い合わせを確認し、直接チャットで対応を開始できます。
            </p>
            <button
              onClick={handleOpenChat}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center mx-auto"
            >
              <MessageSquareText className="w-6 h-6 mr-3" />
              チャットを開始
            </button>
          </div>
        </main>
      </div>

      {/* Chat Modal for Support */}
      {showChatModal && user && (
        <ChatModal
          user={user} // サポート担当者自身のuserオブジェクトを渡す
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
}
