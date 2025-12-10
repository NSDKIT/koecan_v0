'use client'

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, BarChart3, Users } from 'lucide-react';
import { supabase } from '@/config/supabase';

interface PersonalityResult {
  id: string;
  category_type: 'job_type' | 'years_of_service';
  category_value: string;
  personality_type: string;
  response_count: number;
  market_engagement_score: number;
  growth_strategy_score: number;
  organization_style_score: number;
  decision_making_score: number;
}

interface CompanyPersonalityStatisticsProps {
  jobTypeResults: PersonalityResult[]; // 職種別の結果
  yearsResults: PersonalityResult[];    // 年代別の結果
  companyId: string; // 個別回答データを取得するために必要
  studentAxes?: Record<string, number> | null;
}

// スコアを0-100の範囲に正規化
const normalizeScore = (score: number): number => {
  return Math.abs(score) * 50; // -2から+2の範囲を0-100に変換
};

// 統計値を計算
const calculateStatistics = (values: number[]) => {
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      stdDev: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return { mean, median, min, max, stdDev };
};

export function CompanyPersonalityStatistics({ 
  jobTypeResults,
  yearsResults,
  companyId,
  studentAxes
}: CompanyPersonalityStatisticsProps) {
  const [individualData, setIndividualData] = React.useState<any[]>([]);

  // 個別回答データを取得
  React.useEffect(() => {
    const fetchIndividualData = async () => {
      try {
        const { data, error } = await supabase
          .from('company_personality_individual_responses')
          .select('*')
          .eq('company_id', companyId);

        if (error) throw error;
        setIndividualData(data || []);
      } catch (err) {
        console.error('Error fetching individual data:', err);
        setIndividualData([]);
      }
    };

    if (companyId) {
      fetchIndividualData();
    }
  }, [companyId]);
  
  // UI値（1-5）をDB値（-2〜+2）に変換
  const convertUIToDB = (uiValue: number): number => {
    return uiValue - 3; // 1→-2, 2→-1, 3→0, 4→+1, 5→+2
  };

  // カテゴリー別の積み上げ棒グラフ用データを準備
  // 横軸を対極の値（E~I、N~S、P~R、F~O）にして、各職種/年代を色分け
  // 横軸は元のスコア値（-2から+2）を使用
  // 縦軸はそのスコア値を持つ人の数（回答者数）
  const prepareCategoryBarData = (
    results: PersonalityResult[],
    categoryType: 'market' | 'growth' | 'org' | 'decision',
    viewType: 'job' | 'years'
  ) => {
    // 横軸の値（-2から+2）ごとに、各職種/年代の回答者数を集計
    const dataMap = new Map<number, Record<string, number>>();
    
    // 個別回答データから各スコア値ごとの人数を集計
    individualData.forEach((row: any) => {
      let score = 0;
      let categoryValue = '';

      // カテゴリーに応じてスコアを計算
      switch (categoryType) {
        case 'market':
          const marketQ1 = convertUIToDB(row.market_engagement_q1 || 0);
          const marketQ2 = convertUIToDB(row.market_engagement_q2 || 0);
          const marketQ3 = convertUIToDB(row.market_engagement_q3 || 0);
          score = (marketQ1 + marketQ2 + marketQ3) / 3; // 平均値
          break;
        case 'growth':
          const growthQ1 = convertUIToDB(row.growth_strategy_q1 || 0);
          const growthQ2 = convertUIToDB(row.growth_strategy_q2 || 0);
          const growthQ3 = convertUIToDB(row.growth_strategy_q3 || 0);
          const growthQ4 = convertUIToDB(row.growth_strategy_q4 || 0);
          score = (growthQ1 + growthQ2 + growthQ3 + growthQ4) / 4; // 平均値
          break;
        case 'org':
          const orgQ1 = convertUIToDB(row.organization_style_q1 || 0);
          const orgQ2 = convertUIToDB(row.organization_style_q2 || 0);
          const orgQ3 = convertUIToDB(row.organization_style_q3 || 0);
          score = (orgQ1 + orgQ2 + orgQ3) / 3; // 平均値
          break;
        case 'decision':
          const decisionQ1 = convertUIToDB(row.decision_making_q1 || 0);
          const decisionQ2 = convertUIToDB(row.decision_making_q2 || 0);
          const decisionQ3 = convertUIToDB(row.decision_making_q3 || 0);
          score = (decisionQ1 + decisionQ2 + decisionQ3) / 3; // 平均値
          break;
      }

      // カテゴリー値（職種または年代）を取得
      categoryValue = viewType === 'job' 
        ? (row.job_type || '不明')
        : (row.years_of_service || '不明');

      // 選択されたカテゴリーに該当するかチェック
      const isValidCategory = results.some(r => r.category_value === categoryValue);
      if (!isValidCategory) return;

      // スコアを丸めてキーにする（例: -2.0, -1.5, -1.0, ..., 0, ..., 1.0, 1.5, 2.0）
      // 0.5刻みで丸める
      const roundedValue = Math.round(score * 2) / 2;

      if (!dataMap.has(roundedValue)) {
        dataMap.set(roundedValue, {});
      }

      const categoryData = dataMap.get(roundedValue)!;
      // 縦軸（積み上げの高さ）はそのスコア値を持つ人の数
      categoryData[categoryValue] = (categoryData[categoryValue] || 0) + 1;
    });

    // Mapを配列に変換してソート
    return Array.from(dataMap.entries())
      .map(([xValue, categories]) => ({
        xValue,
        ...categories
      }))
      .sort((a, b) => a.xValue - b.xValue);
  };

  // 職種別データ
  const jobMarketData = useMemo(() => prepareCategoryBarData(jobTypeResults, 'market', 'job'), [jobTypeResults, individualData]);
  const jobGrowthData = useMemo(() => prepareCategoryBarData(jobTypeResults, 'growth', 'job'), [jobTypeResults, individualData]);
  const jobOrgData = useMemo(() => prepareCategoryBarData(jobTypeResults, 'org', 'job'), [jobTypeResults, individualData]);
  const jobDecisionData = useMemo(() => prepareCategoryBarData(jobTypeResults, 'decision', 'job'), [jobTypeResults, individualData]);

  // 年代別データ
  const yearsMarketData = useMemo(() => prepareCategoryBarData(yearsResults, 'market', 'years'), [yearsResults, individualData]);
  const yearsGrowthData = useMemo(() => prepareCategoryBarData(yearsResults, 'growth', 'years'), [yearsResults, individualData]);
  const yearsOrgData = useMemo(() => prepareCategoryBarData(yearsResults, 'org', 'years'), [yearsResults, individualData]);
  const yearsDecisionData = useMemo(() => prepareCategoryBarData(yearsResults, 'decision', 'years'), [yearsResults, individualData]);

  // 職種別・年代別の色を準備
  const categoryColors = [
    '#8b5cf6', // 紫
    '#6366f1', // インディゴ
    '#10b981', // 緑
    '#14b8a6', // ティール
    '#f59e0b', // オレンジ
    '#ef4444', // 赤
    '#ec4899', // ピンク
    '#06b6d4', // シアン
    '#a855f7', // バイオレット
    '#3b82f6', // 青
  ];

  // 統計サマリー用のデータを準備（職種別と年代別を統合）
  const allResults = [...jobTypeResults, ...yearsResults];
  const statisticsData = useMemo(() => {
    const axes = ['E', 'I', 'N', 'S', 'P', 'R', 'F', 'O'] as const;
    
    return axes.map(axis => {
      const values: number[] = [];
      
      allResults.forEach(result => {
        let score = 0;
        switch (axis) {
          case 'E':
            score = result.market_engagement_score < 0 
              ? normalizeScore(result.market_engagement_score) 
              : 0;
            break;
          case 'I':
            score = result.market_engagement_score > 0 
              ? normalizeScore(result.market_engagement_score) 
              : 0;
            break;
          case 'N':
            score = result.growth_strategy_score < 0 
              ? normalizeScore(result.growth_strategy_score) 
              : 0;
            break;
          case 'S':
            score = result.growth_strategy_score > 0 
              ? normalizeScore(result.growth_strategy_score) 
              : 0;
            break;
          case 'P':
            score = result.organization_style_score < 0 
              ? normalizeScore(result.organization_style_score) 
              : 0;
            break;
          case 'R':
            score = result.organization_style_score > 0 
              ? normalizeScore(result.organization_style_score) 
              : 0;
            break;
          case 'F':
            score = result.decision_making_score < 0 
              ? normalizeScore(result.decision_making_score) 
              : 0;
            break;
          case 'O':
            score = result.decision_making_score > 0 
              ? normalizeScore(result.decision_making_score) 
              : 0;
            break;
        }
        if (score > 0) {
          values.push(score);
        }
      });

      const stats = calculateStatistics(values);
      const studentValue = studentAxes ? studentAxes[axis] : null;

      return {
        axis,
        ...stats,
        studentValue,
        count: values.length
      };
    });
  }, [allResults, studentAxes]);

  // マッチングスコアを計算（学生との適合度）
  const matchingScores = useMemo(() => {
    if (!studentAxes) return null;

    return allResults.map(result => {
      const eScore = result.market_engagement_score < 0 
        ? normalizeScore(result.market_engagement_score) 
        : 0;
      const iScore = result.market_engagement_score > 0 
        ? normalizeScore(result.market_engagement_score) 
        : 0;
      const nScore = result.growth_strategy_score < 0 
        ? normalizeScore(result.growth_strategy_score) 
        : 0;
      const sScore = result.growth_strategy_score > 0 
        ? normalizeScore(result.growth_strategy_score) 
        : 0;
      const pScore = result.organization_style_score < 0 
        ? normalizeScore(result.organization_style_score) 
        : 0;
      const rScore = result.organization_style_score > 0 
        ? normalizeScore(result.organization_style_score) 
        : 0;
      const fScore = result.decision_making_score < 0 
        ? normalizeScore(result.decision_making_score) 
        : 0;
      const oScore = result.decision_making_score > 0 
        ? normalizeScore(result.decision_making_score) 
        : 0;

      const companyAxes = { E: eScore, I: iScore, N: nScore, S: sScore, P: pScore, R: rScore, F: fScore, O: oScore };
      
      // 各軸の差を計算（0-100の範囲で）
      let totalDiff = 0;
      let validAxes = 0;
      
      Object.keys(companyAxes).forEach(key => {
        const companyValue = companyAxes[key as keyof typeof companyAxes];
        const studentValue = studentAxes[key as keyof typeof studentAxes] || 0;
        
        if (companyValue > 0 || studentValue > 0) {
          const diff = Math.abs(companyValue - studentValue);
          totalDiff += diff;
          validAxes++;
        }
      });

      // 適合度を計算（差が小さいほど適合度が高い）
      const avgDiff = validAxes > 0 ? totalDiff / validAxes : 100;
      const matchScore = Math.max(0, Math.min(100, 100 - avgDiff));

      return {
        category: result.category_value,
        matchScore: Math.round(matchScore),
        responseCount: result.response_count
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [allResults, studentAxes]);

  // カテゴリー別の色
  const categoryChartColors = {
    market: '#8b5cf6',    // 紫
    growth: '#10b981',    // 緑
    org: '#f59e0b',       // オレンジ
    decision: '#ec4899'   // ピンク
  };

  return (
    <div className="space-y-6">
      {/* マッチングスコア表示 */}
      {matchingScores && matchingScores.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-800">あなたとの適合度</h3>
          </div>
          <div className="space-y-3">
            {matchingScores.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{item.category}</span>
                  <span className="text-2xl font-bold text-purple-600">{item.matchScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${item.matchScore}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.responseCount}名の回答に基づく
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* カテゴリー別積み上げ棒グラフ - 職種別 */}
      {jobTypeResults.length > 0 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
              職種別 価値観分析
            </h2>
          </div>

          {/* 市場への関わり方 (E ~ I) - 職種別 */}
          <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-800">市場への関わり方 (E ⇄ I) - 職種別</h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={jobMarketData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  dataKey="xValue"
                  domain={[-2, 2]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: 'E ← → I', position: 'insideBottom', offset: -5, style: { fill: '#6b7280' } }}
                />
                <YAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Legend />
                <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="2 2" />
                {jobTypeResults.map((result, index) => (
                  <Bar 
                    key={result.category_value}
                    dataKey={result.category_value}
                    stackId="job-market"
                    fill={categoryColors[index % categoryColors.length]}
                    name={result.category_value}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 成長・戦略 (N ~ S) - 職種別 */}
          <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-lg">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-800">成長・戦略 (N ⇄ S) - 職種別</h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={jobGrowthData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  dataKey="xValue"
                  domain={[-2, 2]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: 'N ← → S', position: 'insideBottom', offset: -5, style: { fill: '#6b7280' } }}
                />
                <YAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Legend />
                <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="2 2" />
                {jobTypeResults.map((result, index) => (
                  <Bar 
                    key={result.category_value}
                    dataKey={result.category_value}
                    stackId="job-growth"
                    fill={categoryColors[index % categoryColors.length]}
                    name={result.category_value}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 組織運営 (P ~ R) - 職種別 */}
          <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-lg">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-orange-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-800">組織運営 (P ⇄ R) - 職種別</h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={jobOrgData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  dataKey="xValue"
                  domain={[-2, 2]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: 'P ← → R', position: 'insideBottom', offset: -5, style: { fill: '#6b7280' } }}
                />
                <YAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Legend />
                <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="2 2" />
                {jobTypeResults.map((result, index) => (
                  <Bar 
                    key={result.category_value}
                    dataKey={result.category_value}
                    stackId="job-org"
                    fill={categoryColors[index % categoryColors.length]}
                    name={result.category_value}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 意思決定 (F ~ O) - 職種別 */}
          <div className="bg-white rounded-xl p-6 border-2 border-pink-200 shadow-lg">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-pink-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-800">意思決定 (F ⇄ O) - 職種別</h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={jobDecisionData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  dataKey="xValue"
                  domain={[-2, 2]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: 'F ← → O', position: 'insideBottom', offset: -5, style: { fill: '#6b7280' } }}
                />
                <YAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Legend />
                <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="2 2" />
                {jobTypeResults.map((result, index) => (
                  <Bar 
                    key={result.category_value}
                    dataKey={result.category_value}
                    stackId="job-decision"
                    fill={categoryColors[index % categoryColors.length]}
                    name={result.category_value}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* カテゴリー別積み上げ棒グラフ - 年代別 */}
      {yearsResults.length > 0 && (
        <div className="space-y-6 mt-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-6 h-6 text-green-600 mr-2" />
              年代別 価値観分析
            </h2>
          </div>

          {/* 市場への関わり方 (E ~ I) - 年代別 */}
          <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-800">市場への関わり方 (E ⇄ I) - 年代別</h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={yearsMarketData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  dataKey="xValue"
                  domain={[-2, 2]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: 'E ← → I', position: 'insideBottom', offset: -5, style: { fill: '#6b7280' } }}
                />
                <YAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Legend />
                <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="2 2" />
                {yearsResults.map((result, index) => (
                  <Bar 
                    key={result.category_value}
                    dataKey={result.category_value}
                    stackId="years-market"
                    fill={categoryColors[index % categoryColors.length]}
                    name={result.category_value}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 成長・戦略 (N ~ S) - 年代別 */}
          <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-lg">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-800">成長・戦略 (N ⇄ S) - 年代別</h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={yearsGrowthData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  dataKey="xValue"
                  domain={[-2, 2]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: 'N ← → S', position: 'insideBottom', offset: -5, style: { fill: '#6b7280' } }}
                />
                <YAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Legend />
                <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="2 2" />
                {yearsResults.map((result, index) => (
                  <Bar 
                    key={result.category_value}
                    dataKey={result.category_value}
                    stackId="years-growth"
                    fill={categoryColors[index % categoryColors.length]}
                    name={result.category_value}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 組織運営 (P ~ R) - 年代別 */}
          <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-lg">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-orange-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-800">組織運営 (P ⇄ R) - 年代別</h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={yearsOrgData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  dataKey="xValue"
                  domain={[-2, 2]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: 'P ← → R', position: 'insideBottom', offset: -5, style: { fill: '#6b7280' } }}
                />
                <YAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Legend />
                <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="2 2" />
                {yearsResults.map((result, index) => (
                  <Bar 
                    key={result.category_value}
                    dataKey={result.category_value}
                    stackId="years-org"
                    fill={categoryColors[index % categoryColors.length]}
                    name={result.category_value}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 意思決定 (F ~ O) - 年代別 */}
          <div className="bg-white rounded-xl p-6 border-2 border-pink-200 shadow-lg">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-pink-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-800">意思決定 (F ⇄ O) - 年代別</h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={yearsDecisionData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  dataKey="xValue"
                  domain={[-2, 2]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: 'F ← → O', position: 'insideBottom', offset: -5, style: { fill: '#6b7280' } }}
                />
                <YAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Legend />
                <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="2 2" />
                {yearsResults.map((result, index) => (
                  <Bar 
                    key={result.category_value}
                    dataKey={result.category_value}
                    stackId="years-decision"
                    fill={categoryColors[index % categoryColors.length]}
                    name={result.category_value}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 統計サマリーテーブル */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
        <div className="flex items-center mb-4">
          <Users className="w-6 h-6 text-gray-600 mr-2" />
          <h3 className="text-lg font-bold text-gray-800">統計サマリー（8軸別）</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">軸</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">平均値</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">中央値</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">最小値</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">最大値</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">標準偏差</th>
                {studentAxes && (
                  <th className="px-4 py-3 text-center font-semibold text-purple-700">あなたの値</th>
                )}
              </tr>
            </thead>
            <tbody>
              {statisticsData.map((item, index) => (
                <tr 
                  key={index} 
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    studentAxes && item.studentValue !== null && item.studentValue > 0
                      ? 'bg-purple-50'
                      : ''
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-gray-800">{item.axis}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{item.mean.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{item.median.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.min.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.max.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.stdDev.toFixed(1)}</td>
                  {studentAxes && (
                    <td className="px-4 py-3 text-center font-semibold text-purple-600">
                      {item.studentValue !== null && item.studentValue > 0 
                        ? item.studentValue.toFixed(1) 
                        : '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <p>※ 統計値は{selectedView === 'job' ? '職種別' : '年代別'}の各カテゴリーのスコアから計算されています。</p>
          {studentAxes && (
            <p className="mt-1">※ 紫色の行は、あなたの値が存在する軸を示しています。</p>
          )}
        </div>
      </div>
    </div>
  );
}

