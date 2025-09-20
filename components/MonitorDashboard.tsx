'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/config/supabase';
import { Survey, Question, Answer, User, MonitorProfile, Advertisement, Response as UserResponse } from '@/types'; // Import Response as UserResponse to avoid name collision
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
  Award,
  Users,
  Menu, // Hamburger icon
  ExternalLink, // New icon for external link in ad detail modal
  X, // Close icon for modal
  History, // Icon for answered surveys
} from 'lucide-react';
import { ProfileModal } from '@/components/ProfileModal';
import { CareerConsultationModal } from '@/components/CareerConsultationModal';
import { ChatModal } from '@/components/ChatModal';
import { NotificationButton } from '@/components/NotificationButton';
import { SparklesCore } from '@/components/ui/sparkles';
import { PointExchangeModal } from '@/components/PointExchangeModal';

// Define types for active tab
type ActiveTab = 'surveys' | 'recruitment' | 'services';

export default function MonitorDashboard() {
  const { user, signOut } = useAuth();
  const [availableSurveys, setAvailableSurveys] = useState<Survey[]>([]); // 未回答のアンケート
  const [answeredSurveys, setAnsweredSurveys] = useState<Survey[]>([]);   // 回答済みのアンケート
  const [profile, setProfile] = useState<MonitorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('surveys');
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for hamburger menu
  const menuRef = useRef<HTMLDivElement>(null); // Ref for closing menu on outside click

  const [selectedAdvertisement, setSelectedAdvertisement] = useState<Advertisement | null>(null);
  const [showPointExchangeModal, setShowPointExchangeModal] = useState(false);


  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSurveysAndResponses(); // Modified to fetch both available and answered
      fetchAdvertisements();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

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

  const fetchSurveysAndResponses = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Fetch all active surveys
      const { data: allActiveSurveys, error: surveysError } = await supabase
        .from('surveys')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (surveysError) throw surveysError;

      // 2. Fetch all responses by the current user
      const { data: userResponses, error: responsesError } = await supabase
        .from('responses')
        .select('survey_id')
        .eq('monitor_id', user.id);

      if (responsesError) throw responsesError;

      const answeredSurveyIds = new Set(userResponses?.map(res => res.survey_id));

      const newAvailableSurveys: Survey[] = [];
      const newAnsweredSurveys: Survey[] = [];

      allActiveSurveys?.forEach(survey => {
        if (answeredSurveyIds.has(survey.id)) {
          newAnsweredSurveys.push(survey);
        } else {
          newAvailableSurveys.push(survey);
        }
      });

      setAvailableSurveys(newAvailableSurveys);
      setAnsweredSurveys(newAnsweredSurveys);

    } catch (error) {
      console.error('Error fetching surveys and responses:', error);
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
      // Re-check if already completed (redundant due to fetchSurveysAndResponses but good for immediate UX)
      const { data: existingResponse } = await supabase
        .from('responses')
        .select('id')
        .eq('survey_id', survey.id)
        .eq('monitor_id', user?.id)
        .single();

      if (existingResponse) {
        alert('このアンケートは既に回答済みです。');
        // Optionally, redirect to answered surveys tab or simply close modal
        return;
      }

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
      const questionCount = surveyQuestions.length > 0 ? surveyQuestions.length : 5; 

      const allRequiredAnswered = surveyQuestions.every(q => !q.required || answers.some(a => a.question_id === q.id && a.answer.trim() !== ''));

      if (!allRequiredAnswered) {
          alert('全ての必須質問に回答してください。');
          return;
      }

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
      fetchSurveysAndResponses(); // Re-fetch surveys to update available/answered lists
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
              
              <div className="flex items-center space-x-4" ref={menuRef}>
                <NotificationButton />
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 hover:text-orange-600 transition-colors relative"
                >
                  <Menu className="w-6 h-6" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-4 top-16 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <UserIcon className="w-5 h-5 mr-2" />
                      プロフィール設定
                    </button>
                    <button
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 獲得ポイントカード */}
          <div
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-orange-100 flex items-center space-x-4 cursor-pointer hover:shadow-2xl transition-shadow"
            onClick={() => setShowPointExchangeModal(true)} // Add onClick to open PointExchangeModal
          >
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-4 flex items-center justify-center w-20 h-20 shadow-lg">
              <Star className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-lg">獲得ポイント</p>
              <p className="text-5xl font-bold text-orange-600">{profile?.points || 0}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white/80 backdrop-blur-sm rounded-t-2xl shadow-sm border border-orange-100 border-b-0">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('surveys')}
                className={`flex-1 py-3 text-center text-lg font-semibold transition-colors ${
                  activeTab === 'surveys'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                アンケート
              </button>
              <button
                onClick={() => setActiveTab('recruitment')} // Tab key is still 'recruitment' for internal logic
                className={`flex-1 py-3 text-center text-lg font-semibold transition-colors ${
                  activeTab === 'recruitment'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                就職情報 {/* Display text changed to 就職情報 */}
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex-1 py-3 text-center text-lg font-semibold transition-colors ${
                  activeTab === 'services'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                サービス一覧
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-b-2xl shadow-xl p-8 border border-orange-100">
            {activeTab === 'surveys' && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">回答できるアンケート</h2>
                {availableSurveys.length === 0 ? (
                  <div className="text-center py-12 mb-8">
                    <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">現在利用可能なアンケートはありません</h3>
                    <p className="text-gray-600">新しいアンケートが追加されるまでお待ちください。</p>
                  </div>
                ) : (
                  <div className="grid gap-6 mb-8">
                    {availableSurveys.map((survey) => (
                      <div
                        key={survey.id}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex flex-col md:flex-row items-start justify-between">
                          <div className="flex-1 mb-4 md:mb-0">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                              {survey.title}
                            </h3>
                            <p className="text-gray-600 mb-4 line-clamp-2">{survey.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                <span>対象者: 学生</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>質問数: {surveyQuestions.length > 0 ? surveyQuestions.length : 5}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center md:items-end space-y-3 md:ml-6">
                            <div className="flex items-center bg-orange-50 rounded-full px-4 py-2 text-orange-700 font-semibold text-lg">
                              <Gift className="w-5 h-5 mr-2" />
                              <span>{survey.points_reward}pt</span>
                            </div>
                            <button
                              onClick={() => handleSurveyClick(survey)}
                              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-base font-semibold"
                            >
                              回答する
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-t pt-8">回答済みアンケート</h2>
                {answeredSurveys.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <History className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">まだ回答したアンケートはありません</h3>
                    <p className="text-gray-600">新しいアンケートに回答してポイントを獲得しましょう。</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {answeredSurveys.map((survey) => (
                      <div
                        key={survey.id}
                        className="border border-gray-200 rounded-xl p-6 bg-gray-50 opacity-80" // Visually distinguish answered surveys
                      >
                        <div className="flex flex-col md:flex-row items-start justify-between">
                          <div className="flex-1 mb-4 md:mb-0">
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                              {survey.title}
                            </h3>
                            <p className="text-gray-500 mb-4 line-clamp-2">{survey.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                <span>対象者: 学生</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>質問数: {surveyQuestions.length > 0 ? surveyQuestions.length : 5}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center md:items-end space-y-3 md:ml-6">
                            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 text-gray-600 font-semibold text-lg">
                              <Gift className="w-5 h-5 mr-2" />
                              <span>{survey.points_reward}pt 獲得済み</span>
                            </div>
                            {/* 回答済みアンケートには「回答する」ボタンは不要、必要なら「結果を見る」などに変更 */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'recruitment' && ( 
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-0">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">就職情報</h2> {/* Display text changed to 就職情報 */}
                {advertisements.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">現在、公開されている就職情報はありません。</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {advertisements.map((ad) => (
                      <div
                        key={ad.id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                        onClick={() => setSelectedAdvertisement(ad)} 
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
                )}
              </div>
            )}

            {activeTab === 'services' && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">サービス一覧</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* キャリア相談 */}
                  <button
                    onClick={() => { setShowCareerModal(true); setIsMenuOpen(false); }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-orange-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                  >
                    <div className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3 group-hover:scale-110 transition-transform w-12 h-12 mb-4">
                       <MessageCircle className="w-6 h-6 text-white" /> 
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">キャリア相談</h3>
                    <p className="text-gray-600 text-sm">専門カウンセラーに相談</p>
                  </button>

                  {/* チャット */}
                  <button
                    onClick={() => { setShowChatModal(true); setIsMenuOpen(false); }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-orange-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                  >
                    <div className="flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 group-hover:scale-110 transition-transform w-12 h-12 mb-4">
                       <MessageCircle className="w-6 h-6 text-white" /> 
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">チャット</h3>
                    <p className="text-gray-600 text-sm">リアルタイムでやり取り</p>
                  </button>
                </div>
              </>
            )}
          </div>
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

      {selectedAdvertisement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-800">{selectedAdvertisement.title}</h2>
              </div>
              <button
                onClick={() => setSelectedAdvertisement(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {selectedAdvertisement.image_url && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img
                    src={selectedAdvertisement.image_url}
                    alt={selectedAdvertisement.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
              {selectedAdvertisement.description && (
                <p className="text-gray-700 mb-6 whitespace-pre-line">
                  {selectedAdvertisement.description}
                </p>
              )}

              {selectedAdvertisement.link_url && (
                <a
                  href={selectedAdvertisement.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  詳細を見る <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Point Exchange Modal */}
      {showPointExchangeModal && profile && (
        <PointExchangeModal
          currentPoints={profile.points}
          onClose={() => setShowPointExchangeModal(false)}
          onExchangeSuccess={fetchProfile} // Refresh points after successful exchange
        />
      )}
    </div>
  );
}
