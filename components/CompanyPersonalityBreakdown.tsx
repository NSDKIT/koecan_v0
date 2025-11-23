'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { PersonalityTypeModal } from '@/components/PersonalityTypeModal';
import { Building, Users, Brain, ChevronDown, ChevronUp, Trash2, AlertTriangle, BarChart3, TrendingUp, FileText, CheckCircle2, User } from 'lucide-react';
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
  const { user } = useAuth();
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
  const [studentAxes, setStudentAxes] = useState<Record<string, number> | null>(null);

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

  // 学生自身のパーソナリティ診断結果を取得
  useEffect(() => {
    const fetchStudentPersonality = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('monitor_personality_responses')
          .select('category, answer')
          .eq('user_id', user.id);

        if (error) throw error;

        if (!data || data.length === 0) {
          setStudentAxes(null);
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

        // 8軸に変換
        const axes: Record<string, number> = {
          E: 0, I: 0,
          N: 0, S: 0,
          P: 0, R: 0,
          F: 0, O: 0
        };

        // 市場への関わり方: E ⇄ I
        if (scores.market_engagement < 0) {
          axes.E = normalizeScore(scores.market_engagement);
        } else if (scores.market_engagement > 0) {
          axes.I = normalizeScore(scores.market_engagement);
        }

        // 成長・戦略スタンス: N ⇄ S
        if (scores.growth_strategy < 0) {
          axes.N = normalizeScore(scores.growth_strategy);
        } else if (scores.growth_strategy > 0) {
          axes.S = normalizeScore(scores.growth_strategy);
        }

        // 組織運営スタンス: P ⇄ R
        if (scores.organization_style < 0) {
          axes.P = normalizeScore(scores.organization_style);
        } else if (scores.organization_style > 0) {
          axes.R = normalizeScore(scores.organization_style);
        }

        // 意思決定スタイル: F ⇄ O
        if (scores.decision_making < 0) {
          axes.F = normalizeScore(scores.decision_making);
        } else if (scores.decision_making > 0) {
          axes.O = normalizeScore(scores.decision_making);
        }

        setStudentAxes(axes);
      } catch (err) {
        console.error('Error fetching student personality:', err);
        setStudentAxes(null);
      }
    };

    fetchStudentPersonality();
  }, [user?.id]);

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
      // 何も選択されていない場合は、すべてを自動選択
      const allSelected = currentResults;
      setSelectedForComparison(new Set(allSelected.map(r => r.id)));
      return allSelected;
    }
    return currentResults.filter(r => selectedForComparison.has(r.id));
  };

  const selectedResults = prepareChartData();

  // スコアを0-100の範囲に正規化（-2から+2の範囲を0-100に変換）
  const normalizeScore = (score: number) => {
    // 絶対値を取って0-100に変換（-2→100, 0→0, +2→100）
    return Math.abs(score) * 50; // -2から+2の範囲を0-100に変換
  };

  // 4つのスコアを8軸に分解する関数
  const decomposeTo8Axes = (result: PersonalityResult) => {
    const axes: Record<string, number> = {
      E: 0, I: 0,
      N: 0, S: 0,
      P: 0, R: 0,
      F: 0, O: 0
    };

    // 市場への関わり方: E ⇄ I
    if (result.market_engagement_score < 0) {
      axes.E = normalizeScore(result.market_engagement_score);
    } else if (result.market_engagement_score > 0) {
      axes.I = normalizeScore(result.market_engagement_score);
    }

    // 成長・戦略スタンス: N ⇄ S
    if (result.growth_strategy_score < 0) {
      axes.N = normalizeScore(result.growth_strategy_score);
    } else if (result.growth_strategy_score > 0) {
      axes.S = normalizeScore(result.growth_strategy_score);
    }

    // 組織運営スタンス: P ⇄ R
    if (result.organization_style_score < 0) {
      axes.P = normalizeScore(result.organization_style_score);
    } else if (result.organization_style_score > 0) {
      axes.R = normalizeScore(result.organization_style_score);
    }

    // 意思決定スタイル: F ⇄ O
    if (result.decision_making_score < 0) {
      axes.F = normalizeScore(result.decision_making_score);
    } else if (result.decision_making_score > 0) {
      axes.O = normalizeScore(result.decision_making_score);
    }

    return axes;
  };

  // 個人データを取得（Supabaseから）
  const [individualData, setIndividualData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchIndividualData = async () => {
      try {
        // Supabaseから個別回答データを取得
        const { data, error } = await supabase
          .from('company_personality_individual_responses')
          .select('*')
          .eq('company_id', companyId);

        if (error) throw error;

        if (data && data.length > 0) {
          // 選択されたカテゴリーに該当するデータのみをフィルタリング
          const filtered = data.filter((row: any) => {
            if (selectedView === 'job') {
              // 職種別の場合：選択された職種に該当するすべての従業員
              return selectedResults.some((r: PersonalityResult) => r.category_value === row.job_type);
            } else {
              // 年代別の場合：選択された年代に該当するすべての従業員
              return selectedResults.some((r: PersonalityResult) => r.category_value === row.years_of_service);
            }
          });
          setIndividualData(filtered);
        } else {
          setIndividualData([]);
        }
      } catch (err) {
        console.error('Error loading individual data from Supabase:', err);
        // フォールバック: localStorageから取得
        try {
          const storedData = localStorage.getItem('company_personality_data');
          if (storedData) {
            const data = JSON.parse(storedData);
            const filtered = data.filter((row: any) => {
              if (!row.company_id || row.company_id !== companyId) return false;
              if (selectedView === 'job') {
                return selectedResults.some((r: PersonalityResult) => r.category_value === row.job_type);
              } else {
                return selectedResults.some((r: PersonalityResult) => r.category_value === row.years_of_service);
              }
            });
            setIndividualData(filtered);
          }
        } catch (localErr) {
          console.error('Error loading individual data from localStorage:', localErr);
          setIndividualData([]);
        }
      }
    };

    if (companyId && selectedResults.length > 0) {
      fetchIndividualData();
    } else {
      setIndividualData([]);
    }
  }, [selectedResults, selectedView, companyId]);

  // 個人データを8軸に変換し、職種別/年代別にグループ化
  const individual8AxesDataWithCategory = individualData.map((row: any) => {
    // 各質問の回答を合計してスコアを計算
    const marketEngagement = (row.market_engagement_q1 || 0) + (row.market_engagement_q2 || 0) + (row.market_engagement_q3 || 0);
    const growthStrategy = (row.growth_strategy_q1 || 0) + (row.growth_strategy_q2 || 0) + (row.growth_strategy_q3 || 0) + (row.growth_strategy_q4 || 0);
    const organizationStyle = (row.organization_style_q1 || 0) + (row.organization_style_q2 || 0) + (row.organization_style_q3 || 0);
    const decisionMaking = (row.decision_making_q1 || 0) + (row.decision_making_q2 || 0) + (row.decision_making_q3 || 0);

    // UI値（1-5）をDB値（-2〜+2）に変換して平均を計算
    const convertToDBValue = (sum: number, count: number) => {
      const avg = sum / count;
      return avg - 3; // 1→-2, 2→-1, 3→0, 4→+1, 5→+2
    };

    const marketScore = convertToDBValue(marketEngagement, 3);
    const growthScore = convertToDBValue(growthStrategy, 4);
    const orgScore = convertToDBValue(organizationStyle, 3);
    const decisionScore = convertToDBValue(decisionMaking, 3);

    const axes: Record<string, number> = {
      E: 0, I: 0,
      N: 0, S: 0,
      P: 0, R: 0,
      F: 0, O: 0
    };

    if (marketScore < 0) {
      axes.E = normalizeScore(marketScore);
    } else if (marketScore > 0) {
      axes.I = normalizeScore(marketScore);
    }

    if (growthScore < 0) {
      axes.N = normalizeScore(growthScore);
    } else if (growthScore > 0) {
      axes.S = normalizeScore(growthScore);
    }

    if (orgScore < 0) {
      axes.P = normalizeScore(orgScore);
    } else if (orgScore > 0) {
      axes.R = normalizeScore(orgScore);
    }

    if (decisionScore < 0) {
      axes.F = normalizeScore(decisionScore);
    } else if (decisionScore > 0) {
      axes.O = normalizeScore(decisionScore);
    }

    // カテゴリー情報を追加
    const categoryValue = selectedView === 'job' ? row.job_type : row.years_of_service;
    
    return {
      axes,
      categoryValue: categoryValue || '未分類'
    };
  });

  // 職種別/年代別にグループ化
  const groupedByCategory = individual8AxesDataWithCategory.reduce((acc: Record<string, any[]>, item) => {
    const category = item.categoryValue;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // グループ化されたデータを配列に変換
  const categoryGroups = Object.entries(groupedByCategory).map(([category, items]) => ({
    category,
    items: items.map(item => item.axes)
  }));

  // 各軸の平均値を計算（Eの平均、Iの平均、...というふうに8項目の平均）
  const averageAxes: Record<string, number> = {
    E: 0, I: 0,
    N: 0, S: 0,
    P: 0, R: 0,
    F: 0, O: 0
  };

  if (individual8AxesDataWithCategory.length > 0) {
    // 各従業員の8軸データから、各軸（E, I, N, S, P, R, F, O）の平均を計算
    individual8AxesDataWithCategory.forEach((item) => {
      const axes = item.axes;
      Object.keys(averageAxes).forEach(key => {
        averageAxes[key] += axes[key];
      });
    });
    Object.keys(averageAxes).forEach(key => {
      averageAxes[key] /= individual8AxesDataWithCategory.length;
    });
  } else {
    // 個人データがない場合は、集計結果から計算（フォールバック）
    selectedResults.forEach((result: PersonalityResult) => {
      const axes = decomposeTo8Axes(result);
      Object.keys(averageAxes).forEach(key => {
        averageAxes[key] += axes[key];
      });
    });
    if (selectedResults.length > 0) {
      Object.keys(averageAxes).forEach(key => {
        averageAxes[key] /= selectedResults.length;
      });
    }
  }

  // レーダーチャート用のデータ構造（8軸）
  // 対極の組み合わせを反対側に配置: E⇄I, N⇄S, P⇄R, F⇄O
  const chartData = [
    { axis: 'E', fullMark: 100 },   // 0度
    { axis: 'N', fullMark: 100 },   // 45度
    { axis: 'P', fullMark: 100 },   // 90度
    { axis: 'F', fullMark: 100 },   // 135度
    { axis: 'I', fullMark: 100 },   // 180度（Eの対極）
    { axis: 'S', fullMark: 100 },   // 225度（Nの対極）
    { axis: 'R', fullMark: 100 },   // 270度（Pの対極）
    { axis: 'O', fullMark: 100 },   // 315度（Fの対極）
  ].map(axisData => {
    const dataPoint: any = { axis: axisData.axis, fullMark: 100 };
    
    // 平均値を追加
    dataPoint['平均'] = averageAxes[axisData.axis];

    // 学生自身の値を追加
    if (studentAxes) {
      dataPoint['あなた'] = studentAxes[axisData.axis];
    }

    // 職種別/年代別にグループ化して追加（各グループを異なる色で表示）
    categoryGroups.forEach((group, groupIndex) => {
      group.items.forEach((axes: Record<string, number>, itemIndex: number) => {
        const dataKey = `${group.category}_${itemIndex + 1}`;
        dataPoint[dataKey] = axes[axisData.axis];
      });
    });

    return dataPoint;
  });

  // チャート用の色配列（職種別/年代別のグループごとに異なる色）
  const categoryColors = [
    { fill: 'rgba(139, 92, 246, 0.6)', stroke: 'rgba(139, 92, 246, 1)' }, // purple
    { fill: 'rgba(59, 130, 246, 0.6)', stroke: 'rgba(59, 130, 246, 1)' }, // blue
    { fill: 'rgba(16, 185, 129, 0.6)', stroke: 'rgba(16, 185, 129, 1)' }, // green
    { fill: 'rgba(245, 158, 11, 0.6)', stroke: 'rgba(245, 158, 11, 1)' }, // yellow
    { fill: 'rgba(239, 68, 68, 0.6)', stroke: 'rgba(239, 68, 68, 1)' }, // red
    { fill: 'rgba(168, 85, 247, 0.6)', stroke: 'rgba(168, 85, 247, 1)' }, // violet
    { fill: 'rgba(236, 72, 153, 0.6)', stroke: 'rgba(236, 72, 153, 1)' }, // pink
    { fill: 'rgba(34, 197, 94, 0.6)', stroke: 'rgba(34, 197, 94, 1)' }, // emerald
    { fill: 'rgba(251, 146, 60, 0.6)', stroke: 'rgba(251, 146, 60, 1)' }, // orange
    { fill: 'rgba(99, 102, 241, 0.6)', stroke: 'rgba(99, 102, 241, 1)' }, // indigo
  ];

  const toggleComparison = (resultId: string) => {
    const newSelected = new Set(selectedForComparison);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      // 制限なし（すべて選択可能）
      newSelected.add(resultId);
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
              <h3 className="font-bold text-gray-800">表示するカテゴリーを選択</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              選択したカテゴリーの全従業員を点で表示し、8軸（E, I, N, S, P, R, F, O）の平均を面積として表示します
            </p>
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
                <p className="text-sm text-gray-600 mb-3">8つの軸（E, I, N, S, P, R, F, O）での価値観の傾向を可視化</p>
                <div className="flex flex-wrap items-center gap-4 text-sm mt-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(139, 92, 246, 0.4)' }}></div>
                    <span className="text-gray-700 font-semibold">平均（面積）</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-gray-700">各従業員（点）</span>
                  </div>
                  {studentAxes && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-gray-700 font-semibold">あなたの価値観</span>
                    </div>
                  )}
                </div>
                
                {/* 数値の説明 */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4 border border-purple-200">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-2 text-purple-600" />
                    八角形レーダーチャートについて
                  </h4>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p className="font-semibold text-purple-700 mb-2">
                      ⚠️ 重要: 数値の大小は優劣ではなく、価値観の違いを表しています
                    </p>
                    <div className="space-y-1">
                      <p className="font-semibold">8つの軸:</p>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-0.5">
                        <li><span className="font-semibold">E（外向型）⇄ I（内向型）</span> - 市場への関わり方</li>
                        <li><span className="font-semibold">N（革新型）⇄ S（安定型）</span> - 成長・戦略スタンス</li>
                        <li><span className="font-semibold">P（人材志向）⇄ R（成果志向）</span> - 組織運営スタンス</li>
                        <li><span className="font-semibold">F（柔軟型）⇄ O（規律型）</span> - 意思決定スタイル</li>
                      </ul>
                    </div>
                    <div className="space-y-1 mt-3">
                      <p className="font-semibold">表示方法:</p>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-0.5">
                        <li><span className="font-semibold">点（個人）:</span> 各従業員の価値観を個別の点で表示（線で接続しない）</li>
                        <li><span className="font-semibold">色分け:</span> {selectedView === 'job' ? '職種別' : '年代別'}に色分けして表示</li>
                        <li><span className="font-semibold">面積（平均）:</span> 全従業員の平均値を結んで面積として表示</li>
                        <li><span className="font-semibold">点（あなた）:</span> 学生自身の価値観を点で表示</li>
                      </ul>
                    </div>
                    <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-purple-200">
                      ※ 各軸の値は0〜100の範囲で表示されます。数値が高い・低いに関わらず、それぞれの価値観に優劣はありません。
                    </p>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={500}>
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#e0e7ff" />
                  <PolarAngleAxis 
                    dataKey="axis" 
                    tick={{ fill: '#4b5563', fontSize: 14, fontWeight: 'bold' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    label={{ value: 'スコア (0-100)', position: 'insideStart', offset: 10, fill: '#6b7280', fontSize: 11 }}
                  />
                  {/* 平均値を面積で表示 */}
                  <Radar
                    name="平均"
                    dataKey="平均"
                    stroke="rgba(139, 92, 246, 1)"
                    fill="rgba(139, 92, 246, 0.4)"
                    fillOpacity={0.6}
                    strokeWidth={3}
                    dot={false}
                  />
                  {/* 学生自身を点で表示（目立つ色、線で結ばない） */}
                  {studentAxes && (
                    <Radar
                      name="あなた"
                      dataKey="あなた"
                      stroke="rgba(239, 68, 68, 1)"
                      fill="none"
                      strokeWidth={0}
                      dot={{ r: 6, fill: 'rgba(239, 68, 68, 1)' }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  )}
                  {/* 職種別/年代別にグループ化して点で表示（各グループを異なる色で） */}
                  {categoryGroups.map((group, groupIndex) => {
                    const color = categoryColors[groupIndex % categoryColors.length];
                    return group.items.map((_: Record<string, number>, itemIndex: number) => (
                      <Radar
                        key={`${group.category}-${itemIndex}`}
                        name={`${group.category}_${itemIndex + 1}`}
                        dataKey={`${group.category}_${itemIndex + 1}`}
                        stroke={color.stroke}
                        fill="none"
                        strokeWidth={0}
                        dot={{ r: 4, fill: color.stroke, strokeWidth: 0 }}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    ));
                  }).flat()}
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                    formatter={(value: string) => {
                      // カテゴリー名を表示（例: "経営層・管理職_1" → "経営層・管理職"）
                      if (value.includes('_')) {
                        const category = value.split('_')[0];
                        // 同じカテゴリーの最初の項目のみ表示
                        const itemIndex = parseInt(value.split('_')[1]);
                        if (itemIndex === 1) {
                          return category;
                        }
                        return '';
                      }
                      return value;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>

              {/* 凡例と詳細情報 */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedResults.map((result, index) => {
                  const color = categoryColors[index % categoryColors.length];
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

