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
  selectedView: 'job' | 'years'; // 現在選択されているビュー
  studentAxes?: Record<string, number> | null;
}

// スコアを0-100の範囲に正規化
const normalizeScore = (score: number): number => {
  return Math.abs(score) * 50; // -2から+2の範囲を0-100に変換
};


export function CompanyPersonalityStatistics({ 
  jobTypeResults,
  yearsResults,
  companyId,
  selectedView,
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
  // 縦軸はそのスコア値を持つ回答の数（各質問の回答を個別に集計）
  const prepareCategoryBarData = (
    results: PersonalityResult[],
    categoryType: 'market' | 'growth' | 'org' | 'decision',
    viewType: 'job' | 'years'
  ) => {
    // 横軸の値（-2から+2）ごとに、各職種/年代の回答数を集計
    const dataMap = new Map<number, Record<string, number>>();
    
    // 個別回答データから各質問の回答を個別に集計
    individualData.forEach((row: any) => {
      let questionValues: number[] = []; // 各質問の回答値（DB値）
      let categoryValue = '';

      // カテゴリーに応じて各質問の回答を取得
      switch (categoryType) {
        case 'market':
          questionValues = [
            convertUIToDB(row.market_engagement_q1 || 0),
            convertUIToDB(row.market_engagement_q2 || 0),
            convertUIToDB(row.market_engagement_q3 || 0)
          ].filter(v => v !== 0); // 0（回答なし）は除外
          break;
        case 'growth':
          questionValues = [
            convertUIToDB(row.growth_strategy_q1 || 0),
            convertUIToDB(row.growth_strategy_q2 || 0),
            convertUIToDB(row.growth_strategy_q3 || 0),
            convertUIToDB(row.growth_strategy_q4 || 0)
          ].filter(v => v !== 0); // 0（回答なし）は除外
          break;
        case 'org':
          questionValues = [
            convertUIToDB(row.organization_style_q1 || 0),
            convertUIToDB(row.organization_style_q2 || 0),
            convertUIToDB(row.organization_style_q3 || 0)
          ].filter(v => v !== 0); // 0（回答なし）は除外
          break;
        case 'decision':
          questionValues = [
            convertUIToDB(row.decision_making_q1 || 0),
            convertUIToDB(row.decision_making_q2 || 0),
            convertUIToDB(row.decision_making_q3 || 0)
          ].filter(v => v !== 0); // 0（回答なし）は除外
          break;
      }

      // カテゴリー値（職種または年代）を取得
      categoryValue = viewType === 'job' 
        ? (row.job_type || '不明')
        : (row.years_of_service || '不明');

      // 選択されたカテゴリーに該当するかチェック
      const isValidCategory = results.some(r => r.category_value === categoryValue);
      if (!isValidCategory) return;

      // 各質問の回答を個別に集計
      questionValues.forEach(answerValue => {
        // スコアを整数値に丸める（-2, -1, 0, 1, 2）
        const roundedValue = Math.round(answerValue);

        if (!dataMap.has(roundedValue)) {
          dataMap.set(roundedValue, {});
        }

        const categoryData = dataMap.get(roundedValue)!;
        // 縦軸（積み上げの高さ）はそのスコア値を持つ回答の数
        categoryData[categoryValue] = (categoryData[categoryValue] || 0) + 1;
      });
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


  // カテゴリー別の色
  const categoryChartColors = {
    market: '#8b5cf6',    // 紫
    growth: '#10b981',    // 緑
    org: '#f59e0b',       // オレンジ
    decision: '#ec4899'   // ピンク
  };

  return (
    <div className="space-y-6">

      {/* カテゴリー別積み上げ棒グラフ - 職種別 */}
      {jobTypeResults.length > 0 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
              職種別 価値観分析
            </h2>
          </div>

          {/* 4つのグラフを2×2グリッドで表示 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 市場への関わり方 (E ~ I) - 職種別 */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-sm font-bold text-gray-800" style={{ fontSize: '14px' }}>市場への関わり方 (E ⇄ I) - 職種別</h3>
              </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={jobMarketData} 
                margin={{ top: 10, right: 0, left: 0, bottom: 40 }}
                barCategoryGap={0}
                barGap={0}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  dataKey="xValue"
                  domain={[-2, 2]}
                  tick={{ fontSize: 14, fill: '#6b7280' }}
                  label={{ value: 'E ← → I', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', fontSize: '14px' } }}
                />
                <YAxis 
                  type="number"
                  tick={{ fontSize: 14, fill: '#6b7280' }}
                  label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: '14px' } }}
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
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-sm font-bold text-gray-800" style={{ fontSize: '14px' }}>成長・戦略 (N ⇄ S) - 職種別</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={jobGrowthData} 
                  margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                  barCategoryGap={0}
                  barGap={0}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number"
                    dataKey="xValue"
                    domain={[-2, 2]}
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: 'N ← → S', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', fontSize: '14px' } }}
                  />
                  <YAxis 
                    type="number"
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: '14px' } }}
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
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-orange-600 mr-2" />
                <h3 className="text-sm font-bold text-gray-800" style={{ fontSize: '14px' }}>組織運営 (P ⇄ R) - 職種別</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={jobOrgData} 
                  margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                  barCategoryGap={0}
                  barGap={0}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number"
                    dataKey="xValue"
                    domain={[-2, 2]}
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: 'P ← → R', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', fontSize: '14px' } }}
                  />
                  <YAxis 
                    type="number"
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: '14px' } }}
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
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-pink-600 mr-2" />
                <h3 className="text-sm font-bold text-gray-800" style={{ fontSize: '14px' }}>意思決定 (F ⇄ O) - 職種別</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={jobDecisionData} 
                  margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                  barCategoryGap={0}
                  barGap={0}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number"
                    dataKey="xValue"
                    domain={[-2, 2]}
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: 'F ← → O', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', fontSize: '14px' } }}
                  />
                  <YAxis 
                    type="number"
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: '14px' } }}
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

          {/* 4つのグラフを2×2グリッドで表示 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 市場への関わり方 (E ~ I) - 年代別 */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-sm font-bold text-gray-800" style={{ fontSize: '14px' }}>市場への関わり方 (E ⇄ I) - 年代別</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={yearsMarketData} 
                  margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                  barCategoryGap={0}
                  barGap={0}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number"
                    dataKey="xValue"
                    domain={[-2, 2]}
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: 'E ← → I', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', fontSize: '14px' } }}
                  />
                  <YAxis 
                    type="number"
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: '14px' } }}
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
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-sm font-bold text-gray-800" style={{ fontSize: '14px' }}>成長・戦略 (N ⇄ S) - 年代別</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={yearsGrowthData} 
                  margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                  barCategoryGap={0}
                  barGap={0}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number"
                    dataKey="xValue"
                    domain={[-2, 2]}
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: 'N ← → S', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', fontSize: '14px' } }}
                  />
                  <YAxis 
                    type="number"
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: '14px' } }}
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
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-orange-600 mr-2" />
                <h3 className="text-sm font-bold text-gray-800" style={{ fontSize: '14px' }}>組織運営 (P ⇄ R) - 年代別</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={yearsOrgData} 
                  margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                  barCategoryGap={0}
                  barGap={0}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number"
                    dataKey="xValue"
                    domain={[-2, 2]}
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: 'P ← → R', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', fontSize: '14px' } }}
                  />
                  <YAxis 
                    type="number"
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: '14px' } }}
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
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-pink-600 mr-2" />
                <h3 className="text-sm font-bold text-gray-800" style={{ fontSize: '14px' }}>意思決定 (F ⇄ O) - 年代別</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={yearsDecisionData} 
                  margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                  barCategoryGap={0}
                  barGap={0}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number"
                    dataKey="xValue"
                    domain={[-2, 2]}
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: 'F ← → O', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', fontSize: '14px' } }}
                  />
                  <YAxis 
                    type="number"
                    tick={{ fontSize: 14, fill: '#6b7280' }}
                    label={{ value: '人数', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: '14px' } }}
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
        </div>
      )}

    </div>
  );
}

