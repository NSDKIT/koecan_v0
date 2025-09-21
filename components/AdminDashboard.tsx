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
  Briefcase // 就職情報管理のアイコンとして追加
} from 'lucide-react';
import { SparklesCore } from '@/components/ui/sparkles';
import { AdminJobInfoManager } from '@/components/AdminJobInfoManager'; // 新しいコンポーネントをインポート

type AdminDashboardTab = 'overview' | 'job_info_manager'; // タブの型を定義

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSurveys: 0,
    totalResponses: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>('overview'); // アクティブなタブの状態

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Fetch user count
      const { count: userCount, error: userCountError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      if (userCountError) throw userCountError;

      // Fetch survey count
      const { count: surveyCount, error: surveyCountError } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true });
      if (surveyCountError) throw surveyCountError;

      // Fetch response count
      const { count: responseCount, error: responseCountError } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true });
      if (responseCountError) throw responseCountError;

      setStats({
        totalUsers: userCount || 0,
        totalSurveys: surveyCount || 0,
        totalResponses: responseCount || 0,
        activeUsers: userCount || 0 // アクティブユーザーは総ユーザー数と同じと仮定
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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

          {/* タブナビゲーション */}
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
            </div>
          </div>

          {/* タブコンテンツ */}
          <div className="bg-white/80 backdrop-blur-sm rounded-b-2xl shadow-xl p-8 border border-purple-100">
            {activeTab === 'overview' && (
              <>
                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-100">
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

                  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">総アンケート数</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalSurveys}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">総回答数</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalResponses}</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-3">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">アクティブユーザー</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-3">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Management Sections */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* User Management */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-purple-100">
                    <div className="flex items-center mb-6">
                      <Users className="w-6 h-6 text-purple-600 mr-3" />
                      <h3 className="text-xl font-bold text-gray-800">ユーザー管理</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                          <span className="text-gray-700">アクティブユーザー</span>
                        </div>
                        <span className="font-semibold text-gray-900">{stats.activeUsers}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 text-yellow-500 mr-3" />
                          <span className="text-gray-700">保留中のユーザー</span>
                        </div>
                        <span className="font-semibold text-gray-900">0</span>
                      </div>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-purple-100">
                    <div className="flex items-center mb-6">
                      <Database className="w-6 h-6 text-purple-600 mr-3" />
                      <h3 className="text-xl font-bold text-gray-800">システム状態</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                          <span className="text-gray-700">データベース</span>
                        </div>
                        <span className="text-green-600 font-semibold">正常</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                          <span className="text-gray-700">API</span>
                        </div>
                        <span className="text-green-600 font-semibold">正常</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'job_info_manager' && (
              <AdminJobInfoManager onDataChange={fetchStats} /> {/* 就職情報管理コンポーネントを配置 */}
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
