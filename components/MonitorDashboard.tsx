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
  Menu, // ハンバーガーアイコン
  ExternalLink, // 外部リンクアイコン
  X, // 閉じるアイコン
  History, // 回答済みアンケートのアイコン
  FileText, // プロフィールアンケートのアイコン
  Briefcase, // 就職情報のアイコン
  ClipboardList // アンケートのアイコン
} from 'lucide-react';
import { ProfileModal } from '@/components/ProfileModal';
import { CareerConsultationModal } from '@/components/CareerConsultationModal';
import { ChatModal } from '@/components/ChatModal';
import { NotificationButton } from '@/components/NotificationButton';
import { SparklesCore } from '@/components/ui/sparkles';
import { PointExchangeModal } from '@/components/PointExchangeModal'; 
import { MonitorProfileSurveyModal } from '@/components/MonitorProfileSurveyModal'; 
import { MatchingFeature } from '@/components/MatchingFeature';

// アクティブなタブの型定義
type ActiveTab = 'surveys' | 'recruitment' | 'services' | 'matching';

// TODO: ここに、モニターがチャットしたいサポート担当者（例: zenryoku@gmail.com）の実際のユーザーIDを設定してください。
const SUPABASE_SUPPORT_USER_ID = 'e6f087a8-5494-450a-97ad-7d5003445e88';

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

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('monitor_profiles').select('*').eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      throw error;
    }
  };

  const fetchSurveysAndResponses = async (userId: string) => {
    try {
      const { data: allActiveSurveys, error: surveysError } = await supabase.from('surveys').select('*').eq('status', 'active').order('created_at', { ascending: false });
      if (surveysError) throw surveysError;

      const { data: userResponses, error: responsesError } = await supabase.from('responses').select('survey_id').eq('monitor_id', userId);
      if (responsesError) throw responsesError;

      const answeredSurveyIds = new Set(userResponses?.map(res => res.survey_id));
      const newAvailableSurveys = allActiveSurveys?.filter(survey => !answeredSurveyIds.has(survey.id)) || [];
      const newAnsweredSurveys = allActiveSurveys?.filter(survey => answeredSurveyIds.has(survey.id)) || [];

      setAvailableSurveys(newAvailableSurveys);
      setAnsweredSurveys(newAnsweredSurveys);
    } catch (error) {
      console.error('アンケートと回答の取得エラー:', error);
      throw error;
    }
  };

  const fetchAdvertisements = async () => {
    try {
      const { data, error } = await supabase.from('advertisements').select('*').eq('is_active', true).order('priority', { ascending: false });
      if (error) throw error;
      setAdvertisements(data || []);
    } catch (error) {
      console.error('広告取得エラー:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setDashboardDataLoading(false);
      return;
    }

    const loadAllDashboardData = async () => {
      setDashboardDataLoading(true);
      try {
        await Promise.all([
          fetchProfile(user.id),
          fetchSurveysAndResponses(user.id),
          fetchAdvertisements()
        ]);
      } catch (err) {
        console.error("ダッシュボードのデータ読み込みに失敗しました:", err);
      } finally {
        setDashboardDataLoading(false);
      }
    };
    
    loadAllDashboardData();
  }, [user, authLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)) {
        const menuElement = document.getElementById('hamburger-menu-dropdown');
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setIsMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSurveyClick = async (survey: Survey) => {
    if (!user) return;
    try {
      const { data: existingResponse } = await supabase.from('responses').select('id').eq('survey_id', survey.id).eq('monitor_id', user.id).single();
      if (existingResponse) {
        alert('このアンケートは既に回答済みです。');
        return;
      }
      const { data: questions, error } = await supabase.from('questions').select('*').eq('survey_id', survey.id).order('order_index');
      if (error) throw error;
      setSelectedSurvey(survey);
      setSurveyQuestions(questions || []);
      setAnswers(questions?.map(q => ({ question_id: q.id, answer: '' })) || []);
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
      const allRequiredAnswered = surveyQuestions.every(q => !q.required || answers.some(a => a.question_id === q.id && a.answer.trim() !== ''));
      if (!allRequiredAnswered) {
          alert('全ての必須質問に回答してください。');
          return;
      }
      const { error } = await supabase.from('responses').insert([{ survey_id: selectedSurvey.id, monitor_id: user.id, answers: answers, }]);
      if (error) throw error;
      alert(`アンケートを送信しました！${selectedSurvey.points_reward}ポイントを獲得しました。`);
      setSelectedSurvey(null);
      setSurveyQuestions([]);
      setAnswers([]);
      fetchProfile(user.id);
      fetchSurveysAndResponses(user.id);
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
              <button onClick={() => setSelectedSurvey(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <p className="text-gray-600 mb-6">{selectedSurvey.description}</p>
            <div className="space-y-6">
              {surveyQuestions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">{index + 1}. {question.question_text}{question.required && <span className="text-red-500 ml-1">*</span>}</h3>
                  {question.question_type === 'text' && (<textarea value={answers.find(a => a.question_id === question.id)?.answer || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" rows={3} placeholder="回答を入力してください"/>)}
                  {question.question_type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {question.options?.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center"><input type={question.is_multiple_select ? 'checkbox' : 'radio'} name={`question_${question.id}`} value={option} onChange={(e) => { const currentAnswer = answers.find(a => a.question_id === question.id)?.answer || ''; if (question.is_multiple_select) { const currentAnswers = currentAnswer ? currentAnswer.split(',') : []; if (e.target.checked) { handleAnswerChange(question.id, [...currentAnswers, option].join(',')); } else { handleAnswerChange(question.id, currentAnswers.filter(a => a !== option).join(',')); } } else { handleAnswerChange(question.id, option); } }} className="mr-2"/><span>{option}</span></label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={() => setSelectedSurvey(null)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">キャンセル</button>
              <button onClick={handleSurveySubmit} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">送信する（{selectedSurvey.points_reward}ポイント獲得）</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="w-full absolute inset-0 h-screen">
        <SparklesCore id="tsparticlesmonitor" background="transparent" minSize={0.6} maxSize={1.4} particleDensity={60} className="w-full h-full" particleColor="#F97316" speed={0.5}/>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/80"></div>
      <div className="relative z-20">
        <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center"><h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">声キャン！</h1><span className="ml-3 px-3 py-1 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 rounded-full text-sm font-medium">モニター</span></div>
              <div className="flex items-center space-x-4"><NotificationButton /><button ref={menuButtonRef} onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-orange-600 transition-colors"><Menu className="w-6 h-6" /></button></div>
            </div>
          </div>
        </header>
        {isMenuOpen && (
          <div id="hamburger-menu-dropdown" className="fixed right-4 top-16 mt-2 w-48 bg-white rounded-lg py-2 z-[1000] border border-gray-100" style={{ zIndex: 1000 }}>
            <button onClick={() => { setShowProfileModal(true); setIsMenuOpen(false); }} className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"><UserIcon className="w-5 h-5 mr-2" />プロフィール設定</button>
            <button onClick={() => { setShowProfileSurveyModal(true); setIsMenuOpen(false); }} className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"><FileText className="w-5 h-5 mr-2" />プロフィールアンケート</button>
            <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"><LogOut className="w-5 h-5 mr-2" />ログアウト</button>
          </div>
        )}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 flex items-center space-x-4 cursor-pointer" onClick={() => setShowPointExchangeModal(true)}>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-4 flex items-center justify-center w-20 h-20 shadow-lg"><Star className="w-10 h-10 text-white" /></div>
            <div><p className="text-gray-600 text-lg">獲得ポイント</p><p className="text-5xl font-bold text-orange-600">{profile?.points || 0}</p></div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8">
            {activeTab === 'surveys' && (
              <>
                {/* surveys content */}
              </>
            )}
            {activeTab === 'matching' && (<MatchingFeature />)}
            {activeTab === 'recruitment' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-0">
                {advertisements.length === 0 ? (<div className="text-center py-8"><p className="text-gray-600">現在、公開されている就職情報はありません。</p></div>) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {advertisements.map((ad) => (
                      <div key={ad.id} className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer group" onClick={() => setSelectedAdvertisement(ad)}>
                        {ad.image_url && (<div className="aspect-video bg-gray-100 overflow-hidden"><img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>)}
                        <div className="p-4"><h3 className="font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">{ad.title}</h3>{ad.description && (<p className="text-gray-600 text-sm line-clamp-2">{ad.description}</p>)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'services' && (
              <div className="grid md:grid-cols-2 gap-6">
                <button onClick={() => { setShowCareerModal(true); setIsMenuOpen(false); }} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-orange-100 group"><div className="flex items-center justify-start w-full"><div className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3 group-hover:scale-110 transition-transform w-12 h-12 mr-4 shrink-0"><MessageCircle className="w-6 h-6 text-white" /></div><div><h3 className="text-lg font-semibold text-gray-800">キャリア相談</h3><p className="text-gray-600 text-sm">専門カウンセラーに相談</p></div></div></button>
                <button onClick={() => { setShowChatModal(true); setIsMenuOpen(false); }} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-orange-100 group"><div className="flex items-center justify-start w-full"><div className="flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 group-hover:scale-110 transition-transform w-12 h-12 mr-4 shrink-0"><MessageCircle className="w-6 h-6 text-white" /></div><div><h3 className="text-lg font-semibold text-gray-800">チャット</h3><p className="text-gray-600 text-sm">リアルタイムでやり取り</p></div></div></button>
              </div>
            )}
          </div>
        </main>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="max-w-7xl mx-auto flex justify-around h-16">
          <button onClick={() => setActiveTab('surveys')} className={`flex flex-col items-center justify-center w-full text-sm font-medium transition-colors ${activeTab === 'surveys' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'}`}><ClipboardList className="w-6 h-6 mb-1" />アンケート</button>
          <button onClick={() => setActiveTab('matching')} className={`flex flex-col items-center justify-center w-full text-sm font-medium transition-colors ${activeTab === 'matching' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'}`}><Sparkles className="w-6 h-6 mb-1" />AIキャリア診断</button>
          <button onClick={() => setActiveTab('recruitment')} className={`flex flex-col items-center justify-center w-full text-sm font-medium transition-colors ${activeTab === 'recruitment' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'}`}><Briefcase className="w-6 h-6 mb-1" />就職情報</button>
          <button onClick={() => setActiveTab('services')} className={`flex flex-col items-center justify-center w-full text-sm font-medium transition-colors ${activeTab === 'services' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'}`}><MessageCircle className="w-6 h-6 mb-1" />サービス</button>
        </div>
      </div>
      
      {showProfileModal && user && (<ProfileModal user={user} profile={profile} onClose={() => setShowProfileModal(false)} onUpdate={() => fetchProfile(user.id)} />)}
      {showCareerModal && (<CareerConsultationModal onClose={() => setShowCareerModal(false)} />)}
      {showChatModal && user && SUPABASE_SUPPORT_USER_ID && (<ChatModal user={user} otherUserId={SUPABASE_SUPPORT_USER_ID} onClose={() => setShowChatModal(false)} />)}
      
      {selectedAdvertisement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex items-center"><h2 className="text-2xl font-bold text-gray-800">{selectedAdvertisement.title}</h2></div>
                <button onClick={() => setSelectedAdvertisement(null)} className="text-gray-500 hover:text-gray-700 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              {selectedAdvertisement.image_url && (<div className="mb-6 rounded-lg overflow-hidden aspect-video"><img src={selectedAdvertisement.image_url} alt={selectedAdvertisement.title} className="w-full h-full object-cover" /></div>)}
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">基本情報</h3>
              <dl className="mb-6 space-y-2 text-gray-700">
                {selectedAdvertisement.company_name && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">会社名:</dt><dd>{selectedAdvertisement.company_name}</dd></div> )}
                {selectedAdvertisement.location_info && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">所在地:</dt><dd>{selectedAdvertisement.location_info}</dd></div> )}
                {selectedAdvertisement.establishment_year && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">設立年:</dt><dd>{selectedAdvertisement.establishment_year}年</dd></div> )}
                {selectedAdvertisement.employee_count && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">従業員数:</dt><dd>{selectedAdvertisement.employee_count}名</dd></div> )}
                {selectedAdvertisement.employee_gender_ratio && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">男女比:</dt><dd>{selectedAdvertisement.employee_gender_ratio}</dd></div> )}
                {selectedAdvertisement.employee_age_composition && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">年齢構成比:</dt><dd>{selectedAdvertisement.employee_age_composition}</dd></div> )}
              </dl>
              {selectedAdvertisement.recommended_points && selectedAdvertisement.recommended_points.length > 0 && (<> <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">おすすめポイント</h3> <ul className="list-disc list-inside mb-6 space-y-1 text-gray-700">{selectedAdvertisement.recommended_points.map((point, index) => ( <li key={index}>{point}</li> ))}</ul> </>)}
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">仕事のリアル</h3>
              <dl className="mb-6 space-y-2 text-gray-700">
                {selectedAdvertisement.salary_info && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">給与・賞与:</dt><dd>{selectedAdvertisement.salary_info}</dd></div> )}
                {selectedAdvertisement.paid_leave_rate && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">有給取得率:</dt><dd>{selectedAdvertisement.paid_leave_rate}</dd></div> )}
                {selectedAdvertisement.long_holidays && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">長期休暇:</dt><dd>{selectedAdvertisement.long_holidays}</dd></div> )}
                {selectedAdvertisement.training_support && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">研修・成長支援:</dt><dd>{selectedAdvertisement.training_support}</dd></div> )}
                {selectedAdvertisement.busy_season_intensity && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">繁忙期の忙しさ:</dt><dd>{selectedAdvertisement.busy_season_intensity}</dd></div> )}
              </dl>
              {selectedAdvertisement.youtube_short_url && (<> <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">会社の雰囲気・文化</h3> <a href={selectedAdvertisement.youtube_short_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold mb-6">YouTubeショートを見る <ExternalLink className="w-4 h-4 ml-2" /></a></>)}
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">応募・選考</h3>
              <dl className="mb-6 space-y-2 text-gray-700">
                {selectedAdvertisement.recruitment_roles && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">募集職種・人数:</dt><dd style={{whiteSpace: 'pre-wrap'}}>{selectedAdvertisement.recruitment_roles}</dd></div> )}
                {selectedAdvertisement.application_qualifications && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">応募資格:</dt><dd style={{whiteSpace: 'pre-wrap'}}>{selectedAdvertisement.application_qualifications}</dd></div> )}
                {selectedAdvertisement.selection_flow && ( <div className="flex"><dt className="w-32 font-semibold shrink-0">選考フロー:</dt><dd style={{whiteSpace: 'pre-wrap'}}>{selectedAdvertisement.selection_flow}</dd></div> )}
              </dl>
              {selectedAdvertisement.link_url && (<a href={selectedAdvertisement.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">企業の詳細を見る <ExternalLink className="w-4 h-4 ml-2" /></a>)}
            </div>
          </div>
        </div>
      )}
      
      {showPointExchangeModal && profile && user && (<PointExchangeModal currentPoints={profile.points} onClose={() => setShowPointExchangeModal(false)} onExchangeSuccess={() => fetchProfile(user.id)} />)}
      {showProfileSurveyModal && (<MonitorProfileSurveyModal onClose={() => setShowProfileSurveyModal(false)} onSaveSuccess={() => {}} />)}
    </div>
  );
}
