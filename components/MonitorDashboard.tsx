// koecan_v0-main/components/MonitorDashboard.tsx

'use client'

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/config/supabase';
import { 
  Survey, Question, Answer, User, MonitorProfile, Advertisement, Response as UserResponse 
} from '@/types'; 
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
  Menu,
  ExternalLink,
  X,
  History,
  FileText,
  Briefcase,
  ClipboardList,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { ProfileModal } from '@/components/ProfileModal';
import { CareerConsultationModal } from '@/components/CareerConsultationModal';
import { ChatModal } from '@/components/ChatModal';
import { LineLinkButton } from '@/components/LineLinkButton';
import { SparklesCore } from '@/components/ui/sparkles';
import { PointExchangeModal } from '@/components/PointExchangeModal'; 
import { MonitorProfileSurveyModal } from '@/components/MonitorProfileSurveyModal'; 
import { MatchingFeature } from '@/components/MatchingFeature';
import { useAuth } from '@/hooks/useAuth'; // useAuthをインポート

type ActiveTab = 'surveys' | 'recruitment' | 'career_consultation' | 'matching';

const SUPABASE_SUPPORT_USER_ID = '39087559-d1da-4fd7-8ef9-4143de30d06d'; // TODO: 実際のサポートユーザーIDに置き換える
const C8_LINE_ADD_URL = 'https://lin.ee/f2zHhiB'; // TODO: 実際のLINE追加URLに置き換える

// boolean値を 'あり'/'なし' で表示するヘルパー関数
const formatBoolean = (val: boolean | null | undefined, yes: string = 'あり', no: string = 'なし') => {
    if (val === true) return yes;
    if (val === false) return no;
    return '';
};

// nullやundefinedの値を空文字列として表示するヘルパー関数
const displayValue = (value: any): string => {
    if (value === null || value === undefined || value === 'N/A') return '';
    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '';
    }
    return String(value);
};

