'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/config/supabase';
import { Survey, Question, Answer, User, MonitorProfile, Advertisement } from '@/types';
import { 
  Star, 
  Gift, 
  MessageCircle, 
  LogOut, 
  User as UserIcon, 
  Trophy,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Award
} from 'lucide-react';
import { ProfileModal } from '@/components/ProfileModal';
import { CareerConsultationModal } from '@/components/CareerConsultationModal';
import { ChatModal } from '@/components/ChatModal';
import { NotificationButton } from '@/components/NotificationButton';
import { SparklesCore } from '@/components/ui/sparkles';

export default function MonitorDashboard() {
  const { user, signOut } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [profile, setProfile] = useState<MonitorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSurveys();
      fetchAdvertisements();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('monitor_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvertisements = async () => {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAdvertisements(data || []);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
    }
  };

  const handleSurveyClick = async (survey: Survey) => {
    try {
      // Check if already completed
      const { data: existingResponse } = await supabase
        .from('responses')
        .select('id')
        .eq('survey_id', survey.id)
        .eq('monitor_id', user?.id)
        .single();

      if (existingResponse) {
        alert('このアンケートは既に回答済みです。');
        return;
      }

      // Fetch questions
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('survey_id', survey.id)
        .order('order_index');

      if (error) throw error;

      setSelectedSurvey(survey);
      setSurveyQuestions(questions || []);
      setAnswers(questions?.map(q => ({ question_id: q.id, answer: '' })) || []);
    } catch (error) {
      console.error('Error fetching survey questions:', error);
      alert('アンケートの読み込みに失敗しました。');
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => 
      prev.map(a => 
        a.question_id === questionId ? { ...a, answer } : a
      )
    );
  };

  const handleSurveySubmit = async () => {
    if (!selectedSurvey || !user) return;

    try {
      const { error } = await supabase
        .from('responses')
        .insert([
          {
            survey_id: selectedSurvey.id,
            monitor_id: user.id,
            answers: answers,
          },
        ]);

      if (error) throw error;

      alert(`アンケートを送信しました！${selectedSurvey.points_reward}ポイントを獲得しました。`);
      setSelectedSurvey(null);
      setSurveyQuestions([]);
      setAnswers([]);
      fetchProfile(); // Refresh profile to update points
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('アンケートの送信に失敗しました。');
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

  if (selectedSurvey) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">{selectedSurvey.title}</h1>
              <button
                onClick={() => setSelectedSurvey(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-6">{selectedSurvey.description}</p>

            <div className="space-y-6">
              {surveyQuestions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    {index + 1}. {question.question_text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>

                  {question.question_type === 'text' && (
                    <textarea
                      value={answers.find(a => a.question_id === question.id)?.answer || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                      placeholder="回答を入力してください"
                    />
                  )}

                  {question.question_type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {question.options?.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center">
                          <input
                            type={question.is_multiple_select ? 'checkbox' : 'radio'}
                            name={`question_${question.id}`}
                            value={option}
                            onChange={(e) => {
                              const currentAnswer = answers.find(a => a.question_id === question.id)?.answer || '';
                              if (question.is_multiple_select) {
                                const currentAnswers = currentAnswer ? currentAnswer.split(',') : [];
                                if (e.target.checked) {
                                  handleAnswerChange(question.id, [...currentAnswers, option].join(','));
                                } else {
                                  handleAnswerChange(question.id, currentAnswers.filter(a => a !== option).join(','));
                                }
                              } else {
                                handleAnswerChange(question.id, option);
                              }
                            }}
                            className="mr-2"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.question_type === 'rating' && (
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleAnswerChange(question.id, rating.toString())}
                          className={`w-10 h-10 rounded-full border-2 ${
                            answers.find(a => a.question_id === question.id)?.answer === rating.toString()
                              ? 'border-orange-500 bg-orange-500 text-white'
                              : 'border-gray-300 hover:border-orange-300'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  )}

                  {question.question_type === 'yes_no' && (
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          value="はい"
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="mr-2"
                        />
                        <span>はい</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          value="いいえ"
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="mr-2"
                        />
                        <span>いいえ</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setSelectedSurvey(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSurveySubmit}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                送信する（{selectedSurvey.points_reward}ポイント獲得）
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Sparkles Background */}
      <div className="w-full absolute inset-0 h-screen">
        <SparklesCore
          id="tsparticlesmonitor"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={60}
          className="w-full h-full"
          particleColor="#F97316"
          speed={0.5}
        />
      </div>

      {/* Subtle Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/80"></div>

      <div className="relative z-20">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">
                  声キャン！
                </h1>
                <span className="ml-3 px-3 py-1 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 rounded-full text-sm font-medium">
                  モニター
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <NotificationButton />
                <div className="flex items-center bg-gradient-to-r from-orange-100 to-orange-200 rounded-full px-4 py-2">
                  <Trophy className="w-4 h-4 text-orange-600 mr-2" />
                  <span className="text-orange-800 font-semibold">{profile?.points || 0}pt</span>
                </div>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors"
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  おかえりなさい、{user?.name}さん！
                </h2>
                <p className="text-gray-600 mb-4">
                  今日もアンケートに答えてポイントを貯めましょう
                </p>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-500 mr-2" />
                    <span className="text-gray-700">現在のポイント: <strong>{profile?.points || 0}pt</strong></span>
                  </div>
                  <div className="flex items-center">
                    <Target className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-700">利用可能なアンケート: <strong>{surveys.length}件</strong></span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-4 shadow-lg">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => setShowCareerModal(true)}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-orange-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">キャリア相談</h3>
              <p className="text-gray-600 text-sm">専門カウンセラーに相談</p>
            </button>

            <button
              onClick={() => setShowChatModal(true)}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-orange-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">チャット</h3>
              <p className="text-gray-600 text-sm">リアルタイムでやり取り</p>
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-orange-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">プロフィール</h3>
              <p className="text-gray-600 text-sm">情報を更新・確認</p>
            </button>
          </div>

          {/* Available Surveys */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-orange-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">利用可能なアンケート</h2>
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-2" />
                <span>{surveys.length}件のアンケート</span>
              </div>
            </div>

            {surveys.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">現在利用可能なアンケートはありません</h3>
                <p className="text-gray-600">新しいアンケートが追加されるまでお待ちください。</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {surveys.map((survey) => (
                  <div
                    key={survey.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:border-orange-300"
                    onClick={() => handleSurveyClick(survey)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
                          {survey.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{survey.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>約5-10分</span>
                          </div>
                          <div className="flex items-center">
                            <Award className="w-4 h-4 mr-1" />
                            <span>{survey.points_reward}ポイント</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-6 flex flex-col items-end">
                        <div className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 px-4 py-2 rounded-full font-semibold mb-2">
                          {survey.points_reward}pt
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advertisements */}
          {advertisements.length > 0 && (
            <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-orange-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">おすすめ情報</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {advertisements.map((ad) => (
                  <div
                    key={ad.id}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => ad.link_url && window.open(ad.link_url, '_blank')}
                  >
                    {ad.image_url && (
                      <div className="aspect-video bg-gray-100 overflow-hidden">
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
                        {ad.title}
                      </h3>
                      {ad.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{ad.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          profile={profile}
          onClose={() => setShowProfileModal(false)}
          onUpdate={fetchProfile}
        />
      )}

      {showCareerModal && (
        <CareerConsultationModal
          onClose={() => setShowCareerModal(false)}
        />
      )}

      {showChatModal && (
        <ChatModal
          user={user}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
}