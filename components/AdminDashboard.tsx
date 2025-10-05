'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/config/supabase';
import { 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  User as UserIcon,
  Shield,
  Database,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Briefcase,
  MessageCircle // アイコンを追加
} from 'lucide-react';
import { SparklesCore } from '@/components/ui/sparkles';
import { AdminJobInfoManager } from '@/components/AdminJobInfoManager';
import { ChatModal } from '@/components/ChatModal'; // ChatModalをインポート
import { PointExchangeManager } from '@/components/PointExchangeManager'; // ★★★ 追加: ポイント交換管理をインポート ★★★

type AdminDashboardTab = 'overview' | 'job_info_manager' | 'chat_monitoring' | 'point_exchange'; // ★★★ 'point_exchange' を追加 ★★★

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSurveys: 0,
    totalResponses: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>('overview');

  // チャット監視用ステート
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loadingChats, setLoadingChats] = useState(false);


  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  // activeTabが変更されたときにもデータをフェッチするように修正
  useEffect(() => {
    if (activeTab === 'chat_monitoring') {
      fetchChatRooms();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: surveyCount } = await supabase.from('surveys').select('*', { count: 'exact', head: true });
      const { count: responseCount } = await supabase.from('responses').select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: userCount || 0,
        totalSurveys: surveyCount || 0,
        totalResponses: responseCount || 0,
        activeUsers: userCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatRooms = async () => {
    setLoadingChats(true);
    try {
      // 参加者の名前も取得するクエリに修正
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('id, name, created_at, participants')
        .eq('room_type', 'support')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setChatRooms(data || []);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  const handleViewChat = (roomId: string) => {
    setSelectedRoomId(roomId);
    setIsChatModalOpen(true);
  };

  // 概要タブのレンダリング関数 (変更なし)
  const renderOverviewTab = () => (
    <>
      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* ... */}
      </div>
      {/* Management Sections */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* ... */}
      </div>
    </>
  );

  // チャット監視タブのレンダリング関数
  const renderChatMonitoringTab = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">サポートチャット一覧</h3>
        <button onClick={fetchChatRooms} className="text-sm text-blue-600 hover:underline">
          最新の情報に更新
        </button>
      </div>
      {loadingChats ? (
        <div className="text-center py-8">
          <p className="text-gray-600">チャットルームを読み込み中...</p>
        </div>
      ) : chatRooms.length === 0 ? (
        <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">アクティブなチャットはありません</h3>
            <p className="text-gray-600">現在、進行中のサポートチャットはありません。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chatRooms.map(room => (
            <div key={room.id} className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-semibold text-gray-900">{room.name || `チャットID: ${room.id.substring(0, 8)}`}</p>
                <p className="text-sm text-gray-500">
                  作成日時: {new Date(room.created_at).toLocaleString('ja-JP')}
                </p>
              </div>
              <button
                onClick={() => handleViewChat(room.id)}
                className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium"
              >
                チャットを閲覧
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
          id="tsparticlesadmin"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={60}
          className="w-full h-full"
          particleColor="#8B5CF6"
          speed={0.5}
        />
      </div>

      {/* Subtle Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-white to-purple-50/30"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/80"></div>

      <div className="relative z-20">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-500">
                  声キャン！
                </h1>
                <span className="ml-3 px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-full text-sm font-medium">
                  管理者
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {}}
                  className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  管理者ダッシュボード
                </h2>
                <p className="text-gray-600 mb-4">
                  システム全体の管理と監視を行います
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-4 shadow-lg">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white/80 backdrop-blur-sm rounded-t-2xl shadow-sm border border-purple-100 border-b-0">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-3 text-center text-lg font-semibold transition-colors ${
                  activeTab === 'overview'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-purple-500'
                }`}
              >
                概要
              </button>
              <button
                onClick={() => setActiveTab('job_info_manager')}
                className={`flex-1 py-3 text-center text-lg font-semibold transition-colors ${
                  activeTab === 'job_info_manager'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-purple-500'
                }`}
              >
                就職情報管理
              </button>
              <button
                onClick={() => setActiveTab('chat_monitoring')}
                className={`flex-1 py-3 text-center text-lg font-semibold transition-colors ${
                  activeTab === 'chat_monitoring'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-purple-500'
                }`}
              >
                チャット監視
              </button>
              <button
                onClick={() => setActiveTab('point_exchange')} // ★★★ 追加 ★★★
                className={`flex-1 py-3 text-center text-lg font-semibold transition-colors ${
                activeTab === 'point_exchange'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-purple-500'
                }`}
              >
                ポイント交換
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-b-2xl shadow-xl p-8 border border-purple-100">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'job_info_manager' && (
              <AdminJobInfoManager onDataChange={fetchStats} />
            )}
            {activeTab === 'chat_monitoring' && renderChatMonitoringTab()}
            {activeTab === 'point_exchange' && ( // ★★★ 追加: ポイント交換管理をレンダリング ★★★
                <PointExchangeManager />
            )}
          </div>
        </main>
      </div>

      {/* Chat Modal for Admin (Read-Only) */}
      {isChatModalOpen && user && selectedRoomId && (
        <ChatModal
          user={user}
          onClose={() => {
            setIsChatModalOpen(false);
            setSelectedRoomId(null);
          }}
          readOnly={true} // 閲覧モードを有効化
          roomIdOverride={selectedRoomId} // 選択したルームIDを渡す
        />
      )}
    </div>
  );
}