// 画像URLを安全に最適化するヘルパー関数
const getSecureImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    
    // http/httpsで始まるURLはwsrv.nlで最適化を試みる
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=800&output=webp&q=85`;
    }
    
    return url; // それ以外のURLはそのまま返す（Supabase Storageのパスなど）
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('matching');
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const menuButtonRef = useRef<HTMLButtonElement>(null); 

  const [selectedAdvertisement, setSelectedAdvertisement] = useState<Advertisement | null>(null);
  const [showPointExchangeModal, setShowPointExchangeModal] = useState(false);
  const [showProfileSurveyModal, setShowProfileSurveyModal] = useState(false); 
  const [showLineLinkModal, setShowLineLinkModal] = useState(false);
  const [error, setError] = useState<string | null>(null); // エラー表示用state

  // ★★★ 修正された fetchProfile 関数 ★★★
  const fetchProfile = async (): Promise<MonitorProfile | null> => {
    console.log("MonitorDashboard: fetchProfile 開始。");
    if (!user?.id) {
        console.error("MonitorDashboard: fetchProfile エラー - ユーザーIDがありません。");
        // ユーザーIDがない場合はプロフィールをクリアし、エラーを設定
        setProfile(null); 
        setError("ユーザー情報が見つかりません。再ログインしてください。");
        return null; // 早期リターン
    }

    try {
      // 1. monitor_profiles テーブルからユーザーの基本プロフィールデータを取得
      const { data: profileData, error: profileError } = await supabase
        .from('monitor_profiles')
        .select('*') 
        .eq('user_id', user.id) 
        .single();

      // ユーザーのプロフィールがまだ作成されていない場合のハンドリング
      if (profileError && profileError.code === 'PGRST116') { // PGRST116 = 行が見つからない
          console.warn("モニタープロファイルが見つかりません。デフォルト値で初期化します。");
          // プロファイルがなければ、一時的なデフォルトプロファイルを作成し、ポイントは0とする
          const defaultProfile: MonitorProfile = {
              monitor_id: user.id, // monitor_idはユーザーIDと同じと仮定
              user_id: user.id,
              points: 0,
              age: 0, 
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              // 他のプロパティはオプショナルなので含めなくてもOK
          };
          setProfile(defaultProfile);
          console.log("MonitorDashboard: fetchProfile 完了。ポイント: 0 (プロファイル未作成)");
          return defaultProfile; // 処理を終了し、後続のポイントビュー取得は行わない
      } else if (profileError) {
          throw profileError; // その他のデータベースエラーはスロー
      }

      // 2. monitor_points_view からポイント残高を取得 (ビューが正しく定義されている前提)
      const { data: pointsData, error: pointsViewError } = await supabase
        .from('monitor_points_view')
        .select('points_balance')
        .eq('user_id', user.id)
        .single();
      
      // ビューの取得でエラーが発生しても、クラッシュせず、ポイントを0として扱う
      if (pointsViewError && pointsViewError.code !== 'PGRST116') {
         console.warn('monitor_points_view の取得中にエラーが発生しました。ポイントは0として扱います:', pointsViewError.message);
      }
      
      // pointsDataがnullまたはpoints_balanceがnullの場合も0にフォールバック
      const pointsBalance = pointsData ? (pointsData.points_balance || 0) : 0;

      // 3. 取得したプロフィールデータとポイント残高を結合
      const combinedProfile: MonitorProfile = {
          ...profileData!, // profileDataはここで存在することが保証されている
          points: pointsBalance, // monitor_points_view からの値をセット
      };

      setProfile(combinedProfile); // 更新されたプロフィールをstateにセット
      console.log("MonitorDashboard: fetchProfile 完了。ポイント: " + pointsBalance);
      return combinedProfile; // 呼び出し元のために結合されたプロフィールを返します
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      setError(error instanceof Error ? error.message : 'プロフィールの読み込みに失敗しました。');
      // エラー発生時も、最低限のプロフィール情報を設定してUIがフリーズしないようにします。
      setProfile({ 
          monitor_id: user.id, 
          user_id: user.id,
          points: 0,
          age: 0, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
      }); 
      return null; // エラー時はnullを返す
    }
  };

  const fetchSurveysAndResponses = async () => {
    console.log("MonitorDashboard: fetchSurveysAndResponses started.");
    if (!user?.id) {
        console.error("fetchSurveysAndResponses: User ID is not available.");
        return; // ユーザーIDがない場合は早期リターン
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

      const { data: userResponses, error: responsesError } = await supabase
        .from('responses')
        .select('survey_id')
        .eq('monitor_id', user.id);

      if (responsesError) {
        console.error('回答履歴取得エラー:', responsesError);
        throw responsesError;
      }

      const answeredSurveyIds = new Set(userResponses?.map((res: {survey_id: string}) => res.survey_id));

      const newAvailableSurveys: Survey[] = [];
      const newAnsweredSurveys: Survey[] = [];

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
    } catch (error) {
      console.error('アンケートと回答の取得エラー:', error);
      setError('アンケートリストの取得に失敗しました。'); // エラーを設定
    }
  };

  const fetchAdvertisements = async () => {
    console.log("MonitorDashboard: fetchAdvertisements started.");
    try {
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
      setError('企業情報の取得に失敗しました。'); // エラーを設定
      return null; // エラー時はnullを返す
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
      setError(null); // 新しいデータロードの前にエラーをクリア
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
          setError('ダッシュボードデータの読み込み中にエラーが発生しました。'); // 総合エラーを設定
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('line_link_status');
    const errorMsg = urlParams.get('error');

    if (status === 'success') {
      alert('✅ LINE連携が完了しました！今後はLINEで通知を受け取れます。');
    } else if (status === 'failure') {
      alert(`❌ LINE連携に失敗しました。\nエラー: ${errorMsg || '不明なエラー'}`);
    }

    if (status) {
        // URLからクエリパラメータを削除して、リロードしてもアラートが再表示されないようにする
        history.replaceState(null, '', window.location.pathname);
    }
    
  }, []);

  const handleSurveyClick = async (survey: Survey) => {
    try {
      const { data: existingResponse } = await supabase
        .from('responses')
        .select('id')
        .eq('survey_id', survey.id)
        .eq('monitor_id', user?.id);
        // .single(); // .single()を外して、結果がなくてもエラーにならないようにする

      // 回答が1件以上見つかった場合
      if (existingResponse && existingResponse.length > 0) {
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
      // 必須質問の回答チェック
      const allRequiredAnswered = surveyQuestions.every(q => {
          if (!q.required) return true; // 必須でない質問は常にOK
          const userAnswer = answers.find(a => a.question_id === q.id);
          // 回答が存在し、かつその回答が空文字列でないことを確認
          return userAnswer && userAnswer.answer.trim() !== '';
      });
      

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
      fetchProfile(); // ポイントの更新を反映させるためにプロファイルを再取得
      fetchSurveysAndResponses(); // 回答済みアンケートリストを更新
    } catch (error) {
      console.error('アンケート送信エラー:', error);
      alert('アンケートの送信に失敗しました。');
    }
  };

  // ★★★ ロード中またはエラー表示の統合 ★★★
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

  // グローバルなエラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500 mb-4">
            エラーが発生しました
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }
  // ★★★ ロード中またはエラー表示の統合ここまで ★★★


  if (selectedSurvey) {
    return (
      <React.Fragment> {/* ★★★ 全体をFragmentで囲むように修正 ★★★ */}
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
                                const currentAnswersArray = currentAnswer ? currentAnswer.split(',') : [];
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
      </React.Fragment> {/* Fragmentの閉じタグを追加 */}
    );
  }

  return (
    <React.Fragment> {/* ★★★ 全体をFragmentで囲むように修正 ★★★ */}
      <div className="min-h-screen bg-white relative overflow-hidden">
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

        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/80"></div>

        <div className="relative z-20">
          <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">
                    声キャン！
                  </h1>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setShowLineLinkModal(true)}
                    className="flex items-center px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    LINE連携
                  </button>
                  
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

          <main className={`mx-auto pb-20 ${
            activeTab === 'career_consultation' ? '' : 'max-w-7xl px-4 sm:px-6 lg:px-8 pt-8'
          }`}> 
            {activeTab !== 'career_consultation' && (
              <div
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 flex items-center space-x-4 cursor-pointer"
                onClick={() => setShowPointExchangeModal(true)} 
              >
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-4 flex items-center justify-center w-20 h-20 shadow-lg">
                  <Star className="w-10 h-10 text-white" />
                </div>
                <div>
                  <p className="text-gray-600 text-lg">獲得ポイント</p>
                  <p className="text-5xl font-bold text-orange-600"><span>{profile?.points || 0}</span></p>
                </div>
              </div>
            )}

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
                          className="border border-gray-200 rounded-xl p-6"
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
                          className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer group"
                          onClick={() => setSelectedAdvertisement(ad)} 
                        >
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
                                referrerpolicy="no-referrer" // ★★★ referrerpolicy を使用 ★★★
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  console.error(`画像読み込みエラー: ${ad.company_name}`, ad.image_url);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-200 flex items-center justify-center">
                              <Briefcase className="w-12 h-12 text-gray-500" />
                            </div>
                          )}
                          
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-800 mb-2">
                              {displayValue(ad.company_name) || '企業名未設定'}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {displayValue(ad.company_vision) || displayValue(ad.title) || displayValue(ad.description) || ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'career_consultation' && (
                <>
                  <div className="flex flex-col items-center w-full">
                      <img 
                          src="https://raw.githubusercontent.com/NSDKIT/koecan_v0/refs/heads/main/img/c8_top_v2.png"
                          alt="キャリア相談 上部"
                          className="w-full h-auto object-cover"
                      />
                      
                      <div className="relative w-full">
                          <img 
                              src="https://raw.githubusercontent.com/NSDKIT/koecan_v0/refs/heads/main/img/c8_middle_v2.png"
                              alt="キャリア相談 中部"
                              className="w-full h-auto object-cover"
                          />
                          
                          <div className="absolute inset-0 flex items-center justify-center">
                              <a
                                  href={C8_LINE_ADD_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex flex-col items-center"
                              >
                                  <span className="text-sm mb-1">キャリア支援のプロ</span>
                                  <span className="text-lg">シーエイトに相談</span>
                              </a>
                          </div>
                      </div>

                      <img 
                          src="https://raw.githubusercontent.com/NSDKIT/koecan_v0/refs/heads/main/img/c8_down_v2.png"
                          alt="キャリア相談 下部"
                          className="w-full h-auto object-cover"
                      />
                  </div>
                </>
              )}
            </div>
          </main>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
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
              キャリア診断
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
              onClick={() => setActiveTab('career_consultation')}
              className={`flex flex-col items-center justify-center w-full text-sm font-medium transition-colors ${
                activeTab === 'career_consultation' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
              }`}
            >
              <MessageCircle className="w-6 h-6 mb-1" />
              キャリア相談
            </button>
          </div>
        </div>

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

        {showPointExchangeModal && profile && (
          <PointExchangeModal
            currentPoints={profile.points}
            onClose={() => setShowPointExchangeModal(false)}
            onExchangeSuccess={fetchProfile}
          />
        )}

        {showProfileSurveyModal && (
          <MonitorProfileSurveyModal
            onClose={() => setShowProfileSurveyModal(false)}
            onSaveSuccess={() => { /* ... */ }}
          />
        )}
        
        {showLineLinkModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                    <div className="flex justify-end p-4">
                        <button onClick={() => setShowLineLinkModal(false)} className="text-gray-500 hover:text-gray-700">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <LineLinkButton /> 
                </div>
            </div>
        )}
      </React.Fragment> {/* Fragmentの閉じタグを追加 */}
    </React.Fragment>
  );
}
