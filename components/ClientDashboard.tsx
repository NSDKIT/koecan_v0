'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/config/supabase';
import { Survey, Question } from '@/types';
import { 
  Plus, 
  BarChart3, 
  Users, 
  LogOut, 
  User as UserIcon,
  Edit,
  Trash2,
  Eye,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ImportSurveyModal } from '@/components/ImportSurveyModal';
import { ChatModal } from '@/components/ChatModal'; // ChatModalをインポート
// import { NotificationButton } from '@/components/NotificationButton'; // 削除
import { SparklesCore } from '@/components/ui/sparkles';

// TODO: ここに、クライアントがチャットしたいサポート担当者（例: zenryoku@gmail.com）の実際のユーザーIDを設定してください。
// モニター用ダッシュボードのSUPABASE_SUPPORT_USER_IDと同じIDであるべきです。
const SUPABASE_SUPPORT_USER_ID = 'e6f087a8-5494-450a-97ad-7d5003445e88'; 

export function ClientDashboard() {
  const { user, signOut } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false); // ChatModal表示用のステート
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    points_reward: 10,
  });

  useEffect(() => {
    if (user) {
      fetchSurveys();
    }
  }, [user]);

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('surveys')
        .insert([
          {
            ...newSurvey,
            client_id: user.id,
          },
        ]);

      if (error) throw error;

      setShowCreateModal(false);
      setNewSurvey({ title: '', description: '', points_reward: 10 });
      fetchSurveys();
    } catch (error) {
      console.error('Error creating survey:', error);
      alert('アンケートの作成に失敗しました。');
    }
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    if (!confirm('このアンケートを削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId);

      if (error) throw error;
      fetchSurveys();
    } catch (error) {
      console.error('Error deleting survey:', error);
      alert('アンケートの削除に失敗しました。');
    }
  };

  const handleStatusChange = async (surveyId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ status: newStatus })
        .eq('id', surveyId);

      if (error) throw error;
      fetchSurveys();
    } catch (error) {
      console.error('Error updating survey status:', error);
      alert('ステータスの更新に失敗しました。');
    }
  };

  const fetchSurveyResponses = async (surveyId: string) => {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select(`
          *,
          users:monitor_id (name, email)
        `)
        .eq('survey_id', surveyId);

      if (error) throw error;
      setSurveyResponses(data || []);
    } catch (error) {
      console.error('Error fetching survey responses:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
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
          id="tsparticlesclient"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={60}
          className="w-full h-full"
          particleColor="#3B82F6"
          speed={0.5}
        />
      </div>

      {/* Subtle Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-orange-50/30"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/80"></div>

      <div className="relative z-20">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">
                  声キャン！
                </h1>
                <span className="ml-3 px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-sm font-medium">
                  クライアント
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* <NotificationButton /> を削除 */}
                <button
                  onClick={() => setShowChatModal(true)} // チャットモーダルを開くボタン
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span>チャット</span>
                </button>
                <button
                  onClick={() => {}}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  ようこそ、{user?.name}さん！
                </h2>
                <p className="text-gray-600 mb-4">
                  アンケートを作成して学生の声を収集しましょう
                </p>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="text-gray-700">作成済みアンケート: <strong>{surveys.length}件</strong></span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-700">アクティブ: <strong>{surveys.filter(s => s.status === 'active').length}件</strong></span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-4 shadow-lg">
                  <BarChart3 className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              新規アンケート作成
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-white/80 backdrop-blur-sm border border-blue-200 hover:border-blue-300 text-blue-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
            >
              <FileText className="w-5 h-5 mr-2" />
              マークダウンから作成
            </button>
          </div>

          {/* Surveys List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">アンケート一覧</h2>
              <div className="flex items-center text-gray-600">
                <FileText className="w-5 h-5 mr-2" />
                <span>{surveys.length}件のアンケート</span>
              </div>
            </div>

            {surveys.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">アンケートがありません</h3>
                <p className="text-gray-600 mb-4">最初のアンケートを作成してみましょう。</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  アンケートを作成
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {surveys.map((survey) => (
                  <div
                    key={survey.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-semibold text-gray-800 mr-3">
                            {survey.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(survey.status)}`}>
                            {getStatusIcon(survey.status)}
                            <span className="ml-1">
                              {survey.status === 'draft' && '下書き'}
                              {survey.status === 'active' && 'アクティブ'}
                              {survey.status === 'completed' && '完了'}
                              {survey.status === 'rejected' && '却下'}
                            </span>
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">{survey.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{new Date(survey.created_at).toLocaleDateString('ja-JP')}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{survey.points_reward}ポイント報酬</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-6 flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSurvey(survey);
                              fetchSurveyResponses(survey.id);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="結果を見る"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {}}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="編集"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSurvey(survey.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {survey.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(survey.id, 'active')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            公開
                          </button>
                        )}
                        {survey.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(survey.id, 'completed')}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            終了
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Survey Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">新規アンケート作成</h2>
            
            <form onSubmit={handleCreateSurvey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <input
                  type="text"
                  value={newSurvey.title}
                  onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="アンケートのタイトル"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  value={newSurvey.description}
                  onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="アンケートの説明"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ポイント報酬
                </label>
                <input
                  type="number"
                  value={newSurvey.points_reward}
                  onChange={(e) => setNewSurvey({ ...newSurvey, points_reward: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Survey Results Modal */}
      {selectedSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{selectedSurvey.title} - 結果</h2>
              <button
                onClick={() => setSelectedSurvey(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{surveyResponses.length}</div>
                  <div className="text-sm text-gray-600">回答数</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedSurvey.points_reward}</div>
                  <div className="text-sm text-gray-600">ポイント報酬</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{surveyResponses.length * selectedSurvey.points_reward}</div>
                  <div className="text-sm text-gray-600">総ポイント</div>
                </div>
              </div>
            </div>

            {surveyResponses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">まだ回答がありません。</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">回答一覧</h3>
                {surveyResponses.map((response, index) => (
                  <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">回答者 {index + 1}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(response.completed_at).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {response.answers.length}件の回答
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportSurveyModal
          onClose={() => setShowImportModal(false)}
          onImport={fetchSurveys}
        />
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <ChatModal
          user={user}
          otherUserId={SUPABASE_SUPPORT_USER_ID} // otherUserIdを渡す
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
}
