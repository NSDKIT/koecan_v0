// koecan_v0-main/components/MonitorDashboard.tsx

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/config/supabase';
import { Survey, Question, Answer, User, MonitorProfile, Advertisement, Response as UserResponse, Quiz, QuizQuestion, QuizResponse } from '@/types'; 
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
  BarChart3,
  Brain
} from 'lucide-react';
import { ProfileModal } from '@/components/ProfileModal';
import { CareerConsultationModal } from '@/components/CareerConsultationModal';
import { ChatModal } from '@/components/ChatModal';
import { LineLinkButton } from '@/components/LineLinkButton';
import { SparklesCore } from '@/components/ui/sparkles';
import { PointExchangeModal } from '@/components/PointExchangeModal'; 
import { MonitorProfileSurveyModal } from '@/components/MonitorProfileSurveyModal'; 
import { PersonalityAssessmentModal } from '@/components/PersonalityAssessmentModal';
import { PersonalityTypeModal } from '@/components/PersonalityTypeModal';
import { CompanyPersonalityBreakdown } from '@/components/CompanyPersonalityBreakdown';
import { IndustryFilterModal } from '@/components/IndustryFilterModal';
import { PersonalityFilterModal } from '@/components/PersonalityFilterModal';
import { BulletinBoardDisplay } from '@/components/BulletinBoardDisplay';

type ActiveTab = 'surveys' | 'recruitment' | 'career_consultation' | 'bulletin_board';

const SUPABASE_SUPPORT_USER_ID = '39087559-d1da-4fd7-8ef9-4143de30d06d';
const C8_LINE_ADD_URL = 'https://lin.ee/f2zHhiB';

const formatBoolean = (val: boolean | null | undefined, yes: string = 'あり', no: string = 'なし') => {
    if (val === true) return yes;
    if (val === false) return no;
    return '';
};

const displayValue = (value: any): string => {
    if (value === null || value === undefined || value === 'N/A') return '';
    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '';
    }
    return String(value);
};

const getSecureImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=800&output=webp&q=85`;
    }
    
    return url;
};

export default function MonitorDashboard() {
  const { user, signOut, loading: authLoading } = useAuth(); 
  const [availableSurveys, setAvailableSurveys] = useState<Survey[]>([]); 
  const [answeredSurveys, setAnsweredSurveys] = useState<Survey[]>([]);   
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [answeredQuizzes, setAnsweredQuizzes] = useState<Quiz[]>([]);
  const [profile, setProfile] = useState<MonitorProfile | null>(null);
  const [dashboardDataLoading, setDashboardDataLoading] = useState(true); 
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Answer[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('bulletin_board');
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const menuButtonRef = useRef<HTMLButtonElement>(null); 

  const [selectedAdvertisement, setSelectedAdvertisement] = useState<Advertisement | null>(null);
  const [showPointExchangeModal, setShowPointExchangeModal] = useState(false);
  const [showProfileSurveyModal, setShowProfileSurveyModal] = useState(false); 
  const [showPersonalityAssessmentModal, setShowPersonalityAssessmentModal] = useState(false);
  const [showPersonalityTypeModal, setShowPersonalityTypeModal] = useState(false);
  const [personalityType, setPersonalityType] = useState<string | null>(null);
  const [showCompanyPersonalityTypeModal, setShowCompanyPersonalityTypeModal] = useState(false);
  const [companyPersonalityType, setCompanyPersonalityType] = useState<string | null>(null);
  const [showLineLinkModal, setShowLineLinkModal] = useState(false);
  const [companyDetailView, setCompanyDetailView] = useState<'info' | 'personality'>('info'); // 企業詳細の表示モード
  
  // フィルター関連のstate
  const [showIndustryFilter, setShowIndustryFilter] = useState(false);
  const [showPersonalityFilter, setShowPersonalityFilter] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedPersonalityTypes, setSelectedPersonalityTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMatchingSearch, setIsMatchingSearch] = useState(false);
  const [filteredAdvertisements, setFilteredAdvertisements] = useState<Advertisement[]>([]);

  const fetchProfile = useCallback(async () => {
    console.log("MonitorDashboard: fetchProfile started.");
    if (!user?.id) throw new Error("User ID is missing.");
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('monitor_profiles')
        .select('*') 
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // monitor_profilesテーブルから直接pointsを取得
      // トリガー（update_monitor_points_trigger）がpointsを更新するため、直接取得する
      const pointsBalance = profileData?.points || 0;
      
      const combinedProfile: MonitorProfile = {
          ...profileData, 
          points: pointsBalance, 
          monitor_id: profileData.id 
      } as MonitorProfile;

      setProfile(combinedProfile);

      console.log("MonitorDashboard: fetchProfile completed. Points: " + pointsBalance);
      return combinedProfile; 
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
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
  }, [user?.id]);

  // パーソナリティタイプを計算する関数
  const calculatePersonalityType = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('monitor_personality_responses')
        .select('category, answer')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        setPersonalityType(null);
        return;
      }

      // 各カテゴリーのスコアを合計
      const scores: Record<string, number> = {
        market_engagement: 0, // E vs I
        growth_strategy: 0,   // N vs S
        organization_style: 0,// P vs R
        decision_making: 0    // F vs O
      };

      data.forEach((response: { category: string; answer: number }) => {
        if (scores.hasOwnProperty(response.category)) {
          scores[response.category] += response.answer;
        }
      });

      // タイプコードを生成
      // 注意: スコアの符号とタイプの対応
      // マイナス → E, N, P, F / プラス → I, S, R, O
      let typeCode = '';
      // スコアが0の場合は両方の可能性を示す（例: "E/I"）
      if (scores.market_engagement < 0) {
        typeCode += 'E';
      } else if (scores.market_engagement > 0) {
        typeCode += 'I';
      } else {
        typeCode += 'E/I';
      }
      
      if (scores.growth_strategy < 0) {
        typeCode += 'N';
      } else if (scores.growth_strategy > 0) {
        typeCode += 'S';
      } else {
        typeCode += 'N/S';
      }
      
      if (scores.organization_style < 0) {
        typeCode += 'P';
      } else if (scores.organization_style > 0) {
        typeCode += 'R';
      } else {
        typeCode += 'P/R';
      }
      
      if (scores.decision_making < 0) {
        typeCode += 'F';
      } else if (scores.decision_making > 0) {
        typeCode += 'O';
      } else {
        typeCode += 'F/O';
      }

      setPersonalityType(typeCode);
    } catch (error) {
      console.error('パーソナリティタイプの計算エラー:', error);
      setPersonalityType(null);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSurveysAndResponses();
      fetchAdvertisements();
      calculatePersonalityType();
    }
  }, [user, fetchProfile, calculatePersonalityType]);

  // フィルター適用関数
  const applyFilters = useCallback(() => {
    let filtered = [...advertisements];

    // 業界フィルター
    if (selectedIndustries.length > 0) {
      filtered = filtered.filter(ad => {
        if (!ad.industries || !Array.isArray(ad.industries)) return false;
        return selectedIndustries.some(industry => 
          ad.industries!.some(adIndustry => adIndustry === industry)
        );
      });
    }

    // 価値観（パーソナリティタイプ）フィルター
    if (selectedPersonalityTypes.length > 0) {
      filtered = filtered.filter(ad => {
        const adPersonalityType = ad.personality_type;
        if (!adPersonalityType) return false;
        // タイプが完全一致するか、"/"を含む場合は部分一致もチェック
        return selectedPersonalityTypes.some(type => {
          if (adPersonalityType === type) return true;
          // "/"を含む場合（例: "E/ISRO"）は、各文字が一致するかチェック
          if (adPersonalityType.includes('/')) {
            const adTypeParts = adPersonalityType.split('');
            const typeParts = type.split('');
            // 4文字の各位置で一致または"/"を含むかチェック
            for (let i = 0; i < 4; i++) {
              if (adTypeParts[i] !== typeParts[i] && !adTypeParts[i].includes(typeParts[i])) {
                return false;
              }
            }
            return true;
          }
          return false;
        });
      });
    }

    // 検索クエリ
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ad => {
        const companyName = (ad.company_name || '').toLowerCase();
        const vision = (ad.company_vision || '').toLowerCase();
        const description = (ad.description || '').toLowerCase();
        return companyName.includes(query) || vision.includes(query) || description.includes(query);
      });
    }

    // マッチング検索（学生のパーソナリティタイプと企業のパーソナリティタイプをマッチング）
    if (isMatchingSearch && personalityType) {
      filtered = filtered.filter(ad => {
        const companyType = ad.personality_type;
        if (!companyType) return false;
        
        // 学生のタイプと企業のタイプを比較
        // "/"を含む場合は、共通する文字があればマッチ
        const studentType = personalityType;
        
        // 完全一致
        if (studentType === companyType) return true;
        
        // 部分一致（"/"を含む場合）
        const studentParts = studentType.split('');
        const companyParts = companyType.split('');
        
        // 4文字の各位置で一致するかチェック
        let matchCount = 0;
        for (let i = 0; i < 4; i++) {
          const studentChar = studentParts[i];
          const companyChar = companyParts[i];
          
          // 完全一致
          if (studentChar === companyChar) {
            matchCount++;
          }
          // "/"を含む場合の部分一致
          else if (studentChar.includes('/') || companyChar.includes('/')) {
            const studentOptions = studentChar.includes('/') ? studentChar.split('/') : [studentChar];
            const companyOptions = companyChar.includes('/') ? companyChar.split('/') : [companyChar];
            if (studentOptions.some(s => companyOptions.includes(s))) {
              matchCount++;
            }
          }
        }
        
        // 2文字以上一致すればマッチ
        return matchCount >= 2;
      });
    }

    setFilteredAdvertisements(filtered);
  }, [advertisements, selectedIndustries, selectedPersonalityTypes, searchQuery, isMatchingSearch, personalityType]);

  // フィルターが変更されたときに適用
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // advertisementsが読み込まれたときに初期化
  useEffect(() => {
    if (advertisements.length > 0) {
      applyFilters();
    }
  }, [advertisements.length]);

  // リアルタイムでmonitor_profilesのポイント更新を監視
  useEffect(() => {
    if (!user?.id) return;

    console.log('MonitorDashboard: リアルタイム購読を設定中... (user_id:', user.id, ')');
    
    const channel = supabase
      .channel(`monitor_profile_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'monitor_profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('MonitorDashboard: プロフィールが更新されました:', payload);
          console.log('MonitorDashboard: 更新前:', payload.old);
          console.log('MonitorDashboard: 更新後:', payload.new);
          const updatedProfile = payload.new;
          
          // ポイントが更新された場合、プロフィールを再取得
          if (updatedProfile && updatedProfile.points !== undefined) {
            const oldPoints = payload.old?.points || 0;
            const newPoints = updatedProfile.points || 0;
            console.log(`MonitorDashboard: ポイントが更新されました。${oldPoints} → ${newPoints}`);
            console.log('MonitorDashboard: プロフィールを再取得します。');
            fetchProfile();
          }
        }
      )
      .subscribe((status: string) => {
        console.log('MonitorDashboard: リアルタイム購読の状態:', status);
        if (status === 'SUBSCRIBED') {
          console.log('MonitorDashboard: リアルタイム購読が正常に開始されました');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('MonitorDashboard: リアルタイム購読でエラーが発生しました');
        }
      });

    // パーソナリティ診断のリアルタイム購読
    const personalityChannel = supabase
      .channel(`monitor_personality_responses_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE全て
          schema: 'public',
          table: 'monitor_personality_responses',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('MonitorDashboard: パーソナリティ診断の回答が更新されました:', payload);
          calculatePersonalityType(); // 回答が変更されたらタイプを再計算
        }
      )
      .subscribe((status: string) => {
        console.log('MonitorDashboard: パーソナリティ診断リアルタイム購読の状態:', status);
      });

    return () => {
      console.log('MonitorDashboard: リアルタイム購読を解除します。');
      supabase.removeChannel(channel);
      supabase.removeChannel(personalityChannel);
    };
  }, [user?.id, fetchProfile, calculatePersonalityType]);

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
      return { available: newAvailableSurveys, answered: newAnsweredSurveys };
    } catch (error) {
      console.error('アンケートと回答の取得エラー:', error);
      throw error;
    }
  };

  const fetchQuizzesAndResponses = async () => {
    console.log("MonitorDashboard: fetchQuizzesAndResponses started.");
    if (!user?.id) {
        console.error("fetchQuizzesAndResponses: User ID is not available.");
        throw new Error("User ID is not available.");
    }
    try {
      const { data: allActiveQuizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (quizzesError) {
        console.error('クイズ取得エラー:', quizzesError);
        throw quizzesError;
      }

      // 全問正解（score = 100）の回答のみを「回答済み」として扱う
      const { data: userQuizResponses, error: quizResponsesError } = await supabase
        .from('quiz_responses')
        .select('quiz_id, score')
        .eq('monitor_id', user.id)
        .eq('score', 100); // 全問正解のみ

      if (quizResponsesError) {
        console.error('クイズ回答履歴取得エラー:', quizResponsesError);
        throw quizResponsesError;
      }

      const answeredQuizIds = new Set(userQuizResponses?.map((res: {quiz_id: string}) => res.quiz_id));

      const newAvailableQuizzes: Quiz[] = [];
      const newAnsweredQuizzes: Quiz[] = [];

      allActiveQuizzes?.forEach((quiz: Quiz) => {
        if (answeredQuizIds.has(quiz.id)) {
          newAnsweredQuizzes.push(quiz);
        } else {
          newAvailableQuizzes.push(quiz);
        }
      });

      setAvailableQuizzes(newAvailableQuizzes);
      setAnsweredQuizzes(newAnsweredQuizzes);
      console.log("MonitorDashboard: fetchQuizzesAndResponses completed.");
      return { available: newAvailableQuizzes, answered: newAnsweredQuizzes };
    } catch (error) {
      console.error('クイズと回答の取得エラー:', error);
      throw error;
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
          fetchQuizzesAndResponses(),
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
      setSelectedQuiz(null); // クイズをクリア
      setSurveyQuestions(questions || []);
      setQuizQuestions([]); // クイズ質問をクリア
      setAnswers(questions?.map((q: Question) => ({ question_id: q.id, answer: '' })) || []);
      setQuizAnswers([]); // クイズ回答をクリア
    } catch (error) {
      console.error('アンケート質問の取得エラー:', error);
      alert('アンケートの読み込みに失敗しました。');
    }
  };

  const handleQuizClick = async (quiz: Quiz) => {
    try {
      // 全問正解（score = 100）の回答があるかチェック
      const { data: perfectResponse } = await supabase
        .from('quiz_responses')
        .select('id, score')
        .eq('quiz_id', quiz.id)
        .eq('monitor_id', user?.id)
        .eq('score', 100)
        .single();

      if (perfectResponse) {
        alert('このクイズは既に全問正解で回答済みです。');
        return;
      }

      const { data: questions, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index');

      if (error) throw error;

      setSelectedQuiz(quiz);
      setSelectedSurvey(null); // アンケートをクリア
      setQuizQuestions(questions || []);
      setSurveyQuestions([]); // アンケート質問をクリア
      setQuizAnswers(questions?.map((q: QuizQuestion) => ({ question_id: q.id, answer: '' })) || []);
      setAnswers([]); // アンケート回答をクリア
    } catch (error) {
      console.error('クイズ質問の取得エラー:', error);
      alert('クイズの読み込みに失敗しました。');
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => 
      prev.map(a => 
        a.question_id === questionId ? { ...a, answer } : a
      )
    );
  };

  const handleQuizAnswerChange = (questionId: string, answer: string) => {
    setQuizAnswers(prev => 
      prev.map(a => 
        a.question_id === questionId ? { ...a, answer } : a
      )
    );
  };

  const handleQuizSubmit = async () => {
    if (!selectedQuiz || !user) return;

    try {
      const allRequiredAnswered = quizQuestions.every(q => !q.required || quizAnswers.some(a => a.question_id === q.id && a.answer.trim() !== ''));

      if (!allRequiredAnswered) {
          alert('全ての必須質問に回答してください。');
          return;
      }

      // スコア計算（正答率）
      let correctCount = 0;
      let totalQuestions = 0;
      quizQuestions.forEach((q: QuizQuestion) => {
        if (q.correct_answer) {
          totalQuestions++;
          const userAnswer = quizAnswers.find(a => a.question_id === q.id)?.answer;
          if (userAnswer && userAnswer.trim() === q.correct_answer.trim()) {
            correctCount++;
          }
        }
      });
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : null;
      const isPerfect = score === 100;

      // 既存の回答がある場合は更新、ない場合は新規作成
      const { data: existingResponse } = await supabase
        .from('quiz_responses')
        .select('id')
        .eq('quiz_id', selectedQuiz.id)
        .eq('monitor_id', user.id)
        .single();

      let insertedResponse;
      if (existingResponse) {
        // 既存の回答を更新（再チャレンジ）
        const { data: updatedResponse, error: updateError } = await supabase
          .from('quiz_responses')
          .update({
            answers: quizAnswers,
            score: score,
            points_earned: isPerfect ? selectedQuiz.points_reward : 0,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingResponse.id)
          .select()
          .single();

        if (updateError) {
          console.error('クイズ回答の更新エラー:', updateError);
          throw updateError;
        }
        insertedResponse = updatedResponse;
      } else {
        // 新規作成
        const { data: newResponse, error: insertError } = await supabase
          .from('quiz_responses')
          .insert([
            {
              quiz_id: selectedQuiz.id,
              monitor_id: user.id,
              answers: quizAnswers,
              score: score,
              points_earned: isPerfect ? selectedQuiz.points_reward : 0,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error('クイズ回答の挿入エラー:', insertError);
          throw insertError;
        }
        insertedResponse = newResponse;
      }

      console.log('クイズ回答を保存しました:', insertedResponse);
      console.log('獲得ポイント:', insertedResponse?.points_earned);

      // メッセージを表示
      if (isPerfect) {
        alert(`🎉 全問正解です！${selectedQuiz.points_reward}ポイントを獲得しました！`);
      } else {
        alert(`正答率: ${score}%\n全問正解でないため、ポイントは付与されませんでした。\nもう一度チャレンジできます！`);
      }

      setSelectedQuiz(null);
      setQuizQuestions([]);
      setQuizAnswers([]);
      
      // プロフィールとクイズリストの再取得
      try {
        const pointsBefore = profile?.points || 0;
        let retryCount = 0;
        const maxRetries = 5;
        let pointsUpdated = false;
        
        while (retryCount < maxRetries && !pointsUpdated) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: currentProfile, error: profileError } = await supabase
            .from('monitor_profiles')
            .select('points')
            .eq('user_id', user.id)
            .single();
          
          if (!profileError && currentProfile) {
            const currentPoints = currentProfile.points || 0;
            
            if (currentPoints > pointsBefore) {
              pointsUpdated = true;
              await fetchProfile();
            }
          }
          
          retryCount++;
        }
        
        if (!pointsUpdated) {
          await fetchProfile();
        }
        
        await fetchQuizzesAndResponses();
      } catch (updateError) {
        console.warn('プロフィール再取得エラー（無視されます）:', updateError);
        try {
          await fetchProfile();
        } catch (e) {
          console.warn('プロフィール再取得の再試行も失敗:', e);
        }
      } 
    } catch (error: any) {
      console.error('クイズ送信エラー:', error);
      alert('クイズの送信に失敗しました。');
    }
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

      const { data: insertedResponse, error: insertError } = await supabase
        .from('responses')
        .insert([
          {
            survey_id: selectedSurvey.id,
            monitor_id: user.id,
            answers: answers,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('アンケート回答の挿入エラー:', insertError);
        throw insertError;
      }

      console.log('アンケート回答を挿入しました:', insertedResponse);
      console.log('獲得ポイント:', insertedResponse?.points_earned);

      // INSERTが成功したら、まず成功メッセージを表示
      alert(`アンケートを送信しました！${selectedSurvey.points_reward}ポイントを獲得しました。`);
      setSelectedSurvey(null);
      setSurveyQuestions([]);
      setAnswers([]);
      
      // プロフィールとアンケートリストの再取得は、エラーが発生してもユーザーには影響しないように
      // バックグラウンドで実行（エラーはログに記録するだけ）
      try {
        // トリガー（update_monitor_points_trigger）がポイントを更新するまで待機
        // 最大5回、1秒間隔でプロフィールを再取得してポイントが更新されるまで待つ
        const pointsBefore = profile?.points || 0;
        let retryCount = 0;
        const maxRetries = 5;
        let pointsUpdated = false;
        
        while (retryCount < maxRetries && !pointsUpdated) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: currentProfile, error: profileError } = await supabase
            .from('monitor_profiles')
            .select('points')
            .eq('user_id', user.id)
            .single();
          
          if (!profileError && currentProfile) {
            const currentPoints = currentProfile.points || 0;
            
            console.log(`再取得試行 ${retryCount + 1}: 現在のポイント=${currentPoints}, 以前のポイント=${pointsBefore}`);
            
            if (currentPoints > pointsBefore) {
              pointsUpdated = true;
              console.log('ポイントが更新されました！プロフィールを再取得します。');
              // プロフィールを再取得してUIを更新
              await fetchProfile();
            }
          }
          
          retryCount++;
        }
        
        if (!pointsUpdated) {
          console.warn('ポイントの更新が確認できませんでした。手動で再取得します。');
          // 最終的にプロフィールを再取得（トリガーが実行されていれば更新されているはず）
          await fetchProfile();
        }
        
        // アンケートリストを再取得
        await fetchSurveysAndResponses();
      } catch (updateError) {
        // 再取得のエラーはログに記録するだけ（INSERTは成功しているので、ユーザーには影響しない）
        console.warn('プロフィール再取得エラー（無視されます）:', updateError);
        // エラーが発生しても、念のためプロフィールを再取得を試みる
        try {
          await fetchProfile();
        } catch (e) {
          console.warn('プロフィール再取得の再試行も失敗:', e);
        }
      } 
    } catch (error: any) {
      console.error('アンケート送信エラー:', error);
      console.error('エラー詳細:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        status: error?.status,
        statusText: error?.statusText
      });
      
      // より詳細なエラーメッセージを表示
      let errorMessage = 'アンケートの送信に失敗しました。';
      if (error?.message) {
        errorMessage += `\n\nエラー: ${error.message}`;
      }
      if (error?.code) {
        errorMessage += `\nコード: ${error.code}`;
      }
      if (error?.hint) {
        errorMessage += `\nヒント: ${error.hint}`;
      }
      
      alert(errorMessage);
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
    );
  }

  if (selectedQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-800">{selectedQuiz.title}</h1>
              </div>
              <button
                onClick={() => setSelectedQuiz(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-6">{selectedQuiz.description}</p>

            <div className="space-y-6">
              {quizQuestions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    {index + 1}. {question.question_text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>

                  {question.question_type === 'text' && (
                    <textarea
                      value={quizAnswers.find(a => a.question_id === question.id)?.answer || ''}
                      onChange={(e) => handleQuizAnswerChange(question.id, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                            name={`quiz_question_${question.id}`}
                            value={option}
                            onChange={(e) => {
                              const currentAnswer = quizAnswers.find(a => a.question_id === question.id)?.answer || '';
                              if (question.is_multiple_select) {
                                const currentAnswersArray = currentAnswer ? currentAnswer.split(',') : [];
                                if (e.target.checked) {
                                  handleQuizAnswerChange(question.id, [...currentAnswersArray, option].join(','));
                                } else {
                                  handleQuizAnswerChange(question.id, currentAnswersArray.filter(a => a !== option).join(','));
                                }
                              } else {
                                handleQuizAnswerChange(question.id, option);
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
                          onClick={() => handleQuizAnswerChange(question.id, rating.toString())}
                          className={`w-10 h-10 rounded-full border-2 ${
                            quizAnswers.find(a => a.question_id === question.id)?.answer === rating.toString()
                              ? 'border-purple-500 bg-purple-500 text-white'
                              : 'border-gray-300 hover:border-purple-300'
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
                          name={`quiz_question_${question.id}`}
                          value="はい"
                          onChange={(e) => handleQuizAnswerChange(question.id, e.target.value)}
                          className="mr-2"
                        />
                        <span>はい</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`quiz_question_${question.id}`}
                          value="いいえ"
                          onChange={(e) => handleQuizAnswerChange(question.id, e.target.value)}
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
                onClick={() => setSelectedQuiz(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleQuizSubmit}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                送信する（{selectedQuiz.points_reward}ポイント獲得）
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
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
                setShowPersonalityAssessmentModal(true); 
                setIsMenuOpen(false);
              }}
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <BarChart3 className="w-5 h-5 mr-2" /> 
              パーソナリティ診断
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 flex items-center justify-between space-x-6">
              {/* 獲得ポイント */}
            <div
                className="flex items-center space-x-4 cursor-pointer flex-1"
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
              
              {/* パーソナリティタイプ表示とキャラクター動画 */}
              {personalityType && (
                <div className="flex items-center flex-1">
                  <div 
                    className="flex items-center space-x-4 cursor-pointer"
                    onClick={() => setShowPersonalityTypeModal(true)}
                  >
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-4 flex items-center justify-center w-20 h-20 shadow-lg">
                      <Brain className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-lg">パーソナリティタイプ</p>
                      <p className="text-5xl font-bold text-purple-600">{personalityType}</p>
                    </div>
                  </div>
                  {(() => {
                    // "/"を含む場合は最初の4文字のタイプを使用
                    let videoType = personalityType;
                    if (personalityType.includes('/')) {
                      // "/"を含む場合は、最初の4文字のタイプを生成
                      // 例: "E/ISRO" -> "E" + "I" + "S" + "R" = "EISR" (最初の4文字)
                      const parts = personalityType.replace(/\//g, '').substring(0, 4);
                      if (parts.length === 4) {
                        videoType = parts;
                      } else {
                        return null; // 4文字未満の場合は表示しない
                      }
                    }
                    // 4文字のタイプのみ動画を表示
                    if (videoType.length === 4) {
                      return (
                        <div className="ml-0">
                          <video
                            src={`/character/${videoType}.mp4`}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
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
                {/* アンケートとクイズを一緒に表示 */}
                {(availableSurveys.length === 0 && availableQuizzes.length === 0) ? (
                  <div className="text-center py-12 mb-8">
                    <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">現在利用可能な<br></br>アンケート・クイズはありません</h3>
                    <p className="text-gray-600">新しいアンケート・クイズに回答して<br></br>ポイントを獲得しましょう。</p>
                  </div>
                ) : (
                  <div className="grid gap-6 mb-8">
                    {/* アンケート */}
                    {availableSurveys.map((survey) => (
                      <div
                        key={survey.id}
                        className="border border-gray-200 rounded-xl p-6"
                      >
                        <div className="flex flex-col md:flex-row items-start justify-between">
                          <div className="flex-1 mb-4 md:mb-0">
                            <div className="flex items-center mb-2">
                              <FileText className="w-5 h-5 mr-2 text-blue-600" />
                              <h3 className="text-xl font-semibold text-gray-800">
                              {survey.title}
                            </h3>
                            </div>
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
                    {/* クイズ */}
                    {availableQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="border border-gray-200 rounded-xl p-6 bg-gradient-to-r from-purple-50 to-pink-50"
                      >
                        <div className="flex flex-col md:flex-row items-start justify-between">
                          <div className="flex-1 mb-4 md:mb-0">
                            <div className="flex items-center mb-2">
                              <Trophy className="w-5 h-5 mr-2 text-purple-600" />
                              <h3 className="text-xl font-semibold text-gray-800">
                                {quiz.title}
                              </h3>
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-2">{quiz.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                <span>対象者: 学生</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>質問数: {quizQuestions.length > 0 ? quizQuestions.length : 5}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center md:items-end space-y-3 md:ml-6">
                            <div className="flex items-center bg-purple-50 rounded-full px-4 py-2 text-purple-700 font-semibold text-lg">
                              <Gift className="w-5 h-5 mr-2" />
                              <span>{quiz.points_reward}pt</span>
                            </div>
                            <button
                              onClick={() => handleQuizClick(quiz)}
                              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-base font-semibold"
                            >
                              回答する
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-t pt-8">回答済みアンケート・クイズ</h2>
                {(answeredSurveys.length === 0 && answeredQuizzes.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <History className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">まだ回答したアンケート・クイズはありません</h3>
                    <p className="text-gray-600">新しいアンケート・クイズに回答してポイントを獲得しましょう。</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {/* 回答済みアンケート */}
                    {answeredSurveys.map((survey) => (
                      <div
                        key={survey.id}
                        className="border border-gray-200 rounded-xl p-6 bg-gray-50 opacity-80" 
                      >
                        <div className="flex flex-col md:flex-row items-start justify-between">
                          <div className="flex-1 mb-4 md:mb-0">
                            <div className="flex items-center mb-2">
                              <FileText className="w-5 h-5 mr-2 text-blue-600" />
                              <h3 className="text-xl font-semibold text-gray-700">
                              {survey.title}
                            </h3>
                            </div>
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
                    {/* 回答済みクイズ */}
                    {answeredQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="border border-gray-200 rounded-xl p-6 bg-gray-50 opacity-80" 
                      >
                        <div className="flex flex-col md:flex-row items-start justify-between">
                          <div className="flex-1 mb-4 md:mb-0">
                            <div className="flex items-center mb-2">
                              <Trophy className="w-5 h-5 mr-2 text-purple-600" />
                              <h3 className="text-xl font-semibold text-gray-700">
                                {quiz.title}
                              </h3>
                            </div>
                            <p className="text-gray-500 mb-4 line-clamp-2">{quiz.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                <span>対象者: 学生</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>質問数: {quizQuestions.length > 0 ? quizQuestions.length : 5}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center md:items-end space-y-3 md:ml-6">
                            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 text-gray-600 font-semibold text-lg">
                              <Gift className="w-5 h-5 mr-2" />
                              <span>{quiz.points_reward}pt 獲得済み</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
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

            {activeTab === 'recruitment' && ( 
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-0">
                {/* フィルターセクション */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {/* 業界選択ボタン */}
                    <button
                      onClick={() => setShowIndustryFilter(true)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center ${
                        selectedIndustries.length > 0
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <Building className="w-4 h-4 mr-2" />
                      業界を選択する
                      {selectedIndustries.length > 0 && (
                        <span className="ml-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
                          {selectedIndustries.length}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>

                    {/* 価値観選択ボタン */}
                    <button
                      onClick={() => setShowPersonalityFilter(true)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center ${
                        selectedPersonalityTypes.length > 0
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      価値観を選択する
                      {selectedPersonalityTypes.length > 0 && (
                        <span className="ml-2 bg-purple-500 text-white rounded-full px-2 py-0.5 text-xs">
                          {selectedPersonalityTypes.length}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>

                    {/* 検索ボタン */}
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="企業名や説明で検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* マッチング検索ボタン */}
                    <button
                      onClick={() => setIsMatchingSearch(!isMatchingSearch)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center ${
                        isMatchingSearch
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                      disabled={!personalityType}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      マッチング検索
                    </button>
                  </div>

                  {/* フィルター表示 */}
                  {(selectedIndustries.length > 0 || selectedPersonalityTypes.length > 0 || searchQuery || isMatchingSearch) && (
                    <div className="flex flex-wrap gap-2">
                      {selectedIndustries.map((industry) => (
                        <span
                          key={industry}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {industry}
                          <button
                            onClick={() => setSelectedIndustries(prev => prev.filter(i => i !== industry))}
                            className="ml-2 hover:text-blue-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {selectedPersonalityTypes.map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          {type}
                          <button
                            onClick={() => setSelectedPersonalityTypes(prev => prev.filter(t => t !== type))}
                            className="ml-2 hover:text-purple-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {searchQuery && (
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          「{searchQuery}」
                          <button
                            onClick={() => setSearchQuery('')}
                            className="ml-2 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {isMatchingSearch && (
                        <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                          マッチング検索
                          <button
                            onClick={() => setIsMatchingSearch(false)}
                            className="ml-2 hover:text-orange-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedIndustries([]);
                          setSelectedPersonalityTypes([]);
                          setSearchQuery('');
                          setIsMatchingSearch(false);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                      >
                        すべてクリア
                      </button>
                    </div>
                  )}
                </div>

                {/* 企業一覧 */}
                {filteredAdvertisements.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      {advertisements.length === 0
                        ? '現在、公開されている企業情報はありません。'
                        : '条件に一致する企業が見つかりませんでした。'}
                    </p>
                  </div>
                ) : (
                  <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                      {filteredAdvertisements.length}件の企業が見つかりました
                    </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredAdvertisements.map((ad) => (
                      <div
                        key={ad.id}
                        className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer group"
                        onClick={() => {
                          setSelectedAdvertisement(ad);
                          setCompanyDetailView('info'); // 企業を選択した際に「企業情報」タブを表示
                        }} 
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
                              referrerPolicy="no-referrer"
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
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-800">
                            {displayValue(ad.company_name) || '企業名未設定'}
                          </h3>
                            {ad.personality_type && (
                              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                                {ad.personality_type}
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {displayValue(ad.company_vision) || displayValue(ad.title) || displayValue(ad.description) || ''}
                          </p>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bulletin_board' && (
              <BulletinBoardDisplay />
            )}
          </div>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="max-w-7xl mx-auto flex justify-around h-20">
          <button
            onClick={() => setActiveTab('bulletin_board')}
            className={`flex flex-col items-center justify-center w-full text-sm font-medium transition-colors ${
              activeTab === 'bulletin_board' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <MessageCircle className="w-6 h-6 mb-1" />
            掲示板
          </button>
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

      {selectedAdvertisement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            
            <div className="relative">
              <button
                onClick={() => {
                  setSelectedAdvertisement(null);
                  setCompanyDetailView('info'); // モーダルを閉じる際に表示モードをリセット
                }}
                className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 text-gray-600 hover:text-gray-800"
              >
                <X className="w-6 h-6" />
              </button>

              {/* ヘッダー - 白背景にオレンジテキスト */}
              <div className="bg-white rounded-t-3xl p-8 pb-6">
                <h2 className="text-4xl font-bold text-orange-600 mb-6">{displayValue(selectedAdvertisement.company_name) || '企業名未設定'}</h2>
                
                {/* タブ切り替えボタン */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setCompanyDetailView('info')}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                      companyDetailView === 'info'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    企業情報
                  </button>
                  <button
                    onClick={() => setCompanyDetailView('personality')}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                      companyDetailView === 'personality'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    現場の価値観
                  </button>
                </div>
              </div>

              {selectedAdvertisement.image_url && getSecureImageUrl(selectedAdvertisement.image_url) && (
                <div className="px-8 pt-6 relative z-10">
                  <div className="bg-white rounded-2xl overflow-hidden h-96 border-4 border-white">
                    <img
                      src={getSecureImageUrl(selectedAdvertisement.image_url) || undefined}
                      alt={displayValue(selectedAdvertisement.company_name) || '企業画像'}
                      className="w-auto h-full object-cover mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* 企業情報タブの内容 */}
                {companyDetailView === 'info' && (
                  <>
                {displayValue(selectedAdvertisement.company_vision) && (
                  <div className="mb-8">
                    <div className="bg-orange-50 rounded-2xl p-6 border-l-4 border-orange-500">
                      <div className="flex items-start mb-2">
                        <Sparkles className="w-6 h-6 text-orange-600 mr-2 flex-shrink-0 mt-1" />
                        <h3 className="text-lg font-bold text-orange-600">目指す未来</h3>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed pl-8">{displayValue(selectedAdvertisement.company_vision)}</p>
                    </div>
                  </div>
                )}
              
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Building className="w-6 h-6 text-orange-600 mr-2" />
                    <h3 className="text-2xl font-bold text-gray-800">企業概要</h3>
                  </div>
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700 w-1/3">代表者名</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.representative_name)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">設立年</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.establishment_year)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">所在地（本社）</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.headquarters_location)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">所在地（支社）</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.branch_office_location)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">従業員数</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.employee_count)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">男女比</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.employee_gender_ratio)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">平均年齢</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.employee_avg_age)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">業界</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.industries)}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 bg-orange-50 font-semibold text-orange-700">イチオシポイント</td>
                          <td className="px-6 py-4 text-orange-800 font-medium">
                            {[
                              displayValue(selectedAdvertisement.highlight_point_1),
                              displayValue(selectedAdvertisement.highlight_point_2),
                              displayValue(selectedAdvertisement.highlight_point_3)
                            ].filter(Boolean).join(' / ') || ''}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <DollarSign className="w-6 h-6 text-orange-600 mr-2" />
                    <h3 className="text-2xl font-bold text-gray-800">募集・待遇情報</h3>
                  </div>
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700 w-1/3">初任給</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.starting_salary)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">3年定着率</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.three_year_retention_rate)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">20代平均年収</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.avg_annual_income_20s)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">30代平均年収</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.avg_annual_income_30s)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">キャリアパス</td>
                          <td className="px-6 py-4 text-gray-700 whitespace-pre-wrap">{displayValue(selectedAdvertisement.promotion_model_case)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">募集職種とその人数</td>
                          <td className="px-6 py-4 text-gray-700 whitespace-pre-wrap">{displayValue(selectedAdvertisement.recruitment_roles_count)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">選考フロー</td>
                          <td className="px-6 py-4 text-gray-700">
                            {selectedAdvertisement.selection_flow_steps && selectedAdvertisement.selection_flow_steps.length > 0 
                              ? selectedAdvertisement.selection_flow_steps.join(' → ') 
                              : ''}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">必須資格・免許</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.required_qualifications)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Sparkles className="w-6 h-6 text-orange-600 mr-2" />
                    <h3 className="text-2xl font-bold text-gray-800">働き方・福利厚生</h3>
                  </div>
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700 w-1/3">勤務時間</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.working_hours)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">休日</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.holidays)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">年間休日数</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.annual_holidays)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">リモートワーク</td>
                          <td className="px-6 py-4 text-gray-700">{formatBoolean(selectedAdvertisement.remote_work_available)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">副業</td>
                          <td className="px-6 py-4 text-gray-700">{formatBoolean(selectedAdvertisement.side_job_allowed)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">住宅手当</td>
                          <td className="px-6 py-4 text-gray-700">{formatBoolean(selectedAdvertisement.housing_allowance_available)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">女性育休取得率</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.female_parental_leave_rate)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">男性育休取得率</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.male_parental_leave_rate)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">異動/転勤</td>
                          <td className="px-6 py-4 text-gray-700">
                            {formatBoolean(selectedAdvertisement.transfer_existence)}
                            {displayValue(selectedAdvertisement.transfer_frequency) && ` (${displayValue(selectedAdvertisement.transfer_frequency)})`}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">社内イベント頻度</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.internal_event_frequency)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">健康経営の取り組み</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.health_management_practices)}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 bg-orange-50 font-semibold text-orange-700">イチオシ福利厚生</td>
                          <td className="px-6 py-4 text-gray-700 whitespace-pre-wrap">{displayValue(selectedAdvertisement.must_tell_welfare)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Users className="w-6 h-6 text-orange-600 mr-2" />
                    <h3 className="text-2xl font-bold text-gray-800">採用情報</h3>
                  </div>
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700 w-1/3">採用担当部署（担当者）</td>
                          <td className="px-6 py-4 text-gray-700 whitespace-pre-wrap">{displayValue(selectedAdvertisement.recruitment_department)}</td>
                        </tr>
                        <tr className={selectedAdvertisement.recruitment_info_page_url ? "border-b border-gray-200" : ""}>
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">採用に関する問い合わせ先</td>
                          <td className="px-6 py-4 text-gray-700 whitespace-pre-wrap">{displayValue(selectedAdvertisement.recruitment_contact)}</td>
                        </tr>
                        {selectedAdvertisement.recruitment_info_page_url && (
                          <tr>
                            <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">採用情報ページ</td>
                            <td className="px-6 py-4">
                              <a 
                                href={selectedAdvertisement.recruitment_info_page_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold"
                              >
                                採用情報ページを見る
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Target className="w-6 h-6 text-orange-600 mr-2" />
                    <h3 className="text-2xl font-bold text-gray-800">インターンシップ情報</h3>
                  </div>
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700 w-1/3">実施予定</td>
                          <td className="px-6 py-4 text-gray-700">{formatBoolean(selectedAdvertisement.internship_scheduled, '実施予定あり', '実施予定なし')}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">実施日程</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.internship_schedule)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">定員</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.internship_capacity)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">対象学生</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.internship_target_students)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">実施場所</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.internship_locations)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">内容</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.internship_content_types)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">報酬</td>
                          <td className="px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.internship_paid_unpaid)}</td>
                        </tr>
                        <tr className={selectedAdvertisement.internship_application_url ? "border-b border-gray-200" : ""}>
                          <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">交通費・宿泊費</td>
                          <td className="px-6 py-4 text-gray-700">{formatBoolean(selectedAdvertisement.transport_lodging_stipend, '支給あり', '支給なし')}</td>
                        </tr>
                        {selectedAdvertisement.internship_application_url && (
                          <tr>
                            <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700">申込</td>
                            <td className="px-6 py-4">
                              <a 
                                href={selectedAdvertisement.internship_application_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold"
                              >
                                インターンシップに申し込む
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <MessageCircle className="w-6 h-6 text-orange-600 mr-2" />
                    <h3 className="text-2xl font-bold text-gray-800">SNS・外部リンク</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="flex flex-wrap gap-3">
                      {selectedAdvertisement.official_website_url && (
                        <a 
                          href={selectedAdvertisement.official_website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-5 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-all shadow-md hover:shadow-lg transform hover:scale-105 font-semibold text-sm"
                        >
                          🌐 公式ホームページ
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      )}
                      {selectedAdvertisement.official_line_url && (
                        <a 
                          href={selectedAdvertisement.official_line_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-5 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all shadow-md hover:shadow-lg transform hover:scale-105 font-semibold text-sm"
                        >
                          💬 公式LINE
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      )}
                      {selectedAdvertisement.instagram_url && (
                        <a 
                          href={selectedAdvertisement.instagram_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-all shadow-md hover:shadow-lg transform hover:scale-105 font-semibold text-sm"
                        >
                          📸 Instagram
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      )}
                      {selectedAdvertisement.tiktok_url && (
                        <a 
                          href={selectedAdvertisement.tiktok_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-5 py-3 bg-gray-800 hover:bg-black text-white rounded-full transition-all shadow-md hover:shadow-lg transform hover:scale-105 font-semibold text-sm"
                        >
                          🎵 TikTok
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      )}
                      {displayValue(selectedAdvertisement.other_sns_sites) && (
                        <div className="w-full mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="font-semibold text-gray-700 mb-2 flex items-center">
                            🔗 その他のリンク
                          </p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{displayValue(selectedAdvertisement.other_sns_sites)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                  </>
                )}

                {/* 現場の価値観タブの内容（パーソナリティ診断結果） */}
                {companyDetailView === 'personality' && (
                  <div className="mb-8">
                    {selectedAdvertisement.personality_type ? (
                      <div className="bg-white rounded-2xl p-6 border border-gray-200">
                        <CompanyPersonalityBreakdown companyId={selectedAdvertisement.id} />
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-2xl p-8 text-center">
                        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">この企業のパーソナリティ診断結果はまだ登録されていません</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
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

      {showPersonalityAssessmentModal && (
        <PersonalityAssessmentModal
          onClose={() => setShowPersonalityAssessmentModal(false)}
          onSaveSuccess={calculatePersonalityType}
        />
      )}

      {personalityType && showPersonalityTypeModal && (
        <PersonalityTypeModal
          type={personalityType}
          onClose={() => setShowPersonalityTypeModal(false)}
        />
      )}

      {companyPersonalityType && showCompanyPersonalityTypeModal && (
        <PersonalityTypeModal
          type={companyPersonalityType}
          onClose={() => {
            setShowCompanyPersonalityTypeModal(false);
            setCompanyPersonalityType(null);
          }}
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

      {/* フィルターモーダル */}
      {showIndustryFilter && (
        <IndustryFilterModal
          selectedIndustries={selectedIndustries}
          onClose={() => setShowIndustryFilter(false)}
          onApply={(industries) => {
            setSelectedIndustries(industries);
            setShowIndustryFilter(false);
          }}
        />
      )}

      {showPersonalityFilter && (
        <PersonalityFilterModal
          selectedTypes={selectedPersonalityTypes}
          onClose={() => setShowPersonalityFilter(false)}
          onApply={(types) => {
            setSelectedPersonalityTypes(types);
            setShowPersonalityFilter(false);
          }}
        />
      )}
    </div>
  );
}
