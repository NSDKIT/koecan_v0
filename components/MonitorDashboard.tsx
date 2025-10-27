// koecan_v0-main/components/MonitorDashboard.tsx

'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/config/supabase';
import { Survey, Question, Answer, User, MonitorProfile, Advertisement, Response as UserResponse } from '@/types'; 
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
  Users, // アンケートの対象者アイコン
  Menu, // ハンバーガーメニュー
  ExternalLink, // 外部リンクアイコン
  X, // 閉じるアイコン
  History, // 回答済みアンケートのアイコン
  FileText, // プロフィールアンケートのアイコン
  Briefcase, // 就職情報のアイコン
  ClipboardList, // アンケートのアイコン
  Building, // 新しいアイコン
  MapPin, // 新しいアイコン
  Calendar, // 新しいアイコン
  DollarSign, // 新しいアイコン
  BarChart3
} from 'lucide-react';
import { ProfileModal } from '@/components/ProfileModal';
import { CareerConsultationModal } from '@/components/CareerConsultationModal';
import { ChatModal } from '@/components/ChatModal';
import { LineLinkButton } from '@/components/LineLinkButton'; // LINE連携ボタン
import { SparklesCore } from '@/components/ui/sparkles';
import { PointExchangeModal } from '@/components/PointExchangeModal'; 
import { MonitorProfileSurveyModal } from '@/components/MonitorProfileSurveyModal'; 
import { MatchingFeature } from '@/components/MatchingFeature'; // これを追加

// アクティブなタブの型定義
type ActiveTab = 'surveys' | 'recruitment' | 'career_consultation' | 'matching'; // 'services' -> 'career_consultation'

// TODO: ここに、クライアントがチャットしたいサポート担当者（例: koecan.koushiki@gmail.com）の実際のユーザーIDを設定してください。
const SUPABASE_SUPPORT_USER_ID = '39087559-d1da-4fd7-8ef9-4143de30d06d'; // 声キャン！運営のIDに仮変更

// ★★★ 修正箇所: シーエイトのLINE公式アカウントの短縮URLを定義 ★★★
const C8_LINE_ADD_URL = 'https://lin.ee/f2zHhiB';
// ★★★ 修正箇所ここまで ★★★


// boolean型の値を日本語文字列に変換するヘルパー関数
const formatBoolean = (val: boolean | null | undefined, yes: string = 'あり', no: string = 'なし') => {
    if (val === true) return yes;
    if (val === false) return no;
    return '未設定';
};

