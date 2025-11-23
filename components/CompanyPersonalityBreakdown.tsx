'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { PersonalityTypeModal } from '@/components/PersonalityTypeModal';
import { Building, Users, Brain, ChevronDown, ChevronUp, Trash2, AlertTriangle, BarChart3, TrendingUp, FileText, CheckCircle2 } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';

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

interface CompanyPersonalityBreakdownProps {
  companyId: string;
  isAdmin?: boolean; // 管理者モードかどうか
  onDelete?: () => void; // 削除後のコールバック
}

export function CompanyPersonalityBreakdown({ companyId, isAdmin = false, onDelete }: CompanyPersonalityBreakdownProps) {
  const [jobTypeResults, setJobTypeResults] = useState<PersonalityResult[]>([]);
  const [yearsResults, setYearsResults] = useState<PersonalityResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'job' | 'years'>('job');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('chart'); // デフォルトをチャートに

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_personality_results')
        .select('*')
        .eq('company_id', companyId)
        .order('category_type')
        .order('category_value');

      if (error) throw error;

      const jobTypes = data?.filter((r: PersonalityResult) => r.category_type === 'job_type') || [];
      const years = data?.filter((r: PersonalityResult) => r.category_type === 'years_of_service') || [];

      setJobTypeResults(jobTypes);
      setYearsResults(years);
    } catch (err) {
      console.error('Error fetching company personality results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchResults();
    }
  }, [companyId]);

  // ビュー切り替え時に選択状態をリセット
  useEffect(() => {
    setSelectedForComparison(new Set());
  }, [selectedView]);

  const toggleCategory = (categoryValue: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryValue)) {
      newExpanded.delete(categoryValue);
    } else {
      newExpanded.add(categoryValue);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    
    setDeleting(true);
    try {
      // company_personality_resultsから削除
      const { error: deleteResultsError } = await supabase
        .from('company_personality_results')
        .delete()
        .eq('company_id', companyId);

      if (deleteResultsError) throw deleteResultsError;

      // advertisementsテーブルのpersonality_typeも削除
      const { error: updateError } = await supabase
        .from('advertisements')
        .update({ personality_type: null })
        .eq('id', companyId);

      if (updateError) throw updateError;

      // 結果をクリア
      setJobTypeResults([]);
      setYearsResults([]);
      
      if (onDelete) {
        onDelete();
      }
    } catch (err) {
      console.error('削除エラー:', err);
      alert('削除に失敗しました。');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const currentResults = selectedView === 'job' ? jobTypeResults : yearsResults;

  // レーダーチャート用のデータを準備
  const prepareChartData = () => {
    if (selectedForComparison.size === 0 && currentResults.length > 0) {
      // 何も選択されていない場合は、最初の3つを自動選択
      const autoSelected = currentResults.slice(0, Math.min(3, currentResults.length));
      setSelectedForComparison(new Set(autoSelected.map(r => r.id)));
      return autoSelected;
    }
    return currentResults.filter(r => selectedForComparison.has(r.id));
  };

  const selectedResults = prepareChartData();

  // レーダーチャート用のデータ構造（各軸ごとにデータポイントを作成）
  const chartData = [
    { axis: '市場への関わり方', fullMark: 100 },
    { axis: '成長・戦略スタンス', fullMark: 100 },
    { axis: '組織運営スタンス', fullMark: 100 },
    { axis: '意思決定スタイル', fullMark: 100 },
  ].map(axisData => {
    const dataPoint: any = { axis: axisData.axis, fullMark: 100 };
    
    selectedResults.forEach((result, index) => {
      // スコアを0-100の範囲に正規化（-2から+2の範囲を0-100に変換）
      const normalizeScore = (score: number) => {
        return ((score + 2) / 4) * 100;
      };

      let score = 0;
      switch (axisData.axis) {
        case '市場への関わり方':
          score = normalizeScore(result.market_engagement_score);
          break;
        case '成長・戦略スタンス':
          score = normalizeScore(result.growth_strategy_score);
          break;
        case '組織運営スタンス':
          score = normalizeScore(result.organization_style_score);
          break;
        case '意思決定スタイル':
          score = normalizeScore(result.decision_making_score);
          break;
      }

      dataPoint[result.category_value] = score;
    });

    return dataPoint;
  });

  // チャート用の色配列
  const chartColors = [
    { fill: 'rgba(139, 92, 246, 0.6)', stroke: 'rgba(139, 92, 246, 1)' }, // purple
    { fill: 'rgba(59, 130, 246, 0.6)', stroke: 'rgba(59, 130, 246, 1)' }, // blue
    { fill: 'rgba(16, 185, 129, 0.6)', stroke: 'rgba(16, 185, 129, 1)' }, // green
    { fill: 'rgba(245, 158, 11, 0.6)', stroke: 'rgba(245, 158, 11, 1)' }, // yellow
    { fill: 'rgba(239, 68, 68, 0.6)', stroke: 'rgba(239, 68, 68, 1)' }, // red
    { fill: 'rgba(168, 85, 247, 0.6)', stroke: 'rgba(168, 85, 247, 1)' }, // violet
  ];

  const toggleComparison = (resultId: string) => {
    const newSelected = new Set(selectedForComparison);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      if (newSelected.size < 6) { // 最大6つまで比較可能
        newSelected.add(resultId);
      }
    }
    setSelectedForComparison(newSelected);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (jobTypeResults.length === 0 && yearsResults.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">パーソナリティ診断結果がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 管理者用の削除ボタン */}
      {isAdmin && (jobTypeResults.length > 0 || yearsResults.length > 0) && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            診断結果を削除
          </button>
        </div>
      )}

      {/* ビュー切り替え */}
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedView('job')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center ${
              selectedView === 'job'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building className="w-5 h-5 mr-2" />
            職種別
          </button>
          <button
            onClick={() => setSelectedView('years')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center ${
              selectedView === 'years'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            年代別
          </button>
        </div>

        {/* 表示モード切り替え */}
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode('chart')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center ${
              viewMode === 'chart'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            レーダーチャート
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-5 h-5 mr-2" />
            リスト表示
          </button>
        </div>
      </div>

      {/* レーダーチャート表示 */}
      {viewMode === 'chart' && (
        <div className="space-y-6">
          {/* 比較対象選択 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
            <div className="flex items-center mb-3">
              <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="font-bold text-gray-800">比較対象を選択（最大6つ）</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentResults.map((result) => {
                const isSelected = selectedForComparison.has(result.id);
                return (
                  <button
                    key={result.id}
                    onClick={() => toggleComparison(result.id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    <span>{result.category_value}</span>
                    <span className="text-xs opacity-75">({result.response_count}名)</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* レーダーチャート */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">パーソナリティプロファイル比較</h3>
                <p className="text-sm text-gray-600">4つの軸での価値観の傾向を可視化</p>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#e0e7ff" />
                  <PolarAngleAxis 
                    dataKey="axis" 
                    tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                  />
                  {selectedResults.map((result, index) => {
                    const color = chartColors[index % chartColors.length];
                    return (
                      <Radar
                        key={result.id}
                        name={result.category_value}
                        dataKey={result.category_value}
                        stroke={color.stroke}
                        fill={color.fill}
                        fillOpacity={0.6}
                        strokeWidth={2}
                      />
                    );
                  })}
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                </RadarChart>
              </ResponsiveContainer>

              {/* 凡例と詳細情報 */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedResults.map((result, index) => {
                  const color = chartColors[index % chartColors.length];
                  return (
                    <div
                      key={result.id}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border-2 border-gray-200 hover:border-purple-400 transition-all cursor-pointer"
                      onClick={() => {
                        if (!result.personality_type.includes('/')) {
                          setSelectedType(result.personality_type);
                          setShowTypeModal(true);
                        }
                      }}
                    >
                      <div className="flex items-center mb-2">
                        <div 
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: color.stroke }}
                        />
                        <h4 className="font-bold text-gray-800">{result.category_value}</h4>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">回答数:</span>
                          <span className="font-semibold">{result.response_count}名</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">タイプ:</span>
                          <span 
                            className="font-bold text-purple-600 hover:text-purple-800"
                          >
                            {result.personality_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedResults.length === 0 && (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">比較対象を選択してください</p>
            </div>
          )}
        </div>
      )}

      {/* リスト表示 */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {currentResults.map((result) => {
            const isExpanded = expandedCategories.has(result.category_value);
            return (
              <div
                key={result.id}
                className="bg-white border-2 border-purple-200 rounded-xl overflow-hidden hover:border-purple-500 transition-all"
              >
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleCategory(result.category_value)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">
                        {result.category_value}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {result.response_count}名の回答
                      </p>
                    </div>
                    <div
                      className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-lg font-bold cursor-pointer hover:bg-purple-200 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!result.personality_type.includes('/')) {
                          setSelectedType(result.personality_type);
                          setShowTypeModal(true);
                        }
                      }}
                    >
                      {result.personality_type}
                    </div>
                  </div>
                  <button className="ml-4 text-gray-500 hover:text-gray-700">
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6" />
                    ) : (
                      <ChevronDown className="w-6 h-6" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                    <div className="pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">市場への関わり方:</span>
                        <span className="font-semibold">
                          {result.market_engagement_score >= 0 ? 'E' : 'I'} ({result.market_engagement_score.toFixed(2)})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">成長・戦略スタンス:</span>
                        <span className="font-semibold">
                          {result.growth_strategy_score >= 0 ? 'N' : 'S'} ({result.growth_strategy_score.toFixed(2)})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">組織運営スタンス:</span>
                        <span className="font-semibold">
                          {result.organization_style_score >= 0 ? 'P' : 'R'} ({result.organization_style_score.toFixed(2)})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">意思決定スタイル:</span>
                        <span className="font-semibold">
                          {result.decision_making_score >= 0 ? 'F' : 'O'} ({result.decision_making_score.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* タイプ詳細モーダル */}
      {selectedType && showTypeModal && (
        <PersonalityTypeModal
          type={selectedType}
          onClose={() => {
            setShowTypeModal(false);
            setSelectedType(null);
          }}
        />
      )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-800">診断結果を削除</h3>
              </div>
              <p className="text-gray-600 mb-6">
                この企業のパーソナリティ診断結果を削除しますか？<br />
                この操作は取り消せません。
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={deleting}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  disabled={deleting}
                >
                  {deleting ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

