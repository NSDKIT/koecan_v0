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
import { JobTypeFilterModal } from '@/components/JobTypeFilterModal';
import { BulletinBoardDisplay } from '@/components/BulletinBoardDisplay';

type ActiveTab = 'surveys' | 'recruitment' | 'career_consultation' | 'bulletin_board';

// 各タブごとのキャラクターのセリフ
const CHARACTER_MESSAGES: Record<ActiveTab, string[]> = {
  surveys: [
    'アンケートに答えてポイントをゲットしよう！',
    '新しいアンケートが追加されたよ！',
    'クイズに挑戦して知識を深めよう！',
    '回答するとポイントがもらえるよ♪',
    '今日もアンケートに答えてみよう！',
    'クイズで高得点を目指そう！',
    'アンケートで意見を聞かせてね',
    'ポイントを貯めて交換しよう！',
    '新しいクイズに挑戦してみて！',
    'アンケートに答えるとポイントがもらえるよ',
    'クイズで全問正解を目指そう！',
    'たくさんアンケートに答えてみよう',
    'ポイントを貯めると交換できるよ',
    'アンケートで社会に貢献しよう！',
    'クイズで自分の知識を試そう',
    '新しいアンケートをチェックしてね',
    '回答済みのアンケートも確認できるよ',
    'クイズで楽しく学ぼう！',
    'アンケートに答えてみんなの役に立とう',
    'ポイントを貯めてギフトと交換しよう',
    'クイズで高得点を取ろう！',
    'アンケートで意見を伝えよう',
    '新しいクイズが追加されたよ',
    'アンケートに答えるとポイントがもらえる',
    'クイズで知識を深めよう！',
    'たくさんのアンケートに答えてみて',
    'ポイントを貯めて交換できるよ♪',
    'クイズで全問正解を目指そう！',
    'アンケートで社会に貢献できるよ',
    '新しいアンケートをチェックしてみて'
  ],
  recruitment: [
    '気になる企業を探してみよう！',
    '業界や価値観で絞り込めるよ',
    'マッチング検索で自分に合う企業を見つけよう',
    '企業の情報を詳しく見てみてね',
    '業種で検索すると見つけやすいよ',
    '目指す未来を確認してみよう',
    'パーソナリティタイプで検索できるよ',
    '気になる企業の詳細を見てみて',
    'フィルターを使って企業を探そう',
    'マッチング検索で自分に合う企業を発見！',
    '業界を選んで企業を絞り込もう',
    '価値観で企業を検索してみて',
    '企業の情報をチェックしてみよう',
    '業種で企業を探すと便利だよ',
    '目指す未来から企業を選ぼう',
    'パーソナリティタイプでマッチング！',
    '気になる企業の詳細を確認してね',
    'フィルターを組み合わせて検索しよう',
    'マッチング検索で理想の企業を見つけよう',
    '業界を選択して企業を探してみて',
    '価値観で企業を絞り込めるよ',
    '企業の情報を詳しく見てみよう',
    '業種で検索すると見つけやすい',
    '目指す未来を確認してみてね',
    'パーソナリティタイプで検索できる',
    '気になる企業の詳細を見てみよう',
    'フィルターを使って企業を探してみて',
    'マッチング検索で自分に合う企業を発見しよう',
    '業界を選んで企業を絞り込んでみて',
    '価値観で企業を検索してみよう'
  ],
  career_consultation: [
    'キャリアの悩みを相談してみよう！',
    'シーエイトに相談すると解決できるよ',
    'キャリア支援のプロがサポートしてくれる',
    '相談してみると道が開けるかも',
    'キャリアの悩みは一人で抱え込まないで',
    'シーエイトに相談してみてね',
    'キャリア支援のプロが助けてくれるよ',
    '相談すると新しい視点が得られるかも',
    'キャリアの悩みを一緒に考えよう',
    'シーエイトに相談してみよう',
    'キャリア支援のプロがサポートしてくれるよ',
    '相談してみると解決策が見つかるかも',
    'キャリアの悩みは相談してみて',
    'シーエイトに相談するとアドバイスがもらえる',
    'キャリア支援のプロが手助けしてくれる',
    '相談してみると道が開けるよ',
    'キャリアの悩みを一緒に解決しよう',
    'シーエイトに相談してみてね',
    'キャリア支援のプロがサポートしてくれる',
    '相談すると新しい視点が得られる',
    'キャリアの悩みを相談してみよう',
    'シーエイトに相談すると解決できる',
    'キャリア支援のプロが助けてくれる',
    '相談してみると解決策が見つかる',
    'キャリアの悩みは一人で抱え込まないでね',
    'シーエイトに相談してみよう',
    'キャリア支援のプロが手助けしてくれるよ',
    '相談してみると道が開けるかも',
    'キャリアの悩みを一緒に考えてみよう',
    'シーエイトに相談するとアドバイスがもらえるよ'
  ],
  bulletin_board: [
    '掲示板で最新情報をチェックしよう！',
    '新しいお知らせがあるか確認してみて',
    '掲示板で重要な情報を見逃さないでね',
    'お知らせをチェックしてみよう',
    '掲示板で最新の情報を確認して',
    '新しいお知らせが追加されたかも',
    '掲示板で重要な情報をチェックしよう',
    'お知らせを見て最新情報をゲット！',
    '掲示板で情報を確認してみてね',
    '新しいお知らせがあるか見てみよう',
    '掲示板で最新情報をチェックしてみて',
    'お知らせを確認して情報をゲットしよう',
    '掲示板で重要な情報を見逃さないで',
    '新しいお知らせが追加されたか確認して',
    '掲示板で最新の情報をチェックしてみよう',
    'お知らせを見て最新情報をゲットしてみて',
    '掲示板で情報を確認しよう',
    '新しいお知らせがあるかチェックしてね',
    '掲示板で最新情報を確認してみて',
    'お知らせをチェックして情報をゲット！',
    '掲示板で重要な情報を見逃さないでね',
    '新しいお知らせが追加されたか見てみよう',
    '掲示板で最新の情報をチェックして',
    'お知らせを見て最新情報をゲットしてみよう',
    '掲示板で情報を確認してみて',
    '新しいお知らせがあるか確認してみよう',
    '掲示板で最新情報をチェックしてね',
    'お知らせを確認して情報をゲットしてみて',
    '掲示板で重要な情報を見逃さないで',
    '新しいお知らせが追加されたかチェックしよう'
  ]
};

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
  const [isLineLinked, setIsLineLinked] = useState<boolean>(false);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [companyDetailView, setCompanyDetailView] = useState<'info' | 'personality'>('info'); // 企業詳細の表示モード
  const [showQuizAnswersModal, setShowQuizAnswersModal] = useState(false);
  const [quizForAnswers, setQuizForAnswers] = useState<Quiz | null>(null);
  const [quizAnswersQuestions, setQuizAnswersQuestions] = useState<QuizQuestion[]>([]);
  const [showPerfectScoreMessage, setShowPerfectScoreMessage] = useState(false);
  
  // フィルター関連のstate
  const [showIndustryFilter, setShowIndustryFilter] = useState(false);
  const [showPersonalityFilter, setShowPersonalityFilter] = useState(false);
  const [showJobTypeFilter, setShowJobTypeFilter] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedPersonalityTypes, setSelectedPersonalityTypes] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMatchingSearch, setIsMatchingSearch] = useState(false);
  const [filteredAdvertisements, setFilteredAdvertisements] = useState<Advertisement[]>([]);
  const [companyIdsWithJobTypes, setCompanyIdsWithJobTypes] = useState<Set<string>>(new Set());

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

    // 職種フィルター
    if (selectedJobTypes.length > 0 && companyIdsWithJobTypes.size > 0) {
      filtered = filtered.filter(ad => companyIdsWithJobTypes.has(ad.id));
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
  }, [advertisements, selectedIndustries, selectedPersonalityTypes, selectedJobTypes, searchQuery, isMatchingSearch, personalityType, companyIdsWithJobTypes]);

  // 職種を持つ企業IDを取得
  useEffect(() => {
    const fetchCompanyIdsWithJobTypes = async () => {
      if (selectedJobTypes.length === 0) {
        setCompanyIdsWithJobTypes(new Set());
        return;
      }

      try {
        const { data, error } = await supabase
          .from('company_personality_individual_responses')
          .select('company_id, job_type')
          .in('job_type', selectedJobTypes);

        if (error) {
          console.error('職種フィルター取得エラー:', error);
          return;
        }

        const companyIds = new Set<string>(
          data?.map((item: { company_id: string | null }) => item.company_id).filter((id: string | null): id is string => id !== null) || []
        );
        setCompanyIdsWithJobTypes(companyIds);
      } catch (error) {
        console.error('職種フィルター取得エラー:', error);
      }
    };

    fetchCompanyIdsWithJobTypes();
  }, [selectedJobTypes]);

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

      console.log('全問正解の回答:', userQuizResponses);
      const answeredQuizIds = new Set(userQuizResponses?.map((res: {quiz_id: string}) => res.quiz_id));
      console.log('回答済みクイズID:', Array.from(answeredQuizIds));

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

  // LINE連携状態をチェック
  const checkLineLinkStatus = useCallback(async () => {
    if (!user) {
      setIsLineLinked(false);
      setLineUserId(null);
      return;
    }

    try {
      console.log('LINE連携状態をチェック中...', { userId: user.id });
      
      const { data, error } = await supabase
        .from('user_line_links')
        .select('line_user_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('LINE連携状態の取得エラー:', error);
        console.error('エラー詳細:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setIsLineLinked(false);
        setLineUserId(null);
        return;
      }
      
      console.log('LINE連携データ取得結果:', {
        hasData: !!data,
        lineUserId: data?.line_user_id,
        fullData: data
      });
      
      const linked = !!(data && data.line_user_id && data.line_user_id.trim() !== '');
      setIsLineLinked(linked);
      setLineUserId(linked ? data.line_user_id : null);
      
      console.log('LINE連携状態判定結果:', {
        isLinked: linked,
        lineUserId: linked ? data.line_user_id : null
      });
    } catch (err) {
      console.error('LINE連携状態の確認エラー:', err);
      setIsLineLinked(false);
      setLineUserId(null);
    }
  }, [user]);

  useEffect(() => {
    checkLineLinkStatus();
  }, [checkLineLinkStatus]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('line_link_status');
    const errorMsg = urlParams.get('error');

    if (status === 'success') {
      alert('✅ LINE連携が完了しました！今後はLINEで通知を受け取れます。');
      // LINE連携成功時は状態を再チェック
      checkLineLinkStatus();
    } else if (status === 'failure') {
      alert(`❌ LINE連携に失敗しました。\nエラー: ${errorMsg || '不明なエラー'}`);
    }

    if (status) {
        history.replaceState(null, '', window.location.pathname);
    }
    
  }, [checkLineLinkStatus]);

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
        .maybeSingle(); // .single() → .maybeSingle() に変更（回答がない場合もエラーにならない）

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

  const normalizeAnswerArray = (value?: string | null) => {
    if (!value) return [];
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  };

  const answersMatch = (question: QuizQuestion, userAnswer?: string) => {
    if (!question.correct_answer) return false;
    if (question.is_multiple_select) {
      const userValues = normalizeAnswerArray(userAnswer);
      const correctValues = normalizeAnswerArray(question.correct_answer);
      if (correctValues.length === 0) return false;
      if (userValues.length !== correctValues.length) return false;
      // セットとして比較（順序に依存しない）
      const userSet = new Set(userValues.map(v => v.toLowerCase()));
      const correctSet = new Set(correctValues.map(v => v.toLowerCase()));
      if (userSet.size !== correctSet.size) return false;
      // 全ての正解がユーザー回答に含まれているか確認
      return Array.from(correctSet).every(val => userSet.has(val));
    }
    if (!userAnswer) return false;
    return userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
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
          if (answersMatch(q, userAnswer)) {
            correctCount++;
          }
        }
      });
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : null;
      const isPerfect = score === 100;

      console.log('スコア計算:', { correctCount, totalQuestions, score, isPerfect });

      // 既存の回答がある場合は更新、ない場合は新規作成
      const { data: existingResponse, error: checkError } = await supabase
        .from('quiz_responses')
        .select('id')
        .eq('quiz_id', selectedQuiz.id)
        .eq('monitor_id', user.id)
        .maybeSingle(); // .single() の代わりに .maybeSingle() を使用（0件でもエラーにならない）

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116は「行が見つからない」エラー（無視）
        console.error('既存回答の確認エラー:', checkError);
        throw checkError;
      }

      let insertedResponse;
      if (existingResponse) {
        // 既存の回答を更新（再チャレンジ）
        // まず、既存の回答を取得して、以前のポイントを確認
        const { data: oldResponse, error: fetchOldError } = await supabase
          .from('quiz_responses')
          .select('points_earned')
          .eq('id', existingResponse.id)
          .single();
        
        const oldPointsEarned = oldResponse?.points_earned || 0;
        const newPointsEarned = isPerfect ? selectedQuiz.points_reward : 0;
        const pointsDifference = newPointsEarned - oldPointsEarned;

        console.log('UPDATE前のスコア:', score);
        console.log('UPDATEするデータ:', {
          answers: quizAnswers,
          score: score,
          points_earned: newPointsEarned,
          completed_at: new Date().toISOString()
        });
        
        const { data: updateResult, error: updateError } = await supabase
          .from('quiz_responses')
          .update({
            answers: quizAnswers,
            score: score,
            points_earned: newPointsEarned,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingResponse.id)
          .select(); // UPDATE結果を取得

        if (updateError) {
          console.error('クイズ回答の更新エラー:', updateError);
          console.error('更新データ:', {
            answers: quizAnswers,
            score: score,
            points_earned: newPointsEarned,
            completed_at: new Date().toISOString()
          });
          alert(`クイズの送信に失敗しました: ${updateError.message || JSON.stringify(updateError)}`);
          throw updateError;
        }
        
        console.log('UPDATE結果（即座に取得）:', updateResult);
        if (updateResult && updateResult.length > 0) {
          console.log('UPDATE結果のスコア:', updateResult[0]?.score);
          console.log('UPDATE結果のpoints_earned:', updateResult[0]?.points_earned);
        }
        
        console.log('UPDATE成功、更新後のデータを再取得します...');

        // ポイントが増えた場合、手動でプロフィールを更新（UPDATE時はトリガーが動作しないため）
        if (pointsDifference > 0 && user.id) {
          // 現在のポイントを取得
          const { data: currentProfile, error: fetchProfileError } = await supabase
            .from('monitor_profiles')
            .select('points')
            .eq('user_id', user.id)
            .single();

          if (!fetchProfileError && currentProfile) {
            const newPoints = (currentProfile.points || 0) + pointsDifference;
            const { error: pointsUpdateError } = await supabase
              .from('monitor_profiles')
              .update({ points: newPoints })
              .eq('user_id', user.id);

            if (pointsUpdateError) {
              console.warn('ポイント更新エラー（無視されます）:', pointsUpdateError);
            } else {
              console.log(`ポイントを更新しました: ${currentProfile.points} → ${newPoints}`);
            }
          }
        }

        // 更新後のデータを改めて取得
        const { data: updatedResponse, error: fetchUpdatedError } = await supabase
          .from('quiz_responses')
          .select('*')
          .eq('id', existingResponse.id)
          .single();

        if (fetchUpdatedError || !updatedResponse) {
          console.warn('更新後の回答データ取得に失敗:', fetchUpdatedError);
          throw new Error('更新後の回答データが取得できませんでした');
        }
        
        console.log('UPDATE後のスコア:', updatedResponse?.score);
        console.log('UPDATE後のpoints_earned:', updatedResponse?.points_earned);
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
          console.error('挿入データ:', {
            quiz_id: selectedQuiz.id,
            monitor_id: user.id,
            answers: quizAnswers,
            score: score,
            points_earned: isPerfect ? selectedQuiz.points_reward : 0,
          });
          alert(`クイズの送信に失敗しました: ${insertError.message || JSON.stringify(insertError)}`);
          throw insertError;
        }
        if (!newResponse) {
          throw new Error('挿入後の回答データが取得できませんでした');
        }
        insertedResponse = newResponse;
      }

      console.log('クイズ回答を保存しました:', insertedResponse);
      console.log('獲得ポイント:', insertedResponse?.points_earned);
      console.log('スコア:', insertedResponse?.score);
      console.log('全問正解:', isPerfect);

      // メッセージを表示
      if (isPerfect) {
        // 全問正解時は正解を表示するモーダルを開く（モーダル内で成功メッセージを表示）
        setQuizForAnswers(selectedQuiz);
        setQuizAnswersQuestions(quizQuestions);
        setShowPerfectScoreMessage(true);
        setShowQuizAnswersModal(true);
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
        
        // クイズリストの再取得（データベースへの反映を待つ）
        console.log('クイズリストを再取得します...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機（データベースへの反映を確実にする）
        
        // 保存された回答を確認
        const { data: savedResponse, error: checkError } = await supabase
          .from('quiz_responses')
          .select('quiz_id, score')
          .eq('quiz_id', selectedQuiz.id)
          .eq('monitor_id', user.id)
          .single();
        
        console.log('保存された回答を確認:', savedResponse);
        console.log('スコア:', savedResponse?.score);
        
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
                      {question.options?.map((option, optionIndex) => {
                        const currentAnswer = answers.find(a => a.question_id === question.id)?.answer || '';
                        const currentAnswersArray = currentAnswer
                          ? currentAnswer.split(',').map((a) => a.trim()).filter((a) => a.length > 0)
                          : [];
                        const isChecked = question.is_multiple_select
                          ? currentAnswersArray.includes(option)
                          : currentAnswer === option;
                        return (
                        <label key={optionIndex} className="flex items-center">
                          <input
                            type={question.is_multiple_select ? 'checkbox' : 'radio'}
                            name={`question_${question.id}`}
                            value={option}
                              checked={isChecked}
                            onChange={(e) => {
                              if (question.is_multiple_select) {
                                  const updated = e.target.checked
                                    ? [...currentAnswersArray, option]
                                    : currentAnswersArray.filter(a => a !== option);
                                  handleAnswerChange(question.id, updated.join(', '));
                              } else {
                                handleAnswerChange(question.id, option);
                              }
                            }}
                            className="mr-2"
                          />
                          <span>{option}</span>
                        </label>
                        );
                      })}
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
                      {question.options?.map((option, optionIndex) => {
                        const currentAnswer = quizAnswers.find(a => a.question_id === question.id)?.answer || '';
                        const currentAnswersArray = currentAnswer
                          ? currentAnswer.split(',').map((a) => a.trim()).filter((a) => a.length > 0)
                          : [];
                        const isChecked = question.is_multiple_select
                          ? currentAnswersArray.includes(option)
                          : currentAnswer === option;
                        return (
                          <label key={optionIndex} className="flex items-center">
                            <input
                              type={question.is_multiple_select ? 'checkbox' : 'radio'}
                              name={`quiz_question_${question.id}`}
                              value={option}
                              checked={isChecked}
                              onChange={(e) => {
                                if (question.is_multiple_select) {
                                  let updated: string[];
                                  if (e.target.checked) {
                                    // チェックされた場合：重複を防ぎつつ追加
                                    updated = currentAnswersArray.includes(option)
                                      ? currentAnswersArray
                                      : [...currentAnswersArray, option];
                                  } else {
                                    // チェック解除された場合：該当項目を削除
                                    updated = currentAnswersArray.filter(a => a !== option);
                                  }
                                  handleQuizAnswerChange(question.id, updated.join(', '));
                                } else {
                                  handleQuizAnswerChange(question.id, option);
                                }
                              }}
                              className="mr-2"
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
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
        <header className="bg-orange-500 sm:bg-white/80 sm:backdrop-blur-sm border-b border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              {/* スマホ: オレンジバーにコイン、ポイント、交換ボタン、人型アイコン */}
              <div className="flex items-center gap-2 sm:hidden w-full">
                <Star className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-lg">{profile?.points || 0} ポイント</span>
                <button
                  onClick={() => setShowPointExchangeModal(true)}
                  className="ml-auto px-4 py-1.5 bg-white text-orange-600 rounded font-semibold text-sm"
                >
                  交換
                </button>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1"
                >
                  <UserIcon className="w-7 h-7 text-white" />
                </button>
              </div>
              
              {/* デスクトップ: オレンジバーにコイン、ポイント、交換ボタン、人型アイコン */}
              <div className="hidden sm:flex items-center gap-3 w-full">
                <Star className="w-6 h-6 text-orange-600" />
                <span className="text-orange-600 font-bold text-xl">{profile?.points || 0} ポイント</span>
                <button
                  onClick={() => setShowPointExchangeModal(true)}
                  className="ml-auto px-4 py-1.5 bg-orange-600 text-white rounded font-semibold text-sm hover:bg-orange-700 transition-colors"
                >
                  交換
                </button>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1 text-gray-700 hover:text-orange-600 transition-colors"
                >
                  <UserIcon className="w-7 h-7" />
                </button>
              </div>
              
              {/* デスクトップ: 元のデザイン */}
              <div className="hidden sm:flex items-center w-full">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">
                  声キャン！
                </h1>
              </div>
              
              <div className="hidden sm:flex items-center space-x-4">
                {/* ユーザーID表示 */}
                {user?.id && (
                  <div className="hidden md:flex flex-col items-end mr-2">
                    <div className="text-xs text-gray-500 font-mono">
                      ユーザーID
                    </div>
                    <div className="text-xs text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded">
                      {user.id.substring(0, 8)}...
                    </div>
                  </div>
                )}
                
                {isLineLinked ? (
                  <div className="flex flex-col items-end">
                    <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-1">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      LINE連携済み
                    </div>
                    {lineUserId && (
                      <div className="text-xs text-gray-500 font-mono">
                        LINE ID: {lineUserId.substring(0, 8)}...
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowLineLinkModal(true)}
                    className="flex items-center px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    LINE連携
                  </button>
                )}
                
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
            className="fixed right-4 top-16 mt-2 w-56 bg-white rounded-lg py-2 z-[1000] border border-gray-100" 
            style={{ zIndex: 1000 }} 
          >
            {/* ユーザーID表示 */}
            {user?.id && (
              <div className="px-4 py-2 border-b border-gray-200">
                <div className="text-xs text-gray-500 mb-1">ユーザーID</div>
                <div className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded break-all">
                  {user.id}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.id);
                    alert('ユーザーIDをクリップボードにコピーしました');
                  }}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  コピー
                </button>
              </div>
            )}
            
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
          activeTab === 'career_consultation' ? '' : 'max-w-7xl px-0 sm:px-6 lg:px-8 pt-8'
        }`}> 
          {activeTab !== 'career_consultation' && (
            <div className="bg-white p-4 sm:p-6 mb-4 sm:mb-8">
              {personalityType && (
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {/* 左半分: タイプ */}
                  <div 
                    className="flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => setShowPersonalityTypeModal(true)}
                  >
                    <p className="text-sm sm:text-base text-gray-600 mb-2">あなたのタイプ</p>
                    <p className="text-4xl sm:text-6xl font-bold text-purple-600">{personalityType}</p>
                  </div>
                  
                  {/* 右半分: 動画と吹き出し */}
                  <div className="flex items-center justify-center relative">
                    {(() => {
                      let videoType = personalityType;
                      if (personalityType.includes('/')) {
                        const parts = personalityType.replace(/\//g, '').substring(0, 4);
                        if (parts.length === 4) {
                          videoType = parts;
                        } else {
                          return null;
                        }
                      }
                      if (videoType.length === 4) {
                        const messages = CHARACTER_MESSAGES[activeTab] || [];
                        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                        return (
                          <div className="relative">
                            <video
                              src={`/character/${videoType}.mp4`}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-lg"
                            />
                            {/* 吹き出し */}
                            <div className="absolute -top-2 sm:-top-4 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2">
                              <div className="bg-white rounded-lg shadow-lg px-3 py-2 sm:px-4 sm:py-3 border-2 border-orange-300 relative max-w-[200px] sm:max-w-[250px]">
                                <p className="text-xs sm:text-sm text-gray-800 font-medium text-center whitespace-normal">
                                  {randomMessage}
                                </p>
                                {/* 吹き出しのしっぽ */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-orange-300"></div>
                                  <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-7 border-r-7 border-t-7 border-transparent border-t-white"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          )} 

          <div 
            className={`
              transition-colors duration-300
              ${activeTab === 'career_consultation' ? 'bg-transparent p-0' : 'backdrop-blur-sm rounded-2xl bg-white/80 p-0 sm:p-8'}
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
                  <div className="grid grid-cols-1 gap-1.5 px-2 sm:px-0 sm:gap-2 mb-8">
                    {/* アンケート */}
                    {availableSurveys.map((survey) => (
                      <div
                        key={survey.id}
                        className="border border-gray-200 rounded-lg p-1.5 sm:p-2 flex flex-row items-center gap-2"
                      >
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-1">
                            {survey.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center bg-orange-50 rounded-full px-2 py-0.5 text-orange-700 font-semibold text-[10px] sm:text-xs">
                            <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                            <span>{survey.points_reward}pt</span>
                          </div>
                          <button
                            onClick={() => handleSurveyClick(survey)}
                            className="px-2 py-1 bg-orange-600 text-white rounded text-[10px] sm:text-xs font-semibold hover:bg-orange-700 transition-colors whitespace-nowrap"
                          >
                            回答する
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* クイズ */}
                    {availableQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="border border-gray-200 rounded-lg p-1.5 sm:p-2 bg-gradient-to-r from-purple-50 to-pink-50 flex flex-row items-center gap-2"
                      >
                        <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-1">
                            {quiz.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center bg-purple-50 rounded-full px-2 py-0.5 text-purple-700 font-semibold text-[10px] sm:text-xs">
                            <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                            <span>{quiz.points_reward}pt</span>
                          </div>
                          <button
                            onClick={() => handleQuizClick(quiz)}
                            className="px-2 py-1 bg-purple-600 text-white rounded text-[10px] sm:text-xs font-semibold hover:bg-purple-700 transition-colors whitespace-nowrap"
                          >
                            回答する
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-t pt-8 px-4 sm:px-0">回答済みアンケート・クイズ</h2>
                {(answeredSurveys.length === 0 && answeredQuizzes.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <History className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">まだ回答したアンケート・クイズはありません</h3>
                    <p className="text-gray-600">新しいアンケート・クイズに回答してポイントを獲得しましょう。</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5 px-2 sm:px-0 sm:gap-2">
                    {/* 回答済みアンケート */}
                    {answeredSurveys.map((survey) => (
                      <div
                        key={survey.id}
                        className="border border-gray-200 rounded-lg p-1.5 sm:p-2 bg-gray-50 opacity-80 flex flex-row items-center gap-2" 
                      >
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 line-clamp-1">
                            {survey.title}
                          </h3>
                        </div>
                        <div className="flex items-center bg-gray-100 rounded-full px-2 py-0.5 text-gray-600 font-semibold text-[10px] sm:text-xs flex-shrink-0">
                          <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                          <span>{survey.points_reward}pt 獲得済み</span>
                        </div>
                      </div>
                    ))}
                    {/* 回答済みクイズ */}
                    {answeredQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="border border-gray-200 rounded-lg p-1.5 sm:p-2 bg-gray-50 opacity-80 flex flex-row items-center gap-2" 
                      >
                        <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 line-clamp-1">
                            {quiz.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center bg-gray-100 rounded-full px-2 py-0.5 text-gray-600 font-semibold text-[10px] sm:text-xs">
                            <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                            <span>{quiz.points_reward}pt 獲得済み</span>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                const { data: questions, error } = await supabase
                                  .from('quiz_questions')
                                  .select('*')
                                  .eq('quiz_id', quiz.id)
                                  .order('order_index');
                                
                                if (error) throw error;
                                
                                setQuizForAnswers(quiz);
                                setQuizAnswersQuestions(questions || []);
                                setShowPerfectScoreMessage(false); // 回答済みクイズでは成功メッセージを表示しない
                                setShowQuizAnswersModal(true);
                              } catch (error) {
                                console.error('クイズ質問の取得エラー:', error);
                                alert('正解の読み込みに失敗しました。');
                              }
                            }}
                            className="px-2 py-1 bg-purple-600 text-white rounded text-[10px] sm:text-xs font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center whitespace-nowrap"
                          >
                            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                            正解を見る
                          </button>
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
                        src="https://raw.githubusercontent.com/NSDKIT/koecan_v0/refs/heads/main/img/top_20251130.png"
                        alt="キャリア相談 上部"
                        className="w-full h-auto object-cover"
                    />
                    
                    <div className="relative w-full">
                        <img 
                            src="https://raw.githubusercontent.com/NSDKIT/koecan_v0/refs/heads/main/img/down_20251130.png"
                            alt="キャリア相談 中部"
                            className="w-full h-auto object-cover"
                        />
                        
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <a
                                href={C8_LINE_ADD_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-4 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex flex-col items-center text-sm sm:text-base"
                            >
                                <span className="text-xs sm:text-sm mb-1">キャリア支援のプロ</span>
                                <span className="text-base sm:text-lg">シーエイトに相談</span>
                            </a>
                        </div>
                    </div>
                </div>
              </>
            )}

            {activeTab === 'recruitment' && ( 
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-0">
                {/* フィルターセクション */}
                <div className="p-0 border-b border-gray-200">
                  <div className="grid grid-cols-2 gap-0 bg-white">
                    {/* 業界選択ボタン */}
                    <button
                      onClick={() => setShowIndustryFilter(true)}
                      className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-0 border-r border-b border-gray-300 transition-all ${
                        selectedIndustries.length > 0
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-orange-500 flex items-center justify-center flex-shrink-0">
                        <Building className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-orange-500" />
                      </div>
                      <span className="text-[15px] sm:text-xs whitespace-nowrap">業界を選択</span>
                      {selectedIndustries.length > 0 && (
                        <span className="bg-blue-500 text-white rounded-full px-1 py-0.5 text-[10px] sm:text-xs flex-shrink-0">
                          {selectedIndustries.length}
                        </span>
                      )}
                    </button>

                    {/* 価値観選択ボタン */}
                    <button
                      onClick={() => setShowPersonalityFilter(true)}
                      className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-0 border-b border-gray-300 transition-all ${
                        selectedPersonalityTypes.length > 0
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-orange-500 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-orange-500" />
                      </div>
                      <span className="text-[15px] sm:text-xs whitespace-nowrap">価値観を選択</span>
                      {selectedPersonalityTypes.length > 0 && (
                        <span className="bg-purple-500 text-white rounded-full px-1 py-0.5 text-[10px] sm:text-xs flex-shrink-0">
                          {selectedPersonalityTypes.length}
                        </span>
                      )}
                    </button>

                    {/* 業種選択ボタン */}
                    <button
                      onClick={() => setShowJobTypeFilter(true)}
                      className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-0 border-r border-gray-300 transition-all ${
                        selectedJobTypes.length > 0
                          ? 'bg-green-50 text-green-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-orange-500 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-orange-500" />
                      </div>
                      <span className="text-[15px] sm:text-xs whitespace-nowrap">業種を選択</span>
                      {selectedJobTypes.length > 0 && (
                        <span className="bg-green-500 text-white rounded-full px-1 py-0.5 text-[10px] sm:text-xs flex-shrink-0">
                          {selectedJobTypes.length}
                        </span>
                      )}
                    </button>

                    {/* マッチング検索ボタン */}
                    <button
                      onClick={() => setIsMatchingSearch(!isMatchingSearch)}
                      className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-0 transition-all ${
                        isMatchingSearch
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      disabled={!personalityType}
                    >
                      <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-orange-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-orange-500" />
                      </div>
                      <span className="text-[15px] sm:text-xs whitespace-nowrap">マッチング検索</span>
                    </button>
                  </div>

                  {/* フィルター表示 */}
                  {(selectedIndustries.length > 0 || selectedPersonalityTypes.length > 0 || selectedJobTypes.length > 0 || isMatchingSearch) && (
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
                      {selectedJobTypes.map((jobType) => (
                        <span
                          key={jobType}
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {jobType}
                          <button
                            onClick={() => setSelectedJobTypes(prev => prev.filter(j => j !== jobType))}
                            className="ml-2 hover:text-green-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
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
                          setSelectedJobTypes([]);
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
                  <div className="p-0 sm:p-6">
                    <p className="text-sm text-gray-600 mb-4 px-4 sm:px-0">
                      {filteredAdvertisements.length}件の企業が見つかりました
                    </p>
                  <div className="grid grid-cols-2 gap-2 px-2 sm:px-0 sm:gap-3">
                      {filteredAdvertisements.map((ad) => (
                      <div
                        key={ad.id}
                        className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer group bg-white"
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
                          <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
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
                            {displayValue(ad.company_vision) && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400 flex-shrink-0" />
                                  <h4 className="text-[10px] sm:text-xs font-bold text-white">目指す未来</h4>
                                </div>
                                <p className="text-white text-[10px] sm:text-xs line-clamp-2 leading-relaxed">
                                  {displayValue(ad.company_vision)}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center relative">
                            <Briefcase className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" />
                            {displayValue(ad.company_vision) && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800/70 to-transparent p-2">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400 flex-shrink-0" />
                                  <h4 className="text-[10px] sm:text-xs font-bold text-white">目指す未来</h4>
                                </div>
                                <p className="text-white text-[10px] sm:text-xs line-clamp-2 leading-relaxed">
                                  {displayValue(ad.company_vision)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="p-3 sm:p-4">
                          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                            <h3 className="font-semibold text-gray-800 text-xs sm:text-base flex-1 line-clamp-1">
                              {displayValue(ad.company_name) || '企業名未設定'}
                            </h3>
                            {ad.personality_type && (
                              <div className="bg-purple-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-sm font-bold flex-shrink-0">
                                {ad.personality_type}
                              </div>
                            )}
                          </div>
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
        <div className="max-w-7xl mx-auto flex justify-around h-16 sm:h-20">
          <button
            onClick={() => setActiveTab('bulletin_board')}
            className={`flex flex-col items-center justify-center w-full text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'bulletin_board' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1" />
            <span className="hidden sm:inline">掲示板</span>
            <span className="sm:hidden">掲示板</span>
          </button>
          <button
            onClick={() => setActiveTab('surveys')}
            className={`flex flex-col items-center justify-center w-full text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'surveys' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1" />
            <span className="hidden sm:inline">アンケート</span>
            <span className="sm:hidden">アンケート</span>
          </button>
          <button
            onClick={() => setActiveTab('recruitment')}
            className={`flex flex-col items-center justify-center w-full text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'recruitment' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1" />
            <span className="hidden sm:inline">企業情報</span>
            <span className="sm:hidden">企業</span>
          </button>
          <button
            onClick={() => setActiveTab('career_consultation')}
            className={`flex flex-col items-center justify-center w-full text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'career_consultation' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1" />
            <span className="hidden sm:inline">キャリア相談</span>
            <span className="sm:hidden">相談</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            
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
              <div className="bg-white rounded-t-3xl p-4 sm:p-8 pb-4 sm:pb-6">
                <h2 className="text-2xl sm:text-4xl font-bold text-orange-600 mb-4 sm:mb-6">{displayValue(selectedAdvertisement.company_name) || '企業名未設定'}</h2>
                
                {/* タブ切り替えボタン */}
                <div className="flex space-x-2 sm:space-x-4">
                  <button
                    onClick={() => setCompanyDetailView('info')}
                    className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                      companyDetailView === 'info'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    企業情報
                  </button>
                  <button
                    onClick={() => setCompanyDetailView('personality')}
                    className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
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
                <div className="px-4 sm:px-8 pt-4 sm:pt-6 relative z-10">
                  <div className="bg-white rounded-2xl overflow-hidden border-4 border-white">
                    <img
                      src={getSecureImageUrl(selectedAdvertisement.image_url) || undefined}
                      alt={displayValue(selectedAdvertisement.company_name) || '企業画像'}
                      className="w-full h-auto object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="p-4 sm:p-8">
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
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="px-4 sm:px-6 py-4 bg-gray-50 font-semibold text-gray-700 w-1/3 whitespace-nowrap">代表者名</td>
                          <td className="px-4 sm:px-6 py-4 text-gray-700">{displayValue(selectedAdvertisement.representative_name)}</td>
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
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="px-4 sm:px-6 py-4 bg-gray-50 font-semibold text-gray-700 w-1/3 whitespace-nowrap">初任給</td>
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
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="px-4 sm:px-6 py-4 bg-gray-50 font-semibold text-gray-700 w-1/3 whitespace-nowrap">勤務時間</td>
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
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="px-4 sm:px-6 py-4 bg-gray-50 font-semibold text-gray-700 w-1/3 whitespace-nowrap">採用担当部署（担当者）</td>
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
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="px-4 sm:px-6 py-4 bg-gray-50 font-semibold text-gray-700 w-1/3 whitespace-nowrap">実施予定</td>
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
          onExchangeSuccess={(newPoints) => {
            // リアルタイムでポイントを更新
            if (profile) {
              setProfile({ ...profile, points: newPoints });
            }
            // バックグラウンドでプロフィールを再取得して同期
            fetchProfile();
          }}
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
                      <button 
                        onClick={() => {
                          setShowLineLinkModal(false);
                          // モーダルを閉じた後にLINE連携状態を再チェック
                          setTimeout(() => checkLineLinkStatus(), 500);
                        }} 
                        className="text-gray-500 hover:text-gray-700"
                      >
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

      {showJobTypeFilter && (
        <JobTypeFilterModal
          selectedJobTypes={selectedJobTypes}
          onClose={() => setShowJobTypeFilter(false)}
          onApply={(jobTypes) => {
            setSelectedJobTypes(jobTypes);
            setShowJobTypeFilter(false);
          }}
        />
      )}

      {showJobTypeFilter && (
        <JobTypeFilterModal
          selectedJobTypes={selectedJobTypes}
          onClose={() => setShowJobTypeFilter(false)}
          onApply={(jobTypes) => {
            setSelectedJobTypes(jobTypes);
            setShowJobTypeFilter(false);
          }}
        />
      )}

      {/* クイズ正解表示モーダル */}
      {showQuizAnswersModal && quizForAnswers && quizAnswersQuestions.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-purple-600" />
                {quizForAnswers.title} - 正解一覧
              </h2>
              <button
                onClick={() => {
                  setShowQuizAnswersModal(false);
                  setQuizForAnswers(null);
                  setQuizAnswersQuestions([]);
                  setShowPerfectScoreMessage(false);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* 全問正解時の成功メッセージ */}
              {showPerfectScoreMessage && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-green-800 mb-1">
                        🎉 全問正解です！
                      </h3>
                      <p className="text-green-700">
                        {quizForAnswers.points_reward}ポイントを獲得しました！
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {quizAnswersQuestions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        {question.question_text}
                      </h3>
                      
                      {/* 正解の表示 */}
                      {question.correct_answer ? (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            <span className="font-semibold text-green-800">正解:</span>
                          </div>
                          <div className="text-gray-800 ml-7">
                            {question.question_type === 'multiple_choice' && question.is_multiple_select ? (
                              // 複数選択の場合
                              <div className="space-y-1">
                                {question.correct_answer.split(',').map((answer, idx) => (
                                  <div key={idx} className="flex items-center">
                                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                                    <span>{answer.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            ) : question.question_type === 'ranking' ? (
                              // ランキングの場合
                              <div className="space-y-2">
                                {question.correct_answer.split(',').map((answer, idx) => (
                                  <div key={idx} className="flex items-center">
                                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-2">
                                      {idx + 1}
                                    </span>
                                    <span>{answer.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              // その他の場合（単一選択、テキスト、yes_no、rating）
                              <span className="text-lg">{question.correct_answer}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <span className="text-yellow-800">正解が設定されていません</span>
                        </div>
                      )}

                      {/* 選択肢の表示（multiple_choiceの場合） */}
                      {question.question_type === 'multiple_choice' && question.options && question.options.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-600 mb-2">選択肢:</p>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => {
                              const isCorrect = question.correct_answer
                                ? question.is_multiple_select
                                  ? question.correct_answer.split(',').some(a => a.trim() === option)
                                  : question.correct_answer.trim() === option
                                : false;
                              return (
                                <div
                                  key={optionIndex}
                                  className={`p-3 rounded-lg border-2 ${
                                    isCorrect
                                      ? 'bg-green-50 border-green-300'
                                      : 'bg-white border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center">
                                    {isCorrect && (
                                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                                    )}
                                    <span className={isCorrect ? 'font-semibold text-green-800' : 'text-gray-700'}>
                                      {option}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  setShowQuizAnswersModal(false);
                  setQuizForAnswers(null);
                  setQuizAnswersQuestions([]);
                  setShowPerfectScoreMessage(false);
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
