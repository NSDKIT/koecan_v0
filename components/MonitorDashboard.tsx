// koecan_v0-main/components/MonitorDashboard.tsx

'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/config/supabase';
import { Survey, Question, Answer, User, MonitorProfile, Advertisement, Response as UserResponse, Quiz, QuizQuestion, QuizResponse, CompanyFavorite, CompanySaved } from '@/types'; 
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
  Brain,
  Heart,
  Bookmark,
  Home,
  TrendingUp,
  HelpCircle,
  Download
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
import { personalityTypes } from '@/components/PersonalityTypeModal';
import { CompanyPersonalityBreakdown } from '@/components/CompanyPersonalityBreakdown';
import { IndustryFilterModal } from '@/components/IndustryFilterModal';
import { PersonalityFilterModal } from '@/components/PersonalityFilterModal';
import { JobTypeFilterModal } from '@/components/JobTypeFilterModal';
import { LocationFilterModal } from '@/components/LocationFilterModal';
import { ValueFilterModal } from '@/components/ValueFilterModal';
import { BulletinBoardDisplay } from '@/components/BulletinBoardDisplay';
import { HomeBulletinBoardPosts } from '@/components/HomeBulletinBoardPosts';
import { getRandomTip, Tip } from '@/lib/tips';

// 8つの価値観の選択肢（ValueFilterModalと共有）
const VALUE_OPTIONS = [
  { id: 'E', label: '外の人と関わる仕事（E）' },
  { id: 'I', label: '一人で集中できる仕事（I）' },
  { id: 'N', label: '新しいことに挑戦したい（N）' },
  { id: 'S', label: '安定した業務を求める（S）' },
  { id: 'F', label: '人を大切にする柔らかい雰囲気（F）' },
  { id: 'T', label: '数値的な目標に向かって突き進む（T）' },
  { id: 'P', label: '自分なりのやり方で進められる（P）' },
  { id: 'J', label: 'ルールが明確で迷わず働ける（J）' },
];