// 画像を最適化して配信するためのプロキシURL変換関数
// すべての画像を最適化して高速化
const getSecureImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    
    // すべての画像をプロキシ経由で最適化
    // wsrv.nlは画像のリサイズ、圧縮、WebP変換を自動で行う
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // 最適化パラメータ：
        // w=800: 幅を800pxに制限（サムネイル用）
        // output=webp: WebP形式で配信（より軽量）
        // q=85: 品質85%（バランス重視）
        return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=800&output=webp&q=85`;
    }
    
    // その他の場合はそのまま返す
    return url;
};

export default function MonitorDashboard() {
  const { user, signOut, loading: authLoading } = useAuth(); 
  const [availableSurveys, setAvailableSurveys] = useState<Survey[]>([]); 
  const [answeredSurveys, setAnsweredSurveys] = useState<Survey[]>([]);   
  const [profile, setProfile] = useState<MonitorProfile | null>(null);
  const [dashboardDataLoading, setDashboardDataLoading] = useState(true); 
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('matching'); // 'surveys' から 'matching' に変更
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const menuButtonRef = useRef<HTMLButtonElement>(null); 

  const [selectedAdvertisement, setSelectedAdvertisement] = useState<Advertisement | null>(null);
  const [showPointExchangeModal, setShowPointExchangeModal] = useState(false);
  const [showProfileSurveyModal, setShowProfileSurveyModal] = useState(false); 
  const [showLineLinkModal, setShowLineLinkModal] = useState(false); // ★★★ LINE連携モーダル用の新規ステート ★★★


  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSurveysAndResponses(); 
      fetchAdvertisements();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuButtonRef.current && menuButtonRef.current.contains(event.target as Node)) {
        return; 
      }
      const menuElement = document.getElementById('hamburger-menu-dropdown');
      if (menuElement && !menuElement.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); 

  const fetchProfile = async () => {
    console.log("MonitorDashboard: fetchProfile started.");
    if (!user?.id) throw new Error("User ID is missing.");
    
    try {
      // 1. 基本プロフィール情報（モニターの属性情報）を取得
      const { data: profileData, error: profileError } = await supabase
        .from('monitor_profiles')
        .select('*') 
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // 2. 累積ポイント残高をビューから取得
      const { data: pointsData, error: pointsError } = await supabase
        .from('monitor_points_view') 
        .select('points_balance')
        .eq('user_id', user.id)
        .single();
      
      if (pointsError && pointsError.code !== 'PGRST116') { 
         throw pointsError;
      }
      
      const pointsBalance = pointsData ? pointsData.points_balance : 0;
      
      // profileステートに結合してセット
      const combinedProfile: MonitorProfile = {
          ...profileData, 
          points: pointsBalance, 
          monitor_id: profileData.id 
      } as MonitorProfile; // MonitorProfile型へのキャストを明示

      setProfile(combinedProfile);

      console.log("MonitorDashboard: fetchProfile completed. Points: " + pointsBalance);
      return combinedProfile; 
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      // エラーが発生した場合も、ダッシュボードの表示が止まらないよう、最低限のデータで設定を試みる
      setProfile({ 
          id: user.id, 
          user_id: user.id,
          points: 0,
          age: 0, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          monitor_id: user.id 
      } as MonitorProfile); 
      throw error;
    }
  };

  const fetchSurveysAndResponses = async () => {
    console.log("MonitorDashboard: fetchSurveysAndResponses started.");
    if (!user?.id) {
        console.error("fetchSurveysAndResponses: User ID is not available.");
        throw new Error("User ID is not available.");
    }
    try {
      const { data: allActiveSurveys, error: surveysError } = await supabase
        .from('surveys')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (surveysError) {
        console.error('アンケート取得エラー:', surveysError);
        throw surveysError;
      }

      // Response オブジェクトから survey_id のみを取得する最小のデータ構造
      const { data: userResponses, error: responsesError } = await supabase
        .from('responses')
        .select('survey_id')
        .eq('monitor_id', user.id);

      if (responsesError) {
        console.error('回答履歴取得エラー:', responsesError);
        throw responsesError;
      }

      // ★★★ 修正箇所: mapの引数に明示的に型 ({survey_id: string}) を指定 ★★★
      const answeredSurveyIds = new Set(userResponses?.map((res: {survey_id: string}) => res.survey_id));

      const newAvailableSurveys: Survey[] = [];
      const newAnsweredSurveys: Survey[] = [];

      // ★★★ 修正箇所: forEachの引数に明示的に型 (Survey) を指定 ★★★
      allActiveSurveys?.forEach((survey: Survey) => {
        if (answeredSurveyIds.has(survey.id)) {
          newAnsweredSurveys.push(survey);
        } else {
          newAvailableSurveys.push(survey);
        }
      });

      setAvailableSurveys(newAvailableSurveys);
      setAnsweredSurveys(newAnsweredSurveys);
      console.log("MonitorDashboard: fetchSurveysAndResponses completed.");
      return { available: newAvailableSurveys, answered: newAnsweredSurveys };
    } catch (error) {
      console.error('アンケートと回答の取得エラー:', error);
      throw error;
    }
  };

  const fetchAdvertisements = async () => {
    console.log("MonitorDashboard: fetchAdvertisements started.");
    try {
      // 全ての新しいカラムを取得するように修正 (types/index.ts の Advertisement 型に対応)
      const { data, error } = await supabase
        .from('advertisements')
        .select(`*`) 
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAdvertisements(data || []);
      console.log("MonitorDashboard: fetchAdvertisements completed.");
      return data;
    } catch (error) {
      console.error('広告取得エラー:', error);
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true; 

    const loadAllDashboardData = async () => {
      console.log("MonitorDashboard: loadAllDashboardData initiated. Current user:", user?.id, "authLoading:", authLoading);
      
      if (!user || authLoading) {
        console.log("MonitorDashboard: Skipping dashboard data load as user is not ready or auth is loading.");
        setDashboardDataLoading(true); 
        return;
      }

      setDashboardDataLoading(true); 
      try {
        await Promise.all([
          fetchProfile(),
          fetchSurveysAndResponses(),
          fetchAdvertisements()
        ]);
        if (isMounted) {
          setDashboardDataLoading(false); 
          console.log("MonitorDashboard: All dashboard data loaded successfully.");
        }
      } catch (err) {
        console.error("MonitorDashboard: Failed to load dashboard data in Promise.all:", err);
        if (isMounted) {
          setDashboardDataLoading(false); 
        }
      }
    };

    if (user && !authLoading) {
      console.log("MonitorDashboard: Auth complete, user present. Triggering loadAllDashboardData.");
      loadAllDashboardData();
    } else if (!user && !authLoading) {
      console.log("MonitorDashboard: Auth complete, no user present. Setting dashboardDataLoading to false.");
      setDashboardDataLoading(false);
    }
    
    return () => {
      isMounted = false; 
      console.log("MonitorDashboard: useEffect cleanup.");
    };
  }, [user, authLoading]); 

  // ★★★ LINE連携リダイレクト処理のuseEffect (既存) ★★★
  useEffect(() => {
    // URLからクエリパラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('line_link_status');
    const errorMsg = urlParams.get('error');

    if (status === 'success') {
      alert('✅ LINE連携が完了しました！今後はLINEで通知を受け取れます。');
    } else if (status === 'failure') {
      alert(`❌ LINE連携に失敗しました。\nエラー: ${errorMsg || '不明なエラー'}`);
    }

    // クエリパラメータを削除してURLをクリーンアップ
    if (status) {
        history.replaceState(null, '', window.location.pathname);
    }
    
  }, []);


  const handleSurveyClick = async (survey: Survey) => {
    try {
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

      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('survey_id', survey.id)
        .order('order_index');

      if (error) throw error;

      setSelectedSurvey(survey);
      // ★★★ 修正箇所: mapの引数に明示的に型 (Question) を指定 ★★★
      setSurveyQuestions(questions || []);
      setAnswers(questions?.map((q: Question) => ({ question_id: q.id, answer: '' })) || []);
    } catch (error) {
      console.error('アンケート質問の取得エラー:', error);
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
      fetchProfile(); 
      fetchSurveysAndResponses(); 
    } catch (error) {
      console.error('アンケート送信エラー:', error);
      alert('アンケートの送信に失敗しました。');
    }
  };

  if (authLoading || dashboardDataLoading) {
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
          <div className="bg-white rounded-lg p-6">
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
                                const currentAnswersArray = currentAnswer ? currentAnswer.split(',') : []; // ★★★ 修正済み ★★★
                                if (e.target.checked) {
                                  handleAnswerChange(question.id, [...currentAnswersArray, option].join(','));
                                } else {
                                  handleAnswerChange(question.id, currentAnswersArray.filter(a => a !== option).join(','));
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
        {/* ヘッダー */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">
                  声キャン！
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* ★★★ LINE連携ボタンをヘッダーに配置 ★★★ */}
                
                {/* 1. LINE連携を直接ヘッダーに配置（モーダルを開くボタンとして） */}
                <button 
                  onClick={() => setShowLineLinkModal(true)} // 新しいステートでモーダルを開く
                  className="flex items-center px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  LINE連携
                </button>
                
                {/* 2. ハンバーガーメニューボタン */}
                <button
                  ref={menuButtonRef}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 hover:text-orange-600 transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ハンバーガーメニュー ドロップダウン */}
        {isMenuOpen && (
          <div
            id="hamburger-menu-dropdown" 
            className="fixed right-4 top-16 mt-2 w-48 bg-white rounded-lg py-2 z-[1000] border border-gray-100" 
            style={{ zIndex: 1000 }} 
          >
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
                setShowProfileSurveyModal(true); 
                setIsMenuOpen(false);
              }}
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <FileText className="w-5 h-5 mr-2" /> 
              プロフィールアンケート
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

        {/* メインコンテンツ */}
        {/* ボトムタブバーの高さ分、下部にパディングを追加 */}
        <main className={`mx-auto pb-20 ${
          activeTab === 'career_consultation' ? '' : 'max-w-7xl px-4 sm:px-6 lg:px-8 pt-8'
        }`}> 
          {/* 獲得ポイントカード - キャリア相談タブ以外で表示 */}
          {activeTab !== 'career_consultation' && (
            <div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 flex items-center space-x-4 cursor-pointer" // shadow-xl transition-shadow 削除
              onClick={() => setShowPointExchangeModal(true)} 
            >
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-4 flex items-center justify-center w-20 h-20 shadow-lg">
                <Star className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-lg">獲得ポイント</p>
                <p className="text-5xl font-bold text-orange-600">{profile?.points || 0}</p>
              </div>
            </div>
          )}

          {/* タブコンテンツ */}
          <div 
            className={`
              transition-colors duration-300
              ${activeTab === 'career_consultation' ? 'bg-transparent p-0' : 'backdrop-blur-sm rounded-2xl bg-white/80 p-8'}
            `}
          > 
            {activeTab === 'surveys' && (
              <>
                {availableSurveys.length === 0 ? (
                  <div className="text-center py-12 mb-8">
                    <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">現在利用可能な<br></br>アンケートはありません</h3>
                    <p className="text-gray-600">新しいアンケートに回答して<br></br>ポイントを獲得しましょう。</p>
                  </div>
                ) : (
                  <div className="grid gap-6 mb-8">
                    {availableSurveys.map((survey) => (
                      <div
                        key={survey.id}
                        className="border border-gray-200 rounded-xl p-6" // transition-all duration-300 hover:shadow-lg 削除
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
                        className="border border-gray-200 rounded-xl p-6 bg-gray-50 opacity-80" 
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'matching' && (
              <MatchingFeature />
            )}

            {activeTab === 'recruitment' && ( 
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-0">
                {advertisements.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">現在、公開されている企業情報はありません。</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {advertisements.map((ad) => (
                      <div
                        key={ad.id}
                        className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer group" // transition-all duration-300 hover:shadow-lg 削除
                        onClick={() => setSelectedAdvertisement(ad)} 
                      >
                        {/* ★★★ 修正箇所: image_url が null/undefined の場合のフォールバックを追加 ★★★ */}
                        {(() => {
                          const imageUrl = ad.image_url;
                          const optimizedUrl = getSecureImageUrl(imageUrl);
                          if (imageUrl && optimizedUrl !== imageUrl) {
                            console.log(`🖼️ 画像最適化: ${ad.company_name}\n元URL: ${imageUrl}\n最適化URL: ${optimizedUrl}`);
                          }
                          return (imageUrl && imageUrl.length > 0);
                        })() ? (
                          <div className="aspect-video bg-gray-100 overflow-hidden">
                            <img
                              src={getSecureImageUrl(ad.image_url) || ''}
                              alt={ad.company_name || ad.title || ad.company_vision || '企業情報'} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error(`画像読み込みエラー: ${ad.company_name}`, ad.image_url);
                                // エラー時はプレースホルダーを表示
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          // 画像がない場合のプレースホルダー
                          <div className="aspect-video bg-gray-200 flex items-center justify-center">
                            <Briefcase className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-800 mb-2">
                            {ad.company_name || 'N/A'}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {ad.company_vision || ad.title || ad.description || '詳細情報がありません'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'career_consultation' && ( // ★★★ 修正: タブ名変更 ★★★
              <>
                {/* ★★★ 修正箇所: 画像を画面横幅いっぱいに配置 ★★★ */}
                <div className="flex flex-col items-center w-full">
                    {/* 上部画像 */}
                    <img 
                        src="https://raw.githubusercontent.com/NSDKIT/koecan_v0/refs/heads/main/img/c8_top_v2.png"
                        alt="キャリア相談 上部"
                        className="w-full h-auto object-cover"
                    />
                    
                    {/* 中部画像 + ボタン（ボタンを画像の上に重ねる） */}
                    <div className="relative w-full">
                        <img 
                            src="https://raw.githubusercontent.com/NSDKIT/koecan_v0/refs/heads/main/img/c8_middle_v2.png"
                            alt="キャリア相談 中部"
                            className="w-full h-auto object-cover"
                        />
                        
                        {/* ボタンを画像の上に配置 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <a
                                href={C8_LINE_ADD_URL} // ★★★ URLをLINE友だち追加リンクに変更 ★★★
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex flex-col items-center"
                            >
                                <span className="text-sm mb-1">キャリア支援のプロ</span>
                                <span className="text-lg">シーエイトに相談</span>
                            </a>
                        </div>
                    </div>

                    {/* 下部画像 */}
                    <img 
                        src="https://raw.githubusercontent.com/NSDKIT/koecan_v0/refs/heads/main/img/c8_down_v2.png"
                        alt="キャリア相談 下部"
                        className="w-full h-auto object-cover"
                    />
                </div>
                {/* ★★★ 修正箇所ここまで ★★★ */}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ボトムタブバー */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"> {/* shadow-lg 削除 */}
        <div className="max-w-7xl mx-auto flex justify-around h-20">
          <button
            onClick={() => setActiveTab('surveys')}
            className={`flex flex-col items-center justify-center w-full text-sm font-medium transition-colors ${
              activeTab === 'surveys' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <ClipboardList className="w-6 h-6 mb-1" />
            アンケート
          </button>
          <button
            onClick={() => setActiveTab('matching')}
            className={`flex flex-col items-center justify-center w-full text-sm font-medium transition-colors ${
              activeTab === 'matching' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <Sparkles className="w-6 h-6 mb-1" />
            キャリア診断 {/* ★★★ 修正: タブ名変更 ★★★ */}
          </button>
          <button
            onClick={() => setActiveTab('recruitment')}
            className={`flex flex-col items-center justify-center w-full text-sm font-medium transition-colors ${
              activeTab === 'recruitment' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <Briefcase className="w-6 h-6 mb-1" />
            企業情報
          </button>
          <button
            onClick={() => setActiveTab('career_consultation')} // ★★★ 修正: タブ名変更 ★★★
            className={`flex flex-col items-center justify-center w-full text-sm font-medium transition-colors ${
              activeTab === 'career_consultation' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <MessageCircle className="w-6 h-6 mb-1" />
            キャリア相談 {/* ★★★ 修正: タブ名変更 ★★★ */}
          </button>
        </div>
      </div>


      {/* モーダル群 */}
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

      {showChatModal && user?.id && SUPABASE_SUPPORT_USER_ID && ( 
        <ChatModal
          user={user} 
          otherUserId={SUPABASE_SUPPORT_USER_ID} 
          onClose={() => setShowChatModal(false)}
        />
      )}

      {selectedAdvertisement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* ★★★ 企業詳細モーダルのコンテンツ ★★★ */}
            <div className="p-6">
              {/* ヘッダー部分 */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-bold text-gray-800 flex-1">{selectedAdvertisement.company_name}</h2>
                <button
                  onClick={() => setSelectedAdvertisement(null)}
                  className="text-gray-500 hover:text-gray-700 flex-shrink-0 ml-4"
                >
                  ✕
                </button>
              </div>

              {/* 企業画像 */}
              {selectedAdvertisement.image_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={getSecureImageUrl(selectedAdvertisement.image_url)}
                    alt={selectedAdvertisement.company_name}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* 企業ビジョン */}
              {selectedAdvertisement.company_vision && (
                <div className="mb-6 pb-4 border-b">
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{selectedAdvertisement.company_vision}</p>
                </div>
              )}
              
              {/* 企業概要 */}
              <h3 className="text-xl font-semibold border-b pb-2 mb-4">企業概要</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div><p className="font-semibold">代表者名:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.representative_name || 'N/A'}</p></div>
                <div><p className="font-semibold">設立年:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.establishment_year || 'N/A'}</p></div>
                <div><p className="font-semibold">所在地 (本社):</p><p className="whitespace-pre-wrap">{selectedAdvertisement.headquarters_location || 'N/A'}</p></div>
                <div><p className="font-semibold">所在地 (支社):</p><p className="whitespace-pre-wrap">{selectedAdvertisement.branch_office_location || 'N/A'}</p></div>
                <div><p className="font-semibold">従業員数:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.employee_count || 'N/A'}</p></div>
                <div><p className="font-semibold">男女比:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.employee_gender_ratio || 'N/A'}</p></div>
                <div><p className="font-semibold">平均年齢:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.employee_avg_age || 'N/A'}</p></div>
                <div className="col-span-2"><p className="font-semibold">業界:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.industries?.join(', ') || 'N/A'}</p></div>
                <div className="col-span-2"><p className="font-semibold">イチオシポイント:</p><p className="text-orange-600 whitespace-pre-wrap">{selectedAdvertisement.highlight_point_1 || 'N/A'} {selectedAdvertisement.highlight_point_2 && ` / ${selectedAdvertisement.highlight_point_2}`} {selectedAdvertisement.highlight_point_3 && ` / ${selectedAdvertisement.highlight_point_3}`}</p></div>
              </div>
              
              {/* 募集・待遇情報 */}
              <h3 className="text-xl font-semibold border-b pb-2 mb-4">募集・待遇情報</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div><p className="font-semibold">初任給:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.starting_salary || 'N/A'}</p></div>
                <div><p className="font-semibold">3年定着率:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.three_year_retention_rate || 'N/A'}</p></div>
                <div><p className="font-semibold">20代平均年収:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.avg_annual_income_20s || 'N/A'}</p></div>
                <div><p className="font-semibold">30代平均年収:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.avg_annual_income_30s || 'N/A'}</p></div>
                <div className="col-span-2">
                  <p className="font-semibold mb-2">キャリアパス:</p>
                  <p className="whitespace-pre-wrap">{selectedAdvertisement.promotion_model_case || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-semibold mb-2">募集職種とその人数:</p>
                  <p className="whitespace-pre-wrap">{selectedAdvertisement.recruitment_roles_count || 'N/A'}</p>
                </div>
                <div className="col-span-2"><p className="font-semibold">選考フロー:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.selection_flow_steps?.join(' → ') || 'N/A'}</p></div>
                <div className="col-span-2"><p className="font-semibold">必須資格・免許:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.required_qualifications || 'N/A'}</p></div>
              </div>

              {/* 働き方・福利厚生 */}
              <h3 className="text-xl font-semibold border-b pb-2 mb-4">働き方・福利厚生</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div><p className="font-semibold">勤務時間:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.working_hours || 'N/A'}</p></div>
                <div><p className="font-semibold">休日:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.holidays || 'N/A'}</p></div>
                <div><p className="font-semibold">年間休日数:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.annual_holidays || 'N/A'}</p></div>
                <div><p className="font-semibold">リモートワーク:</p><p className="whitespace-pre-wrap">{formatBoolean(selectedAdvertisement.remote_work_available)}</p></div>
                <div><p className="font-semibold">副業:</p><p className="whitespace-pre-wrap">{formatBoolean(selectedAdvertisement.side_job_allowed)}</p></div>
                <div><p className="font-semibold">住宅手当:</p><p className="whitespace-pre-wrap">{formatBoolean(selectedAdvertisement.housing_allowance_available)}</p></div>
                <div><p className="font-semibold">女性育休取得率:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.female_parental_leave_rate || 'N/A'}</p></div>
                <div><p className="font-semibold">男性育休取得率:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.male_parental_leave_rate || 'N/A'}</p></div>
                <div><p className="font-semibold">異動/転勤:</p><p className="whitespace-pre-wrap">{formatBoolean(selectedAdvertisement.transfer_existence)} ({selectedAdvertisement.transfer_frequency || 'N/A'})</p></div>
                <div><p className="font-semibold">社内イベント頻度:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.internal_event_frequency || 'N/A'}</p></div>
                <div className="col-span-2"><p className="font-semibold">健康経営の取り組み:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.health_management_practices?.join(', ') || 'N/A'}</p></div>
                <div className="col-span-2">
                  <p className="font-semibold mb-2">イチオシ福利厚生:</p>
                  <p className="whitespace-pre-wrap">{selectedAdvertisement.must_tell_welfare || 'N/A'}</p>
                </div>
              </div>

              {/* 採用情報 */}
              <h3 className="text-xl font-semibold border-b pb-2 mb-4">採用情報</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="col-span-2">
                  <p className="font-semibold mb-2">採用担当部署（担当者）:</p>
                  <p className="whitespace-pre-wrap">{selectedAdvertisement.recruitment_department || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-semibold mb-2">採用に関する問い合わせ先:</p>
                  <p className="whitespace-pre-wrap">{selectedAdvertisement.recruitment_contact || 'N/A'}</p>
                </div>
                {selectedAdvertisement.recruitment_info_page_url && (
                  <div className="col-span-2">
                    <a 
                      href={selectedAdvertisement.recruitment_info_page_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                      採用情報ページを見る
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </div>
                )}
              </div>

              {/* インターンシップ情報 */}
              <h3 className="text-xl font-semibold border-b pb-2 mb-4">インターンシップ情報</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div><p className="font-semibold">実施予定:</p><p className="whitespace-pre-wrap">{formatBoolean(selectedAdvertisement.internship_scheduled, '実施予定あり', '実施予定なし')}</p></div>
                <div><p className="font-semibold">実施日程:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.internship_schedule || 'N/A'}</p></div>
                <div><p className="font-semibold">定員:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.internship_capacity || 'N/A'}</p></div>
                <div><p className="font-semibold">対象学生:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.internship_target_students?.join(', ') || 'N/A'}</p></div>
                <div><p className="font-semibold">実施場所:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.internship_locations?.join(', ') || 'N/A'}</p></div>
                <div><p className="font-semibold">内容:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.internship_content_types?.join(', ') || 'N/A'}</p></div>
                <div><p className="font-semibold">報酬:</p><p className="whitespace-pre-wrap">{selectedAdvertisement.internship_paid_unpaid || 'N/A'}</p></div>
                <div><p className="font-semibold">交通費・宿泊費:</p><p className="whitespace-pre-wrap">{formatBoolean(selectedAdvertisement.transport_lodging_stipend, '支給あり', '支給なし')}</p></div>
                {selectedAdvertisement.internship_application_url && (
                  <div className="col-span-2">
                    <a 
                      href={selectedAdvertisement.internship_application_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                      インターンシップに申し込む
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </div>
                )}
              </div>

              {/* SNS・外部リンク */}
              <h3 className="text-xl font-semibold border-b pb-2 mb-4">SNS・外部リンク</h3>
              <div className="flex flex-wrap gap-3 mb-6">
                {selectedAdvertisement.official_website_url && (
                  <a 
                    href={selectedAdvertisement.official_website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    公式ホームページ
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                )}
                {selectedAdvertisement.official_line_url && (
                  <a 
                    href={selectedAdvertisement.official_line_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    公式LINE
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                )}
                {selectedAdvertisement.instagram_url && (
                  <a 
                    href={selectedAdvertisement.instagram_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm"
                  >
                    Instagram
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                )}
                {selectedAdvertisement.tiktok_url && (
                  <a 
                    href={selectedAdvertisement.tiktok_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    TikTok
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                )}
                {selectedAdvertisement.other_sns_sites && (
                  <div className="w-full">
                    <p className="font-semibold text-sm mb-2">その他のリンク:</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedAdvertisement.other_sns_sites}</p>
                  </div>
                )}
              </div>
            </div>
            {/* ★★★ 企業詳細モーダルのコンテンツここまで ★★★ */}
            
          </div>
        </div>
      )}

      {/* ポイント交換モーダル */}
      {showPointExchangeModal && profile && (
        <PointExchangeModal
          currentPoints={profile.points}
          onClose={() => setShowPointExchangeModal(false)}
          onExchangeSuccess={fetchProfile}
        />
      )}

      {/* モニタープロフィールアンケートモーダル */}
      {showProfileSurveyModal && (
        <MonitorProfileSurveyModal
          onClose={() => setShowProfileSurveyModal(false)}
          onSaveSuccess={() => { /* ... */ }}
        />
      )}
      
      {/* LINE連携モーダル */}
      {showLineLinkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                  <div className="flex justify-end p-4">
                      <button onClick={() => setShowLineLinkModal(false)} className="text-gray-500 hover:text-gray-700">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  {/* LineLinkButtonは、自身でリダイレクトを行うため、ここで直接レンダリング */}
                  <LineLinkButton /> 
              </div>
          </div>
      )}

    </div>
  );
}
