'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle, CheckCircle, Sparkles, FileText } from 'lucide-react';

// 型定義
interface Company {
  id: string;
  company_name: string;
  culture_description: string;
  recommended_points: string[];
  [key: string]: any; 
}

interface StudentProfileSurvey {
  user_id: string;
  coreValues?: string[];
  [key: string]: any;
}

export function MatchingFeature() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      // .select() with `head: true` is more efficient for just checking existence
      const { error, count } = await supabase
        .from('monitor_profile_survey')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Error checking profile existence:", error);
        setProfileExists(false);
        return;
      }
      
      setProfileExists(count !== null && count > 0);
    };
    checkProfile();
  }, [user]);

  const handleStartAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setAnalysisSteps([]);

    try {
      // Step 0: データの取得
      if (!user) throw new Error("ユーザー情報が見つかりません。");

      const { data: studentProfile, error: profileError } = await supabase
        .from('monitor_profile_survey')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError || !studentProfile) {
        throw new Error("マッチングには、まずプロフィールアンケートへの回答が必要です。");
      }
      
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true);

      if (companiesError) throw companiesError;
      if (!companies || companies.length === 0) throw new Error("分析対象の企業データが見つかりません。");

      // --- マルチLLMパイプライン（シミュレーション） ---
      
      // Step 1: Geminiによるペルソナ分析
      await new Promise(resolve => setTimeout(resolve, 1500));
      const geminiResult = simulateGeminiAnalysis(studentProfile);
      setAnalysisSteps(prev => [...prev, 'あなたの価値観を解析しました [Gemini]']);

      // Step 2: Claudeによる深層マッチング
      await new Promise(resolve => setTimeout(resolve, 2000));
      const claudeResult = simulateClaudeScoring(geminiResult, companies);
      setAnalysisSteps(prev => [...prev, '企業文化との深層マッチングを実行しました [Claude 3]']);

      // Step 3: GPT-4による推薦文生成
      await new Promise(resolve => setTimeout(resolve, 2000));
      const finalRecommendations = claudeResult.map(res => simulateGpt4Copywriting(res, studentProfile));
      setAnalysisSteps(prev => [...prev, 'パーソナライズ推薦文を作成しました [GPT-4]']);

      setResults(finalRecommendations);

    } catch (err) {
      setError(err instanceof Error ? err.message : '分析中に不明なエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  if (profileExists === null) {
    return <div className="text-center p-8"><Loader2 className="animate-spin mx-auto" /></div>;
  }

  if (!profileExists) {
    return (
        <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">はじめにプロフィールを登録しましょう</h3>
            <p className="text-gray-600 mb-4">AIによるキャリア診断には、詳細なプロフィールアンケートへの回答が必要です。</p>
            <p className="text-gray-500 text-sm">（右上のメニュー &gt; プロフィールアンケート から回答できます）</p>
        </div>
    );
  }

  return (
    <div>
      {!isLoading && results.length === 0 && (
        <div className="text-center p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-2">AIキャリア診断</h3>
          <p className="text-gray-600 mb-6">あなたのプロフィールアンケートの回答を基に、AIが価値観に合った企業を推薦します。</p>
          <button
            onClick={handleStartAnalysis}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center mx-auto"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            診断を開始する
          </button>
        </div>
      )}

      {isLoading && (
        <div className="processing-container">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-6">AIがあなたに最適な企業を分析中...</h2>
          <div className="steps space-y-3 text-left max-w-sm mx-auto">
            {analysisSteps.map((step, index) => (
              <div key={index} className="step completed flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" /> {error}
        </div>
      )}

      {!isLoading && results.length > 0 && (
         <div className="space-y-6">
            {results.map((rec, index) => (
                rec && (
                <article key={index} className="company-card">
                    <header>
                    <h3>{rec.company.company_name}</h3>
                    <div className="score-display">
                        <div>成長可能性: <span className="score-bar" style={{width:`${rec.scores.growth*10}%`}}></span> {rec.scores.growth}/10</div>
                        <div>文化フィット: <span className="score-bar" style={{width:`${rec.scores.culture*10}%`}}></span> {rec.scores.culture}/10</div>
                        <div>働きやすさ: <span className="score-bar" style={{width:`${rec.scores.wlb*10}%`}}></span> {rec.scores.wlb}/10</div>
                    </div>
                    </header>
                    <section className="match-points">
                    <h4>あなたへの推薦理由 [by GPT-4]</h4>
                    <p dangerouslySetInnerHTML={{ __html: rec.personalizedReason }} />
                    </section>
                    <div className="action-links">
                        <a href="#" className="primary-action">企業の詳細を見る</a>
                    </div>
                </article>
                )
            ))}
         </div>
      )}
    </div>
  );
}


// ===== 以下、マルチLLMパイプラインシミュレーション関数群 =====

function simulateGeminiAnalysis(profile: StudentProfileSurvey) {
    const coreValues = new Set(profile.important_points || []);
    const allText = (profile.lively_work_state || '') + (profile.job_satisfaction_moments || '');
    if (allText.includes('挑戦')) coreValues.add('挑戦');
    if (allText.includes('成長')) coreValues.add('成長実感');
    if (allText.includes('チーム') || allText.includes('協力')) coreValues.add('チームワーク');
    
    return {
        coreValues: Array.from(coreValues),
        welfarePriorities: profile.important_benefits || [],
        hardConditions: { locations: profile.job_hunting_areas, industries: profile.interested_industries },
    };
}

function simulateClaudeScoring(geminiOutput: any, db: Company[]) {
    return db.map(company => {
        let scores = { growth: 5, culture: 5, wlb: 5 };
        let analysis: string[] = []; // ★★★★★ ここを修正 ★★★★★

        // Check for any match in locations and industries
        const locationMatch = geminiOutput.hardConditions.locations.length === 0 || geminiOutput.hardConditions.locations.some((loc: string) => company.location_info?.includes(loc));
        const industryMatch = geminiOutput.hardConditions.industries.length === 0 || geminiOutput.hardConditions.industries.some((ind: string) => company.industry?.includes(ind));

        if (!locationMatch || !industryMatch) {
            return null;
        }

        geminiOutput.coreValues.forEach((value: string) => {
            if (company.recommended_points?.includes(value)) {
                scores.culture += 2;
                analysis.push(`価値観「${value}」が企業の強みと一致。`);
            }
            if (value === '成長できる環境') scores.growth += 3;
        });

        geminiOutput.welfarePriorities.forEach((welfare: string) => {
            if (company.training_support?.includes(welfare) || company.long_holidays?.includes(welfare)) {
                scores.wlb += 2;
                analysis.push(`重視する福利厚生「${welfare}」が充実。`);
            }
        });
        
        Object.keys(scores).forEach(key => (scores as any)[key] = Math.max(0, Math.min(10, (scores as any)[key])));

        return { company, scores, analysis, totalScore: scores.growth + scores.culture + scores.wlb };
    }).filter(Boolean).sort((a, b) => (b as any)!.totalScore - (a as any)!.totalScore);
}

function simulateGpt4Copywriting(claudeResult: any, profile: StudentProfileSurvey) {
    if (!claudeResult) return null;
    const { company } = claudeResult;
    let reason = `**${company.company_name}**がおすすめです。<br>`;

    if (profile.job_satisfaction_moments && profile.job_satisfaction_moments.length > 0) {
        reason += `あなたが働きがいに感じる「${profile.job_satisfaction_moments[0]}」という想い。`;
        if (company.culture_description?.includes('挑戦')) {
            reason += 'この会社の挑戦を歓迎する文化は、その想いを実現する最高の舞台です。<br>';
        } else if (company.culture_description?.includes('チーム')) {
            reason += 'この会社のチームワークを重んじる文化なら、そのやりがいを日々感じられるでしょう。<br>';
        }
    }
    return { ...claudeResult, personalizedReason: reason };
}
