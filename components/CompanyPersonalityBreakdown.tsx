'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { PersonalityTypeModal } from '@/components/PersonalityTypeModal';
import { CompanyPersonalityStatistics } from '@/components/CompanyPersonalityStatistics';
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
  const [viewMode, setViewMode] = useState<'chart' | 'statistics'>('chart'); // デフォルトをチャートに
  const [studentAxes, setStudentAxes] = useState<Record<string, number> | null>(null);

  // 個別回答データを状態として管理（統計表示でも使用）
  const [individualData, setIndividualData] = useState<any[]>([]);
  const [individualDataLoading, setIndividualDataLoading] = useState(false);

  // 全てのデータを並列で取得（高速化）
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setIndividualDataLoading(true);
    try {
      // 並列でデータ取得
      const [resultsResponse, individualResponse, studentResponse] = await Promise.all([
        // 1. 企業のパーソナリティ結果
        supabase
          .from('company_personality_results')
          .select('*')
          .eq('company_id', companyId)
          .order('category_type')
          .order('category_value'),
        // 2. 個別回答データ（統計表示用）
        supabase
          .from('company_personality_individual_responses')
          .select('*')
          .eq('company_id', companyId),
        // 3. 学生のパーソナリティ（ユーザーがログインしている場合のみ）
        user?.id ? supabase
          .from('monitor_personality_responses')
          .select('category, answer')
          .eq('user_id', user.id) : Promise.resolve({ data: null, error: null })
      ]);

      // 結果を処理
      if (resultsResponse.error) throw resultsResponse.error;
      const jobTypes = resultsResponse.data?.filter((r: PersonalityResult) => r.category_type === 'job_type') || [];
      const years = resultsResponse.data?.filter((r: PersonalityResult) => r.category_type === 'years_of_service') || [];
      setJobTypeResults(jobTypes);
      setYearsResults(years);

      // 個別回答データを設定
      if (individualResponse.error) {
        console.error('Error fetching individual data:', individualResponse.error);
        setIndividualData([]);
      } else {
        setIndividualData(individualResponse.data || []);
      }
      setIndividualDataLoading(false);

      // 学生のパーソナリティを処理
      if (studentResponse.data && user?.id) {
        const data = studentResponse.data;
        if (data.length > 0) {
          const scores: Record<string, number> = {
            market_engagement: 0,
            growth_strategy: 0,
            organization_style: 0,
            decision_making: 0
          };
          const counts: Record<string, number> = {
            market_engagement: 0,
            growth_strategy: 0,
            organization_style: 0,
            decision_making: 0
          };

          data.forEach((response: { category: string; answer: number }) => {
            if (scores.hasOwnProperty(response.category)) {
              scores[response.category] += response.answer;
              counts[response.category] += 1;
            }
          });

          const avgScores: Record<string, number> = {
            market_engagement: counts.market_engagement > 0 ? scores.market_engagement / counts.market_engagement : 0,
            growth_strategy: counts.growth_strategy > 0 ? scores.growth_strategy / counts.growth_strategy : 0,
            organization_style: counts.organization_style > 0 ? scores.organization_style / counts.organization_style : 0,
            decision_making: counts.decision_making > 0 ? scores.decision_making / counts.decision_making : 0
          };

          const normalizeScore = (score: number) => Math.abs(score) * 50;
          const axes: Record<string, number> = {
            E: 0, I: 0, N: 0, S: 0, P: 0, R: 0, F: 0, O: 0
          };

          if (avgScores.market_engagement < 0) {
            axes.E = normalizeScore(avgScores.market_engagement);
          } else if (avgScores.market_engagement > 0) {
            axes.I = normalizeScore(avgScores.market_engagement);
          }
          if (avgScores.growth_strategy < 0) {
            axes.N = normalizeScore(avgScores.growth_strategy);
          } else if (avgScores.growth_strategy > 0) {
            axes.S = normalizeScore(avgScores.growth_strategy);
          }
          if (avgScores.organization_style < 0) {
            axes.P = normalizeScore(avgScores.organization_style);
          } else if (avgScores.organization_style > 0) {
            axes.R = normalizeScore(avgScores.organization_style);
          }
          if (avgScores.decision_making < 0) {
            axes.F = normalizeScore(avgScores.decision_making);
          } else if (avgScores.decision_making > 0) {
            axes.O = normalizeScore(avgScores.decision_making);
          }

          setStudentAxes(axes);
        } else {
          setStudentAxes(null);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, user?.id]);

  useEffect(() => {
    if (companyId) {
      fetchAllData();
    }
  }, [companyId, fetchAllData]);

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
      // 何も選択されていない場合は、すべてを自動選択
      const allSelected = currentResults;
      setSelectedForComparison(new Set(allSelected.map(r => r.id)));
      return allSelected;
    }
    const filtered = currentResults.filter(r => selectedForComparison.has(r.id));
    // フィルタ結果が空の場合は、すべてを表示
    return filtered.length > 0 ? filtered : currentResults;
  };

  const selectedResults = prepareChartData();
  
  // チャート表示用：すべてのカテゴリーを表示（selectedResultsが空でも）
  const chartDisplayResults = selectedResults.length > 0 ? selectedResults : currentResults;

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

  // 個別データをフィルタリング（レーダーチャート用）
  const filteredIndividualData = useMemo(() => {
    if (!individualData || individualData.length === 0) return [];
    const resultsToUse = selectedResults.length > 0 ? selectedResults : currentResults;
    return individualData.filter((row: any) => {
      if (selectedView === 'job') {
        return resultsToUse.some((r: PersonalityResult) => r.category_value === row.job_type);
      } else {
        return resultsToUse.some((r: PersonalityResult) => r.category_value === row.years_of_service);
      }
    });
  }, [individualData, selectedResults, selectedView, currentResults]);

  // 個人データを8軸に変換し、職種別/年代別にグループ化
  const individual8AxesDataWithCategory = filteredIndividualData.map((row: any) => {
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

  // 各職種/年代別の平均値を計算
  const categoryAverages: Record<string, Record<string, number>> = {};
  
  // individualDataがある場合は、それから計算
  if (categoryGroups.length > 0) {
    categoryGroups.forEach((group) => {
      const categoryAvg: Record<string, number> = {
        E: 0, I: 0,
        N: 0, S: 0,
        P: 0, R: 0,
        F: 0, O: 0
      };
      
      // このグループ内の各従業員の8軸データから平均を計算
      group.items.forEach((axes: Record<string, number>) => {
        Object.keys(categoryAvg).forEach(key => {
          categoryAvg[key] += axes[key];
        });
      });
      
      // 平均を計算
      if (group.items.length > 0) {
        Object.keys(categoryAvg).forEach(key => {
          categoryAvg[key] /= group.items.length;
        });
      }
      
      categoryAverages[group.category] = categoryAvg;
    });
  } else {
    // individualDataがない場合は、company_personality_resultsから計算
    selectedResults.forEach((result: PersonalityResult) => {
      const axes = decomposeTo8Axes(result);
      categoryAverages[result.category_value] = axes;
    });
  }

  // 全従業員の平均値を計算（Eの平均、Iの平均、...というふうに8項目の平均）
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
    
    // 各職種/年代別の平均値を追加（面積として表示）
    categoryGroups.forEach((group) => {
      const categoryAvg = categoryAverages[group.category];
      if (categoryAvg) {
        dataPoint[`${group.category}_平均`] = categoryAvg[axisData.axis];
      }
    });

    // 学生自身の値を追加
    if (studentAxes) {
      dataPoint['あなた'] = studentAxes[axisData.axis];
    }

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
        <p className="text-sm text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (jobTypeResults.length === 0 && yearsResults.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-600">パーソナリティ診断結果がありません</p>
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
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center"
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
            className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center ${
              selectedView === 'job'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building className="w-5 h-5 mr-2" />
            職種別
          </button>
          <button
            onClick={() => setSelectedView('years')}
            className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center ${
              selectedView === 'years'
                ? 'bg-orange-600 text-white'
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
            className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center ${
              viewMode === 'chart'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            レーダーチャート
          </button>
          <button
            onClick={() => setViewMode('statistics')}
            className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center ${
              viewMode === 'statistics'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            統計表示
          </button>
        </div>
      </div>

      {/* レーダーチャート表示 */}
      {viewMode === 'chart' && (
        <div className="space-y-6">
          {/* レーダーチャート */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl p-0">
              <div className="mb-0">
                <h3 className="text-sm font-bold text-gray-800 mb-2">パーソナリティプロファイル比較</h3>
                <p className="text-sm text-gray-600 mb-0">8つの軸（E, I, N, S, P, R, F, O）での価値観の傾向を可視化</p>
              </div>
              <ResponsiveContainer width="100%" height={500}>
                <RadarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
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
                  {/* 各職種/年代別の平均値を面積で表示（各グループを異なる色で） */}
                  {categoryGroups.map((group, groupIndex) => {
                    const color = categoryColors[groupIndex % categoryColors.length];
                    return (
                      <Radar
                        key={`${group.category}_平均`}
                        name={`${group.category}_平均`}
                        dataKey={`${group.category}_平均`}
                        stroke={color.stroke}
                        fill={color.fill}
                        fillOpacity={0.4}
                        strokeWidth={2}
                        dot={false}
                      />
                    );
                  })}
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
                  <Legend 
                    wrapperStyle={{ paddingTop: '0px' }}
                    iconType="line"
                    formatter={(value: string) => {
                      // 職種/年代別の平均のみを凡例に表示
                      if (value.includes('_平均')) {
                        return value.replace('_平均', '');
                      }
                      // 全体平均、あなた、個別従業員は凡例に表示しない
                      return '';
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
                      className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 transition-all cursor-pointer"
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
                        <h4 className="text-sm font-bold text-gray-800">{result.category_value}</h4>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">回答数:</span>
                          <span className="text-sm font-semibold">{result.response_count}名</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">タイプ:</span>
                          <span 
                            className="font-bold text-orange-600 hover:text-orange-800"
                          >
                            {result.personality_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 八角形レーダーチャートについて（ページの一番下） */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 mt-6 border border-orange-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  八角形レーダーチャートについて
                </h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p className="font-semibold text-orange-700 mb-2">
                    ⚠️ 重要: 数値の大小は優劣ではなく、価値観の違いを表しています
                  </p>
                  <div className="space-y-1">
                    <p className="font-semibold">8つの軸:</p>
                    <div className="space-y-1 ml-4">
                      <div>□ 外の人と関わる仕事（E）</div>
                      <div>□ 一人で集中できる仕事（I）</div>
                      <div>□ 新しいことに挑戦したい（N）</div>
                      <div>□ 安定した業務を求める（S）</div>
                      <div>□ 人を大切にする柔らかい雰囲気（F）</div>
                      <div>□ 数値的な目標に向かって突き進む（T）</div>
                      <div>□ 自分なりのやり方で進められる（P）</div>
                      <div>□ ルールが明確で迷わず働ける（J）</div>
                    </div>
                  </div>
                  <div className="space-y-1 mt-3">
                    <p className="font-semibold">表示方法:</p>
                    <div className="ml-4">
                      <div>面積: 各{selectedView === 'job' ? '職種' : '年代'}の平均値を異なる色の面積として表示</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedResults.length === 0 && (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600">比較対象を選択してください</p>
            </div>
          )}

          {/* 統計表示をレーダーチャートの下に表示 */}
          <CompanyPersonalityStatistics
            jobTypeResults={jobTypeResults}
            yearsResults={yearsResults}
            companyId={companyId}
            selectedView={selectedView}
            studentAxes={studentAxes}
            individualData={individualData}
          />
        </div>
      )}

      {/* 統計表示のみ（viewMode === 'statistics'の場合は表示しない） */}


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
                <h3 className="text-sm font-bold text-gray-800">診断結果を削除</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                この企業のパーソナリティ診断結果を削除しますか？<br />
                この操作は取り消せません。
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  disabled={deleting}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
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