type ActiveTab = 'home' | 'surveys' | 'recruitment' | 'career_consultation' | 'bulletin_board' | 'mypage' | 'character' | 'character_list';

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const menuButtonRef = useRef<HTMLButtonElement>(null); 

  const [selectedAdvertisement, setSelectedAdvertisement] = useState<Advertisement | null>(null);
  const [showPointExchangeModal, setShowPointExchangeModal] = useState(false);
  const [showPersonalityAssessmentModal, setShowPersonalityAssessmentModal] = useState(false);
  const [showPersonalityTypeModal, setShowPersonalityTypeModal] = useState(false);
  const [personalityType, setPersonalityType] = useState<string | null>(null);
  const [showCompanyPersonalityTypeModal, setShowCompanyPersonalityTypeModal] = useState(false);
  const [companyPersonalityType, setCompanyPersonalityType] = useState<string | null>(null);
  const [selectedCharacterType, setSelectedCharacterType] = useState<string | null>(null);
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
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [showValueFilter, setShowValueFilter] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedPersonalityTypes, setSelectedPersonalityTypes] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMatchingSearch, setIsMatchingSearch] = useState(false);
  const [filteredAdvertisements, setFilteredAdvertisements] = useState<Advertisement[]>([]);
  const [companyIdsWithJobTypes, setCompanyIdsWithJobTypes] = useState<Set<string>>(new Set());
  const [characterTip, setCharacterTip] = useState<Tip | null>(null);
  const [selectedOneCharDiffType, setSelectedOneCharDiffType] = useState<string | null>(null);
  const [favoriteCompanyIds, setFavoriteCompanyIds] = useState<Set<string>>(new Set());
  const [savedCompanyIds, setSavedCompanyIds] = useState<Set<string>>(new Set());
  const [companySlideIndex, setCompanySlideIndex] = useState(1); // 無限ループ用に1から開始（0は複製された最後のペア）
  const [bulletinSlideIndex, setBulletinSlideIndex] = useState(0);
  const [selectedBulletinPost, setSelectedBulletinPost] = useState<any>(null);
  const [isCompanyTransitioning, setIsCompanyTransitioning] = useState(false);

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

  // お気に入りと保存の状態を取得
  const fetchFavoriteAndSavedStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      // お気に入りの取得
      const { data: favorites, error: favoritesError } = await supabase
        .from('company_favorites')
        .select('company_id')
        .eq('user_id', user.id);

      if (favoritesError) throw favoritesError;
      setFavoriteCompanyIds(new Set((favorites as { company_id: string }[] | null)?.map((f: { company_id: string }) => f.company_id) || []));

      // 保存の取得
      const { data: saved, error: savedError } = await supabase
        .from('company_saved')
        .select('company_id')
        .eq('user_id', user.id);

      if (savedError) throw savedError;
      setSavedCompanyIds(new Set((saved as { company_id: string }[] | null)?.map((s: { company_id: string }) => s.company_id) || []));
    } catch (error) {
      console.error('お気に入り・保存状態の取得エラー:', error);
    }
  }, [user?.id]);

  // お気に入りのトグル
  const toggleFavorite = useCallback(async (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 企業カードのクリックイベントを防ぐ
    if (!user?.id) return;

    try {
      const isFavorite = favoriteCompanyIds.has(companyId);
      
      if (isFavorite) {
        // 削除
        const { error } = await supabase
          .from('company_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('company_id', companyId);

        if (error) throw error;
        setFavoriteCompanyIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(companyId);
          return newSet;
        });
      } else {
        // 追加
        const { error } = await supabase
          .from('company_favorites')
          .insert([{ user_id: user.id, company_id: companyId }]);

        if (error) throw error;
        setFavoriteCompanyIds(prev => new Set(prev).add(companyId));
      }
    } catch (error) {
      console.error('お気に入りの更新エラー:', error);
      alert('お気に入りの更新に失敗しました。');
    }
  }, [user?.id, favoriteCompanyIds]);

  // 保存のトグル
  const toggleSaved = useCallback(async (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 企業カードのクリックイベントを防ぐ
    if (!user?.id) return;

    try {
      const isSaved = savedCompanyIds.has(companyId);
      
      if (isSaved) {
        // 削除
        const { error } = await supabase
          .from('company_saved')
          .delete()
          .eq('user_id', user.id)
          .eq('company_id', companyId);

        if (error) throw error;
        setSavedCompanyIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(companyId);
          return newSet;
        });
      } else {
        // 追加
        const { error } = await supabase
          .from('company_saved')
          .insert([{ user_id: user.id, company_id: companyId }]);

        if (error) throw error;
        setSavedCompanyIds(prev => new Set(prev).add(companyId));
      }
    } catch (error) {
      console.error('保存の更新エラー:', error);
      alert('保存の更新に失敗しました。');
    }
  }, [user?.id, savedCompanyIds]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSurveysAndResponses();
      fetchAdvertisements();
      calculatePersonalityType();
      fetchFavoriteAndSavedStatus();
    }
  }, [user, fetchProfile, calculatePersonalityType, fetchFavoriteAndSavedStatus]);

  // タブが変更されたときにキャラクターのメッセージを更新（就活のポイント・豆知識・雑学を使用）
  useEffect(() => {
    if (activeTab !== 'career_consultation') {
      const tip = getRandomTip();
      setCharacterTip(tip);
    }
  }, [activeTab]);

  // 企業紹介セクションのスライドショー用：登録日時が新しい順にソートし、ペアに分割
  const recentCompanyPairs = useMemo(() => {
    // すべての企業を取得（直近1ヶ月のフィルタを削除）
    const allCompanies = [...advertisements].filter(ad => ad.created_at);
    
    // 登録日時が新しい順にソート
    allCompanies.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // 新しい順
    });

    // 2つずつのペアに分割
    const pairs: Advertisement[][] = [];
    for (let i = 0; i < allCompanies.length; i += 2) {
      pairs.push(allCompanies.slice(i, i + 2));
    }
    
    // 無限ループ用に、最初と最後のペアを複製
    if (pairs.length > 1) {
      return [pairs[pairs.length - 1], ...pairs, pairs[0]];
    }
    return pairs;
  }, [advertisements]);

  // 企業紹介セクションのスライドショー自動切り替え（無限ループ）
  useEffect(() => {
    if (recentCompanyPairs.length <= 2 || activeTab !== 'home') return; // 複製があるので2以上必要
    
    const interval = setInterval(() => {
      setCompanySlideIndex((prev) => {
        const next = prev + 1;
        // 最後のスライド（複製された最初のペア）に到達したら、2番目のスライド（実際の最初のペア）に戻る
        if (next >= recentCompanyPairs.length - 1) {
          // アニメーションなしで1番目のスライドに戻す
          setTimeout(() => {
            setIsCompanyTransitioning(false);
            setCompanySlideIndex(1);
            setTimeout(() => setIsCompanyTransitioning(true), 50);
          }, 500);
          return next;
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [recentCompanyPairs.length, activeTab]);

  // 初期化時にトランジションを有効化
  useEffect(() => {
    if (activeTab === 'home' && recentCompanyPairs.length > 2) {
      setIsCompanyTransitioning(true);
    }
  }, [activeTab, recentCompanyPairs.length]);

  // 一文字違いのタイプを計算する関数
  const getOneCharDiffTypes = useCallback((type: string): string[] => {
    if (!type || type.length !== 4) return [];
    
    const types: string[] = [];
    const axes = [
      { index: 0, options: ['E', 'I'] },
      { index: 1, options: ['N', 'S'] },
      { index: 2, options: ['P', 'R'] },
      { index: 3, options: ['F', 'O'] }
    ];
    
    axes.forEach(axis => {
      const currentChar = type[axis.index];
      const otherChar = axis.options.find(opt => opt !== currentChar);
      if (otherChar) {
        const newType = type.split('');
        newType[axis.index] = otherChar;
        types.push(newType.join(''));
      }
    });
    
    return types;
  }, []);

  // 価値観の選択肢をパーソナリティタイプに変換
  // 注意: F/TとP/Jは逆になっている
  // F（人を大切にする柔らかい雰囲気）→ P（人材志向）
  // T（数値的な目標に向かって突き進む）→ R（成果志向）
  // P（自分なりのやり方で進められる）→ F（柔軟型）
  // J（ルールが明確で迷わず働ける）→ O（規律型）
  const convertValuesToPersonalityTypes = useCallback((values: string[]): string[] => {
    const types: string[] = [];
    
    // E/I, N/S, P/R, F/Oの組み合わせを生成
    const eSelected = values.includes('E');
    const iSelected = values.includes('I');
    const nSelected = values.includes('N');
    const sSelected = values.includes('S');
    // F（人を大切にする柔らかい雰囲気）→ P（人材志向）
    const pSelected = values.includes('F');
    // T（数値的な目標に向かって突き進む）→ R（成果志向）
    const rSelected = values.includes('T');
    // P（自分なりのやり方で進められる）→ F（柔軟型）
    const fSelected = values.includes('P');
    // J（ルールが明確で迷わず働ける）→ O（規律型）
    const oSelected = values.includes('J');

    // 16タイプを生成（E/I, N/S, P/R, F/Oの順）
    const eOptions = eSelected ? ['E'] : iSelected ? ['I'] : ['E', 'I'];
    const nOptions = nSelected ? ['N'] : sSelected ? ['S'] : ['N', 'S'];
    const pOptions = pSelected ? ['P'] : rSelected ? ['R'] : ['P', 'R'];
    const fOptions = fSelected ? ['F'] : oSelected ? ['O'] : ['F', 'O'];

    for (const e of eOptions) {
      for (const n of nOptions) {
        for (const p of pOptions) {
          for (const f of fOptions) {
            types.push(e + n + p + f);
          }
        }
      }
    }

    return types;
  }, []);

  // 完全一致の企業を取得
  const getExactMatchCompanies = useCallback((type: string): Advertisement[] => {
    if (!type) return [];
    return advertisements.filter(ad => ad.personality_type === type);
  }, [advertisements]);

  // 特定タイプの企業を取得
  const getCompaniesByType = useCallback((type: string): Advertisement[] => {
    if (!type) return [];
    return advertisements.filter(ad => ad.personality_type === type);
  }, [advertisements]);

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

    // 勤務地フィルター
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(ad => {
        const headquarters = ad.headquarters_location || '';
        const branchOffice = ad.branch_office_location || '';
        const locationText = `${headquarters} ${branchOffice}`;
        return selectedLocations.some(location => locationText.includes(location));
      });
    }

    // 8つの価値観フィルター
    if (selectedValues.length > 0) {
      // 価値観の選択肢をパーソナリティタイプに変換
      const personalityTypes = convertValuesToPersonalityTypes(selectedValues);
      
      filtered = filtered.filter(ad => {
        const adPersonalityType = ad.personality_type;
        if (!adPersonalityType) return false;
        return personalityTypes.includes(adPersonalityType);
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
  }, [advertisements, selectedIndustries, selectedPersonalityTypes, selectedJobTypes, selectedLocations, selectedValues, searchQuery, isMatchingSearch, personalityType, companyIdsWithJobTypes, convertValuesToPersonalityTypes]);

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
  }, [advertisements.length, applyFilters]);

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
        <header className="sticky top-0 bg-orange-500 sm:bg-white/80 sm:backdrop-blur-sm border-b border-orange-100 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              {/* スマホ: オレンジバーにコイン、ポイント、交換ボタン、LINE連携、人型アイコン */}
              <div className="flex items-center gap-2 sm:hidden w-full">
                <Star className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-lg">{profile?.points || 0} ポイント</span>
                <button
                  onClick={() => setShowPointExchangeModal(true)}
                  className="px-3 py-1 bg-white text-orange-600 rounded font-semibold text-xs"
                >
                  交換
                </button>
                {isLineLinked ? (
                  <div className="flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    連携済み
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowLineLinkModal(true)}
                    className="flex items-center px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-medium transition-colors"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    LINE連携
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveTab('mypage');
                    setIsMenuOpen(false);
                  }}
                  className="ml-auto p-1"
                >
                  <UserIcon className="w-7 h-7 text-white" />
                </button>
              </div>
              
              {/* デスクトップ: オレンジバーにコイン、ポイント、交換ボタン、LINE連携、人型アイコン */}
              <div className="hidden sm:flex items-center gap-3 w-full">
                <Star className="w-6 h-6 text-orange-600" />
                <span className="text-orange-600 font-bold text-xl">{profile?.points || 0} ポイント</span>
                <button
                  onClick={() => setShowPointExchangeModal(true)}
                  className="px-4 py-1.5 bg-orange-600 text-white rounded font-semibold text-sm hover:bg-orange-700 transition-colors"
                >
                  交換
                </button>
                {isLineLinked ? (
                  <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    連携済み
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
                  onClick={() => {
                    setActiveTab('mypage');
                    setIsMenuOpen(false);
                  }}
                  className="ml-auto p-1 text-gray-700 hover:text-orange-600 transition-colors"
                >
                  <UserIcon className="w-7 h-7" />
                </button>
              </div>
            </div>
          </div>
        </header>


        <main className={`mx-auto ${
          activeTab === 'career_consultation' ? 'pb-20' : 'max-w-7xl px-0 sm:px-6 lg:px-8 pt-8 pb-20'
        }`}> 
          {activeTab !== 'career_consultation' && activeTab !== 'home' && (
            <div className="bg-white p-0 sm:p-6 mb-0 sm:mb-8">
              {personalityType && (
                <div className="grid grid-cols-5 gap-0 sm:gap-6">
                  {/* 左側2/5: 動画 */}
                  <div className="col-span-2 flex items-center justify-center">
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
                        return (
                          <video
                            src={`/character/${videoType}.mp4`}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-lg"
                          />
                        );
                      }
                      return null;
                    })()}
              </div>
                  
                  {/* 右側3/5: 吹き出し（タイプを含む） */}
                  <div className="col-span-3 flex items-center justify-center">
                    {characterTip && personalityType && (
                      <div className="bg-white rounded-lg shadow-lg px-3 py-2 sm:px-4 sm:py-3 border-2 border-orange-300 relative w-full max-w-[216px] sm:max-w-[288px] h-[105px] sm:h-[120px] flex flex-col justify-center">
                        <div className="text-xs sm:text-sm text-gray-800 font-medium text-center leading-tight overflow-hidden flex flex-col justify-center h-full">
                          <p className="mb-1 flex-shrink-0">
                            あなたは、<span className="text-base sm:text-lg font-bold text-purple-600">{personalityType}</span>タイプ！
                          </p>
                          <p className="text-[12pt] leading-tight flex-1 overflow-hidden whitespace-pre-line">{characterTip.content}</p>
              </div>
                        {/* 吹き出しのしっぽ（左側に向かって） */}
                        <div className="absolute top-1/2 left-0 transform -translate-x-full -translate-y-1/2">
                          <div className="w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-orange-300"></div>
                          <div className="absolute top-1/2 left-0.5 transform -translate-y-1/2 w-0 h-0 border-t-7 border-b-7 border-r-7 border-transparent border-r-white"></div>
                        </div>
                      </div>
                    )}
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
                <div className="border-b border-gray-200 bg-white">
                  {/* 上段: 8つの価値観から選択 */}
                  <button
                    onClick={() => setShowValueFilter(true)}
                    className={`w-full flex items-center gap-3 px-4 sm:px-6 py-4 sm:py-5 transition-all duration-200 group border-b border-gray-300 ${
                      selectedValues.length > 0 ? 'bg-purple-50' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      selectedValues.length > 0 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-orange-400 bg-white group-hover:border-orange-500'
                    }`}>
                      <Heart className={`w-5 h-5 ${selectedValues.length > 0 ? 'text-orange-600' : 'text-orange-500'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-base sm:text-lg font-bold text-gray-900">
                        8つの価値観から選択
                      </div>
                      {selectedValues.length > 0 && (
                        <div className="text-xs sm:text-sm text-gray-500">
                          {selectedValues.length}個選択中
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </button>

                  {/* 下段: 3つのフィルターボタン */}
                  <div className="flex items-center divide-x divide-gray-300">
                    {/* 業界選択ボタン */}
                    <button
                      onClick={() => setShowIndustryFilter(true)}
                      className={`flex-1 flex items-center gap-2 sm:gap-3 px-2 sm:px-6 py-3 sm:py-5 transition-all duration-200 group ${
                        selectedIndustries.length > 0 ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                        selectedIndustries.length > 0 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-orange-400 bg-white group-hover:border-orange-500'
                      }`}>
                        <Building className={`w-5 h-5 ${selectedIndustries.length > 0 ? 'text-orange-600' : 'text-orange-500'}`} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                          業界
                        </div>
                        {selectedIndustries.length > 0 && (
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            {selectedIndustries.length}個選択中
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 hidden sm:block" />
                    </button>

                    {/* 職種選択ボタン */}
                    <button
                      onClick={() => setShowJobTypeFilter(true)}
                      className={`flex-1 flex items-center gap-2 sm:gap-3 px-2 sm:px-6 py-3 sm:py-5 transition-all duration-200 group ${
                        selectedJobTypes.length > 0 ? 'bg-green-50' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                        selectedJobTypes.length > 0 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-orange-400 bg-white group-hover:border-orange-500'
                      }`}>
                        <Briefcase className={`w-5 h-5 ${selectedJobTypes.length > 0 ? 'text-orange-600' : 'text-orange-500'}`} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                          職種
                        </div>
                        {selectedJobTypes.length > 0 && (
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            {selectedJobTypes.length}個選択中
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 hidden sm:block" />
                    </button>

                    {/* 勤務地選択ボタン */}
                    <button
                      onClick={() => setShowLocationFilter(true)}
                      className={`flex-1 flex items-center gap-2 sm:gap-3 px-2 sm:px-6 py-3 sm:py-5 transition-all duration-200 group ${
                        selectedLocations.length > 0 ? 'bg-orange-50' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                        selectedLocations.length > 0 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-orange-400 bg-white group-hover:border-orange-500'
                      }`}>
                        <MapPin className={`w-5 h-5 ${selectedLocations.length > 0 ? 'text-orange-600' : 'text-orange-500'}`} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                          勤務地
                        </div>
                        {selectedLocations.length > 0 && (
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            {selectedLocations.length}個選択中
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 hidden sm:block" />
                    </button>
                  </div>
                </div>

                  {/* フィルター表示 */}
                  {(selectedValues.length > 0 || selectedIndustries.length > 0 || selectedPersonalityTypes.length > 0 || selectedJobTypes.length > 0 || selectedLocations.length > 0 || isMatchingSearch) && (
                    <div className="flex flex-wrap gap-2 p-4">
                      {selectedValues.map((value) => {
                        const valueOption = VALUE_OPTIONS.find(opt => opt.id === value);
                        return (
                          <span
                            key={value}
                            className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {valueOption?.label || value}
                            <button
                              onClick={() => setSelectedValues(prev => prev.filter(v => v !== value))}
                              className="ml-2 hover:text-purple-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
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
                      {selectedLocations.map((location) => (
                        <span
                          key={location}
                          className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                        >
                          {location}
                          <button
                            onClick={() => setSelectedLocations(prev => prev.filter(l => l !== location))}
                            className="ml-2 hover:text-orange-600"
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
                          setSelectedValues([]);
                          setSelectedIndustries([]);
                          setSelectedPersonalityTypes([]);
                          setSelectedJobTypes([]);
                          setSelectedLocations([]);
                          setSearchQuery('');
                          setIsMatchingSearch(false);
                          setSelectedOneCharDiffType(null);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                      >
                        すべてクリア
                      </button>
                    </div>
                  )}

                {/* 企業一覧 */}
                {isMatchingSearch && personalityType && personalityType.length === 4 ? (
                  // マッチング検索UI（完全一致 + 一文字違い）
                  <div className="p-0 sm:p-6">
                    {/* 完全一致の企業 */}
                    {(() => {
                      const exactMatchCompanies = getExactMatchCompanies(personalityType);
                      return exactMatchCompanies.length > 0 ? (
                        <div className="mb-8">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 px-4 sm:px-0">
                            「{personalityType}」の企業（完全一致）
                          </h3>
                          <div className="grid grid-cols-2 gap-2 px-2 sm:px-0 sm:gap-3">
                            {exactMatchCompanies.map((ad) => (
                      <div
                        key={ad.id}
                                className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer group bg-white"
                                onClick={() => {
                                  setSelectedAdvertisement(ad);
                                  setCompanyDetailView('info');
                                }}
                      >
                        {(() => {
                          const imageUrl = ad.image_url;
                          const optimizedUrl = getSecureImageUrl(imageUrl);
                          return (imageUrl && imageUrl.length > 0);
                        })() ? (
                                  <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden relative">
                            <img
                              src={getSecureImageUrl(ad.image_url) || ''}
                                      alt={ad.company_name || '企業情報'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                                    {/* いいね・保存ボタン */}
                                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                                      <button
                                        onClick={(e) => toggleFavorite(ad.id, e)}
                                        className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all ${
                                          favoriteCompanyIds.has(ad.id)
                                            ? 'bg-red-500 text-white'
                                            : 'bg-white/80 text-gray-600 hover:bg-white'
                                        }`}
                                        title={favoriteCompanyIds.has(ad.id) ? 'お気に入りから削除' : 'お気に入りに追加'}
                                      >
                                        <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${favoriteCompanyIds.has(ad.id) ? 'fill-current' : ''}`} />
                                      </button>
                                      <button
                                        onClick={(e) => toggleSaved(ad.id, e)}
                                        className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all ${
                                          savedCompanyIds.has(ad.id)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white/80 text-gray-600 hover:bg-white'
                                        }`}
                                        title={savedCompanyIds.has(ad.id) ? '保存から削除' : '保存する'}
                                      >
                                        <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${savedCompanyIds.has(ad.id) ? 'fill-current' : ''}`} />
                                      </button>
                                    </div>
                                    {ad.personality_type && (
                                      <div className="absolute top-12 right-2 z-10">
                                        <div className="bg-purple-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                                          {ad.personality_type}
                                        </div>
                                      </div>
                                    )}
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
                                  <div className="w-full aspect-[16/9] bg-gray-200 flex items-center justify-center relative">
                                    <Briefcase className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" />
                                    {ad.personality_type && (
                                      <div className="absolute top-2 right-2 z-10">
                                        <div className="bg-purple-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                                          {ad.personality_type}
                                        </div>
                                      </div>
                                    )}
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
                      </div>
                    ))}
                  </div>
              </div>
                      ) : null;
                    })()}

                    {/* 一文字違いのタイプ */}
                    {(() => {
                      const oneCharDiffTypes = getOneCharDiffTypes(personalityType);
                      return oneCharDiffTypes.length > 0 ? (
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 px-4 sm:px-0">
                            一文字違いのタイプ
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-2 sm:px-0">
                            {oneCharDiffTypes.map((type) => {
                              const companies = getCompaniesByType(type);
                              return (
                                <div
                                  key={type}
                                  className={`border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${
                                    selectedOneCharDiffType === type
                                      ? 'border-orange-500 bg-orange-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => setSelectedOneCharDiffType(selectedOneCharDiffType === type ? null : type)}
                                >
                                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                                    <video
                                      src={`/character/${type}.mp4`}
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="p-3 text-center">
                                    <div className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{type}</div>
                                    <div className="text-xs sm:text-sm text-gray-600">{companies.length}件の企業</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* 選択された一文字違いのタイプの企業を表示 */}
                          {selectedOneCharDiffType && (
                            <div className="mt-8">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 px-4 sm:px-0">
                                「{selectedOneCharDiffType}」の企業
                              </h3>
                              {(() => {
                                const companies = getCompaniesByType(selectedOneCharDiffType);
                                return companies.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-2 px-2 sm:px-0 sm:gap-3">
                                    {companies.map((ad) => (
                                      <div
                                        key={ad.id}
                                        className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer group bg-white"
                                        onClick={() => {
                                          setSelectedAdvertisement(ad);
                                          setCompanyDetailView('info');
                                        }}
                                      >
                                        {(() => {
                                          const imageUrl = ad.image_url;
                                          return (imageUrl && imageUrl.length > 0);
                                        })() ? (
                                          <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden relative">
                                            <img
                                              src={getSecureImageUrl(ad.image_url) || ''}
                                              alt={ad.company_name || '企業情報'}
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                              loading="lazy"
                                              referrerPolicy="no-referrer"
                                              crossOrigin="anonymous"
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                              }}
                                            />
                                            {/* いいね・保存ボタン */}
                                            <div className="absolute top-2 right-2 flex gap-2 z-10">
                                              <button
                                                onClick={(e) => toggleFavorite(ad.id, e)}
                                                className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all ${
                                                  favoriteCompanyIds.has(ad.id)
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-white/80 text-gray-600 hover:bg-white'
                                                }`}
                                                title={favoriteCompanyIds.has(ad.id) ? 'お気に入りから削除' : 'お気に入りに追加'}
                                              >
                                                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${favoriteCompanyIds.has(ad.id) ? 'fill-current' : ''}`} />
                                              </button>
                                              <button
                                                onClick={(e) => toggleSaved(ad.id, e)}
                                                className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all ${
                                                  savedCompanyIds.has(ad.id)
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white/80 text-gray-600 hover:bg-white'
                                                }`}
                                                title={savedCompanyIds.has(ad.id) ? '保存から削除' : '保存する'}
                                              >
                                                <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${savedCompanyIds.has(ad.id) ? 'fill-current' : ''}`} />
                                              </button>
                        </div>
                                            {ad.personality_type && (
                                              <div className="absolute top-12 right-2 z-10">
                                                <div className="bg-purple-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                                                  {ad.personality_type}
                                                </div>
                                              </div>
                                            )}
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
                                          <div className="w-full aspect-[16/9] bg-gray-200 flex items-center justify-center relative">
                                            <Briefcase className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" />
                                            {/* いいね・保存ボタン */}
                                            <div className="absolute top-2 right-2 flex gap-2 z-10">
                                              <button
                                                onClick={(e) => toggleFavorite(ad.id, e)}
                                                className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all ${
                                                  favoriteCompanyIds.has(ad.id)
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-white/80 text-gray-600 hover:bg-white'
                                                }`}
                                                title={favoriteCompanyIds.has(ad.id) ? 'お気に入りから削除' : 'お気に入りに追加'}
                                              >
                                                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${favoriteCompanyIds.has(ad.id) ? 'fill-current' : ''}`} />
                                              </button>
                                              <button
                                                onClick={(e) => toggleSaved(ad.id, e)}
                                                className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all ${
                                                  savedCompanyIds.has(ad.id)
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white/80 text-gray-600 hover:bg-white'
                                                }`}
                                                title={savedCompanyIds.has(ad.id) ? '保存から削除' : '保存する'}
                                              >
                                                <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${savedCompanyIds.has(ad.id) ? 'fill-current' : ''}`} />
                                              </button>
                                            </div>
                                            {ad.personality_type && (
                                              <div className="absolute top-12 right-2 z-10">
                                                <div className="bg-purple-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                                                  {ad.personality_type}
                                                </div>
                                              </div>
                                            )}
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
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 px-4">
                                    <p className="text-gray-600">このタイプの企業は見つかりませんでした。</p>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  // 通常のフィルター適用結果
                  filteredAdvertisements.length === 0 ? (
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
                          <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden relative">
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
                            {/* いいね・保存ボタン */}
                            <div className="absolute top-2 right-2 flex gap-2 z-10">
                              <button
                                onClick={(e) => toggleFavorite(ad.id, e)}
                                className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all ${
                                  favoriteCompanyIds.has(ad.id)
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white/80 text-gray-600 hover:bg-white'
                                }`}
                                title={favoriteCompanyIds.has(ad.id) ? 'お気に入りから削除' : 'お気に入りに追加'}
                              >
                                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${favoriteCompanyIds.has(ad.id) ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                onClick={(e) => toggleSaved(ad.id, e)}
                                className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all ${
                                  savedCompanyIds.has(ad.id)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/80 text-gray-600 hover:bg-white'
                                }`}
                                title={savedCompanyIds.has(ad.id) ? '保存から削除' : '保存する'}
                              >
                                <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${savedCompanyIds.has(ad.id) ? 'fill-current' : ''}`} />
                              </button>
                </div>
                            {ad.personality_type && (
                              <div className="absolute top-12 right-2 z-10">
                                <div className="bg-purple-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                                  {ad.personality_type}
                                </div>
                              </div>
                            )}
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
                          <div className="w-full aspect-[16/9] bg-gray-200 flex items-center justify-center relative">
                            <Briefcase className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" />
                            {/* いいね・保存ボタン */}
                            <div className="absolute top-2 right-2 flex gap-2 z-10">
                              <button
                                onClick={(e) => toggleFavorite(ad.id, e)}
                                className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all ${
                                  favoriteCompanyIds.has(ad.id)
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white/80 text-gray-600 hover:bg-white'
                                }`}
                                title={favoriteCompanyIds.has(ad.id) ? 'お気に入りから削除' : 'お気に入りに追加'}
                              >
                                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${favoriteCompanyIds.has(ad.id) ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                onClick={(e) => toggleSaved(ad.id, e)}
                                className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all ${
                                  savedCompanyIds.has(ad.id)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/80 text-gray-600 hover:bg-white'
                                }`}
                                title={savedCompanyIds.has(ad.id) ? '保存から削除' : '保存する'}
                              >
                                <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${savedCompanyIds.has(ad.id) ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                            {ad.personality_type && (
                              <div className="absolute top-12 right-2 z-10">
                                <div className="bg-purple-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                                  {ad.personality_type}
                                </div>
                              </div>
                            )}
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
                      </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* 企業紹介セクション */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
                      <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600" />
                      企業紹介
                    </h2>
                    <button
                      onClick={() => setActiveTab('recruitment')}
                      className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center"
                    >
                      もっと見る
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                  {recentCompanyPairs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>企業はありません</p>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden">
                      <div 
                        className="flex"
                        style={{ 
                          transform: `translateX(-${companySlideIndex * 100}%)`,
                          transition: isCompanyTransitioning ? 'transform 0.5s ease-in-out' : 'none'
                        }}
                      >
                        {recentCompanyPairs.map((pair, pairIndex) => (
                          <div key={`${pairIndex}-${pair[0]?.id || pairIndex}`} className="min-w-full grid grid-cols-2 gap-3 sm:gap-4">
                            {pair.map((ad) => (
                              <div
                                key={ad.id}
                                className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer group bg-white"
                                onClick={() => {
                                  setSelectedAdvertisement(ad);
                                  setCompanyDetailView('info');
                                }}
                              >
                                {(() => {
                                  const imageUrl = ad.image_url;
                                  return (imageUrl && imageUrl.length > 0);
                                })() ? (
                                  <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden relative">
                                    <img
                                      src={getSecureImageUrl(ad.image_url) || ''}
                                      alt={ad.company_name || '企業情報'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                      referrerPolicy="no-referrer"
                                      crossOrigin="anonymous"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute top-2 left-2">
                                      <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full">
                                        NEW
                                      </span>
                                    </div>
                                    {ad.personality_type && (
                                      <div className="absolute top-2 right-2 z-10">
                                        <div className="bg-purple-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                                          {ad.personality_type}
                                        </div>
                                      </div>
                                    )}
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
                                  <div className="w-full aspect-[16/9] bg-gray-200 flex items-center justify-center relative">
                                    <Briefcase className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" />
                                    <div className="absolute top-2 left-2">
                                      <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full">
                                        NEW
                                      </span>
                                    </div>
                                    {ad.personality_type && (
                                      <div className="absolute top-2 right-2 z-10">
                                        <div className="bg-purple-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                                          {ad.personality_type}
                                        </div>
                                      </div>
                                    )}
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
                              </div>
                            ))}
                            {/* ペアが1つしかない場合は空のスロットを追加 */}
                            {pair.length === 1 && <div></div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 掲示板セクション */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
                      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600" />
                      掲示板
                    </h2>
                    <button
                      onClick={() => setActiveTab('bulletin_board')}
                      className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center"
                    >
                      もっと見る
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                  <HomeBulletinBoardPosts />
                </div>

                {/* バナーセクション */}
                <div className="space-y-3 px-4 sm:px-6">
                  {/* 現在のポイント バナー */}
                  <div
                    onClick={() => setShowPointExchangeModal(true)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg px-4 py-3 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center justify-center text-center">
                      <span className="text-white text-sm font-medium">現在のポイント <span className="font-bold">{profile?.points || 0} ポイント</span></span>
                    </div>
                  </div>

                  {/* 今日のクイズに回答する バナー */}
                  <div
                    onClick={() => {
                      if (availableQuizzes.length > 0) {
                        handleQuizClick(availableQuizzes[0]);
                      } else {
                        setActiveTab('surveys');
                      }
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg px-4 py-3 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center justify-center text-center">
                      <span className="text-white text-sm font-medium">今日のクイズに回答する</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bulletin_board' && (
              <BulletinBoardDisplay />
            )}

            {activeTab === 'mypage' && (
              <div className="space-y-0">
                {/* プロフィール設定 */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 flex items-center">
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600" />
                    プロフィール設定
                  </h2>
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                    }}
                    className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center"
                  >
                    <UserIcon className="w-5 h-5 mr-2" />
                    プロフィールを編集
                  </button>
                </div>

                {/* 価値観診断 */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 flex items-center">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600" />
                    価値観診断
                  </h2>
                  {personalityType ? (
                    <div className="mb-3 space-y-3">
                      <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-bold text-lg">
                        {personalityType}
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('character');
                        }}
                        className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center"
                      >
                        <UserIcon className="w-5 h-5 mr-2" />
                        キャラクター紹介を見る
                      </button>
                    </div>
                  ) : null}
                  <button
                    onClick={() => {
                      setShowPersonalityAssessmentModal(true);
                    }}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    {personalityType ? '診断を再受ける' : '診断を受ける'}
                  </button>
                </div>

                {/* ログアウト */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 flex items-center">
                    <LogOut className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-red-600" />
                    ログアウト
                  </h2>
                  <button
                    onClick={() => {
                      signOut();
                    }}
                    className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    ログアウト
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'character' && (
              <div className="space-y-6">
                {personalityType ? (() => {
                  // パーソナリティタイプが "/" を含む場合、最初の4文字を取得
                  let typeCode = personalityType;
                  if (personalityType.includes('/')) {
                    const parts = personalityType.replace(/\//g, '').substring(0, 4);
                    if (parts.length === 4) {
                      typeCode = parts;
                    }
                  }
                  const typeInfo = personalityTypes[typeCode];
                  
                  return typeInfo ? (
                    <>
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                              {typeInfo.name}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600">{typeInfo.description}</p>
                          </div>
                          <button
                            onClick={() => setActiveTab('mypage')}
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>

                        {/* キャラクターカードと説明文のレイアウト */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {/* 左側：キャラクターカード */}
                          <div className="flex flex-col items-center">
                            <div className="relative mb-4 w-full max-w-sm">
                              <video
                                src={`/character_card/${typeCode}.mp4`}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full rounded-lg"
                              />
                            </div>
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/character_card/${typeCode}.mp4`;
                                link.download = `${typeInfo.code}_${typeInfo.name}_キャラクターカード.mp4`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                            >
                              <Download className="w-5 h-5" />
                              キャラクターカードをダウンロード
                            </button>
                          </div>

                          {/* 右側：説明文 */}
                          <div className="space-y-6">
                          {/* 基本性格 */}
                          <section className="bg-white border-2 border-purple-200 rounded-lg p-4 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center">
                              <span className="text-2xl mr-2">🧭</span>
                              基本性格
                            </h3>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                              {typeInfo.details.basicPersonality}
                            </p>
                          </section>

                          {/* 得意分野 */}
                          <section className="bg-white border-2 border-green-200 rounded-lg p-4 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center">
                              <span className="text-2xl mr-2">💡</span>
                              得意分野
                            </h3>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                              {typeInfo.details.strengths}
                            </p>
                          </section>

                          {/* 苦手分野 */}
                          <section className="bg-white border-2 border-yellow-200 rounded-lg p-4 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center">
                              <span className="text-2xl mr-2">🪫</span>
                              苦手分野
                            </h3>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                              {typeInfo.details.weaknesses}
                            </p>
                          </section>

                          {/* 仕事の価値観 */}
                          <section className="bg-white border-2 border-blue-200 rounded-lg p-4 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center">
                              <span className="text-2xl mr-2">💬</span>
                              仕事の価値観
                            </h3>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                              {typeInfo.details.workValues}
                            </p>
                          </section>

                          {/* あなたの強み */}
                          <section className="bg-white border-2 border-purple-200 rounded-lg p-4 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center">
                              <span className="text-2xl mr-2">💎</span>
                              あなたの強み
                            </h3>
                            <ul className="space-y-2">
                              {typeInfo.details.keyStrengths.map((strength, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-purple-600 mr-2 font-bold">•</span>
                                  <span className="text-sm sm:text-base text-gray-700">{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </section>

                          {/* 活躍しやすい職場 */}
                          <section className="bg-white border-2 border-orange-200 rounded-lg p-4 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center">
                              <span className="text-2xl mr-2">🏢</span>
                              活躍しやすい職場
                            </h3>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                              {typeInfo.details.idealWorkplaces}
                            </p>
                          </section>

                          {/* 就活の軸 */}
                          <section className="bg-white border-2 border-pink-200 rounded-lg p-4 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center">
                              <span className="text-2xl mr-2">🎯</span>
                              就活の軸（傾向）
                            </h3>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                              {typeInfo.details.jobHuntingAxis}
                            </p>
                          </section>

                          {/* まとめ */}
                          <section className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center">
                              <span className="text-2xl mr-2">🪞</span>
                              まとめ
                            </h3>
                            <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-medium whitespace-pre-line">
                              {typeInfo.details.summary}
                            </p>
                          </section>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">キャラクター紹介</h1>
                        <button
                          onClick={() => setActiveTab('mypage')}
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <p className="text-gray-600 text-center">
                        パーソナリティタイプ「{personalityType}」の詳細情報が見つかりませんでした。
                      </p>
                    </div>
                  );
                })() : (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">キャラクター紹介</h1>
                    <p className="text-gray-600 mb-6">
                      キャラクター紹介を見るには、まず価値観診断を受けてください。
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('mypage');
                        setShowPersonalityAssessmentModal(true);
                      }}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                      価値観診断を受ける
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="max-w-7xl mx-auto flex justify-around h-[83.2px] sm:h-[104px]">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center w-full text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'home' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1" />
            <span className="hidden sm:inline">ホーム</span>
            <span className="sm:hidden">ホーム</span>
          </button>
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
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <div className="relative min-h-full">
              <button
                onClick={() => {
                  setSelectedAdvertisement(null);
                  setCompanyDetailView('info'); // モーダルを閉じる際に表示モードをリセット
                }}
                className="fixed top-4 right-4 z-50 bg-white rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all hover:scale-110 text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4" />
              </button>

              {/* ヘッダー - 白背景にオレンジテキスト */}
              <div className="bg-white p-4 sm:p-8 pb-4 sm:pb-6 pt-12 sm:pt-16">
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

              <div className="p-4 sm:p-8">
                {/* 企業情報タブの内容 */}
                {companyDetailView === 'info' && (
                  <>
                {/* 目指すべき未来（上部、全幅） */}
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
              
                {/* 画像と企業概要を横並び（デスクトップ）または縦並び（モバイル） */}
                <div className="mb-8 flex flex-col md:flex-row gap-6 md:gap-8">
                  {/* 画像（左側、デスクトップ / 上側、モバイル） */}
                  {selectedAdvertisement.image_url && getSecureImageUrl(selectedAdvertisement.image_url) && (
                    <div className="w-full md:w-1/2 flex-shrink-0">
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
                  
                  {/* 企業概要（右側、デスクトップ） */}
                  <div className={`${selectedAdvertisement.image_url && getSecureImageUrl(selectedAdvertisement.image_url) ? 'w-full md:w-1/2' : 'w-full'}`}>
                    <div className="flex items-center mb-4">
                      <Building className="w-6 h-6 text-orange-600 mr-2" />
                      <h3 className="text-sm sm:text-2xl font-bold text-gray-800">企業概要</h3>
                    </div>
                  <div className="space-y-0 rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">代表者名</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.representative_name) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">設立年</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{displayValue(selectedAdvertisement.establishment_year) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">所在地（本社）</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.headquarters_location) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">所在地（支社）</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.branch_office_location) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">従業員数</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{displayValue(selectedAdvertisement.employee_count) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">男女比</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.employee_gender_ratio) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">平均年齢</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{displayValue(selectedAdvertisement.employee_avg_age) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">業界</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{displayValue(selectedAdvertisement.industries) || '-'}</div>
                    </div>
                    <div className="bg-orange-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-orange-700">イチオシポイント</div>
                    </div>
                    <div className="bg-orange-50 p-3">
                      <div className="text-sm sm:text-base text-orange-800 font-medium">
                            {[
                              displayValue(selectedAdvertisement.highlight_point_1),
                              displayValue(selectedAdvertisement.highlight_point_2),
                              displayValue(selectedAdvertisement.highlight_point_3)
                        ].filter(Boolean).length > 0 ? (
                          [
                            displayValue(selectedAdvertisement.highlight_point_1),
                            displayValue(selectedAdvertisement.highlight_point_2),
                            displayValue(selectedAdvertisement.highlight_point_3)
                          ].filter(Boolean).map((point, index) => (
                            <div key={index} className={index > 0 ? 'mt-2' : ''} style={{ whiteSpace: 'pre-wrap' }}>{point}</div>
                          ))
                        ) : '-'}
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <DollarSign className="w-6 h-6 text-orange-600 mr-2" />
                    <h3 className="text-sm sm:text-2xl font-bold text-gray-800">募集・待遇情報</h3>
                  </div>
                  <div className="space-y-0 rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">初任給</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.starting_salary) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">3年定着率</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.three_year_retention_rate) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">20代平均年収</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.avg_annual_income_20s) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">30代平均年収</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.avg_annual_income_30s) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">キャリアパス</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.promotion_model_case) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">募集職種とその人数</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.recruitment_roles_count) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">選考フロー</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">
                            {selectedAdvertisement.selection_flow_steps && selectedAdvertisement.selection_flow_steps.length > 0 
                              ? selectedAdvertisement.selection_flow_steps.join(' → ') 
                          : '-'}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">必須資格・免許</div>
                    </div>
                    <div className="bg-white p-3">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.required_qualifications) || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Sparkles className="w-6 h-6 text-orange-600 mr-2" />
                    <h3 className="text-sm sm:text-2xl font-bold text-gray-800">働き方・福利厚生</h3>
                  </div>
                  <div className="space-y-0 rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">勤務時間</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.working_hours) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">休日</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.holidays) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">年間休日数</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.annual_holidays) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">リモートワーク</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{formatBoolean(selectedAdvertisement.remote_work_available)}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">副業</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{formatBoolean(selectedAdvertisement.side_job_allowed)}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">住宅手当</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{formatBoolean(selectedAdvertisement.housing_allowance_available)}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">女性育休取得率</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.female_parental_leave_rate) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">男性育休取得率</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.male_parental_leave_rate) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">異動/転勤</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">
                            {formatBoolean(selectedAdvertisement.transfer_existence)}
                            {displayValue(selectedAdvertisement.transfer_frequency) && ` (${displayValue(selectedAdvertisement.transfer_frequency)})`}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">社内イベント頻度</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.internal_event_frequency) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">健康経営の取り組み</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{displayValue(selectedAdvertisement.health_management_practices) || '-'}</div>
                    </div>
                    <div className="bg-orange-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-orange-700">イチオシ福利厚生</div>
                    </div>
                    <div className="bg-orange-50 p-3">
                      <div className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{displayValue(selectedAdvertisement.must_tell_welfare) || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Users className="w-6 h-6 text-orange-600 mr-2" />
                    <h3 className="text-sm sm:text-2xl font-bold text-gray-800">採用情報</h3>
                  </div>
                  <div className="space-y-0 rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">採用担当部署（担当者）</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.recruitment_department) || '-'}</div>
                    </div>
                    <div className={`bg-gray-50 p-3 ${selectedAdvertisement.recruitment_info_page_url ? 'border-b border-gray-200' : ''}`}>
                      <div className="text-sm font-semibold text-gray-700">採用に関する問い合わせ先</div>
                    </div>
                    <div className={`bg-white p-3 ${selectedAdvertisement.recruitment_info_page_url ? 'border-b border-gray-200' : ''}`}>
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.recruitment_contact) || '-'}</div>
                    </div>
                        {selectedAdvertisement.recruitment_info_page_url && (
                      <>
                        <div className="bg-gray-50 p-3 border-b border-gray-200">
                          <div className="text-sm font-semibold text-gray-700">採用情報ページ</div>
                        </div>
                        <div className="bg-white p-3">
                          <div className="text-sm sm:text-base">
                              <a 
                                href={selectedAdvertisement.recruitment_info_page_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold"
                              >
                                採用情報ページを見る
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                          </div>
                        </div>
                      </>
                        )}
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Target className="w-6 h-6 text-orange-600 mr-2" />
                    <h3 className="text-sm sm:text-2xl font-bold text-gray-800">インターンシップ情報</h3>
                  </div>
                  <div className="space-y-0 rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">実施予定</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{formatBoolean(selectedAdvertisement.internship_scheduled, '実施予定あり', '実施予定なし')}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">実施日程</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.internship_schedule) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">定員</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{displayValue(selectedAdvertisement.internship_capacity) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">対象学生</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{displayValue(selectedAdvertisement.internship_target_students) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">実施場所</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{displayValue(selectedAdvertisement.internship_locations) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">内容</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{displayValue(selectedAdvertisement.internship_content_types) || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-700">報酬</div>
                    </div>
                    <div className="bg-white p-3 border-b border-gray-200">
                      <div className="text-sm sm:text-base text-gray-900">{displayValue(selectedAdvertisement.internship_paid_unpaid) || '-'}</div>
                    </div>
                    <div className={`bg-gray-50 p-3 ${selectedAdvertisement.internship_application_url ? 'border-b border-gray-200' : ''}`}>
                      <div className="text-sm font-semibold text-gray-700">交通費・宿泊費</div>
                    </div>
                    <div className={`bg-white p-3 ${selectedAdvertisement.internship_application_url ? 'border-b border-gray-200' : ''}`}>
                      <div className="text-sm sm:text-base text-gray-900">{formatBoolean(selectedAdvertisement.transport_lodging_stipend, '支給あり', '支給なし')}</div>
                    </div>
                        {selectedAdvertisement.internship_application_url && (
                      <>
                        <div className="bg-gray-50 p-3 border-b border-gray-200">
                          <div className="text-sm font-semibold text-gray-700">申込</div>
                        </div>
                        <div className="bg-white p-3">
                          <div className="text-sm sm:text-base">
                              <a 
                                href={selectedAdvertisement.internship_application_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold"
                              >
                                インターンシップに申し込む
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                          </div>
                        </div>
                      </>
                        )}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <MessageCircle className="w-6 h-6 text-orange-600 mr-2" />
                    <h3 className="text-sm sm:text-2xl font-bold text-gray-800">SNS・外部リンク</h3>
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
                          <p className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
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
                        <p className="text-sm text-gray-600">この企業のパーソナリティ診断結果はまだ登録されていません</p>
            </div>
                    )}
                  </div>
                )}
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

      {showLocationFilter && (
        <LocationFilterModal
          selectedLocations={selectedLocations}
          onClose={() => setShowLocationFilter(false)}
          onApply={(locations) => {
            setSelectedLocations(locations);
            setShowLocationFilter(false);
          }}
        />
      )}

      {showValueFilter && (
        <ValueFilterModal
          selectedValues={selectedValues}
          onClose={() => setShowValueFilter(false)}
          onApply={(values) => {
            setSelectedValues(values);
            setShowValueFilter(false);
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
