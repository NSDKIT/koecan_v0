'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/config/supabase';
import { 
  MessageCircle, 
  Users, 
  HelpCircle, 
  LogOut, 
  User as UserIcon,
  Headphones,
  Clock,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import { SparklesCore } from '@/components/ui/sparkles';

export default function SupportDashboard() {
  const { user, signOut } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    openTickets: 0,
    resolvedTickets: 0,
    totalUsers: 0
  });

  useEffect(() => {
    if (user) {
      fetchTickets();
      fetchStats();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      // In a real app, you would fetch support tickets from the database
      // For now, we'll use mock data
      setTickets([
        {
          id: '1',
          user_name: '田中太郎',
          subject: 'ポイント交換について',
          status: 'open',
          created_at: new Date().toISOString(),
          priority: 'medium'
        },
        {
          id: '2',
          user_name: '佐藤花子',
          subject: 'アンケート回答エラー',
          status: 'in_progress',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          priority: 'high'
        }
      ]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      setStats({
        openTickets: 5,
        resolvedTickets: 23,
        totalUsers: userCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
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
                  ユーザーサポートとお問い合わせ対応を管理します
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 shadow-lg">
                  <Headphones className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">未対応チケット</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-full p-3">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">解決済みチケット</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Support Tickets */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-green-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">サポートチケット</h3>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="チケットを検索..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">チケットがありません</h3>
                <p className="text-gray-600">現在対応が必要なサポートチケットはありません。</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="text-lg font-semibold text-gray-800 mr-3">
                            {ticket.subject}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(ticket.status)}`}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1">
                              {ticket.status === 'open' && '未対応'}
                              {ticket.status === 'in_progress' && '対応中'}
                              {ticket.status === 'resolved' && '解決済み'}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>ユーザー: {ticket.user_name}</span>
                          <span>作成日: {new Date(ticket.created_at).toLocaleDateString('ja-JP')}</span>
                          <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                            優先度: {ticket.priority === 'high' ? '高' : ticket.priority === 'medium' ? '中' : '低'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-6">
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          対応する
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}