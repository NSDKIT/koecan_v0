'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/config/supabase';
import { User } from '@/types'; // User型をインポート
import { 
  MessageCircle, 
  LogOut, 
  User as UserIcon,
  Headphones, // ヘッダーアイコン用
  MessageSquareText, // チャットアイコン用
  Loader2, // ローディングアイコン
  CheckCircle, // ユーザーが見つからない場合のアイコン
  PhoneCall, // キャリア相談リクエストのアイコン（仮）
  Mail // キャリア相談リクエストのアイコン（仮）
} from 'lucide-react';
import { SparklesCore } from '@/components/ui/sparkles';
import { ChatModal } from '@/components/ChatModal'; // ChatModalをインポート
import { CareerConsultationModal } from '@/components/CareerConsultationModal'; // キャリア相談モーダルをインポート

export default function SupportDashboard() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true); // 初回読み込み用
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedMonitorForChat, setSelectedMonitorForChat] = useState<User | null>(null); // チャット相手のモニターユーザー
  const [monitorUsers, setMonitorUsers] = useState<User[]>([]); // モニターユーザーのリスト
  const [error, setError] = useState<string | null>(null);
  const [showCareerConsultationManagement, setShowCareerConsultationManagement] = useState(false); // キャリア相談管理UIの表示

  useEffect(() => {
    if (user) {
      fetchMonitorUsers();
      // キャリア相談リクエストなどをフェッチする関数をここに追加することも検討
    }
  }, [user]);

  const fetchMonitorUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // public.users テーブルから role が 'monitor' のユーザーを全て取得
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'monitor')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMonitorUsers(data || []);
    } catch (err) {
      console.error('モニターユーザー取得エラー:', err);
      setError('モニターユーザーのリスト取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 特定のモニターユーザーとのチャットを開くハンドラ
  const handleOpenChatWithMonitor = (monitor: User) => {
    if (!user || !user.id) {
        setError('あなたのユーザー情報がありません。ログインし直してください。');
        return;
    }
    setSelectedMonitorForChat(monitor);
    setShowChatModal(true);
  };

  // 一般的なチャットを開くハンドラ（SupportDashboardで自分のチャット履歴を確認したい場合など）
  // この場合は、otherUserIdとして自分自身以外の固定のサポートIDなどを設定することもできますが、
  // 現状では個別のモニターとのチャットに焦点を当てます。
  const handleOpenGeneralSupportChat = () => {
    // もしサポート担当者間でチャットしたい場合など、特定の相手がいないチャットを開くロジックをここに
    setError('現在、モニターを指定しないチャット機能は提供されていません。');
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

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">エラー！</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {/* Support Chat Management */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-green-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">モニターユーザー一覧</h3>
              <div className="flex items-center space-x-4">
                {/* キャリア相談管理ボタン (仮) */}
                <button
                    onClick={() => setShowCareerConsultationManagement(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <PhoneCall className="w-5 h-5 mr-2" /> キャリア相談管理 (仮)
                </button>
              </div>
            </div>

            {monitorUsers.length === 0 && !error ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">モニターユーザーはいません</h3>
                <p className="text-gray-600">現在、チャット可能なモニターユーザーがいません。</p>
              </div>
            ) : (
              <div className="space-y-4">
                {monitorUsers.map((monitor) => (
                  <div
                    key={monitor.id}
                    className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center">
                      <UserIcon className="w-6 h-6 text-gray-500 mr-3" />
                      <div>
                        <p className="font-semibold text-gray-800">{monitor.name || monitor.email}</p>
                        <p className="text-sm text-gray-500">{monitor.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenChatWithMonitor(monitor)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                      <MessageSquareText className="w-4 h-4 mr-2" /> チャットを開始
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Chat Modal for Support */}
      {showChatModal && user && selectedMonitorForChat && (
        <ChatModal
          user={user} // サポート担当者自身のユーザーオブジェクト
          otherUserId={selectedMonitorForChat.id} // チャット相手のモニターユーザーID
          onClose={() => {
            setShowChatModal(false);
            setSelectedMonitorForChat(null);
          }}
        />
      )}

      {/* キャリア相談管理モーダル (仮) */}
      {showCareerConsultationManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">キャリア相談管理 (仮)</h2>
              <button
                onClick={() => setShowCareerConsultationManagement(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-700">
              ここにキャリア相談のリクエスト一覧や、各相談の詳細を表示・管理するUIを実装します。
            </p>
            {/* 実際には、ここにSupabaseからキャリア相談リクエストデータをフェッチして表示する */}
          </div>
        </div>
      )}
    </div>
  );
}
