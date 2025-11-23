'use client'

import React, { useState, useEffect } from 'react';
import { PersonalityTypeModal } from '@/components/PersonalityTypeModal';
import { Building, Users, TrendingUp, BarChart3, X } from 'lucide-react';

interface CompanyPersonalityResultsProps {
  data: any[];
}

interface AggregatedResult {
  jobType: string;
  yearsOfService: string;
  scores: {
    market_engagement: number;
    growth_strategy: number;
    organization_style: number;
    decision_making: number;
  };
  type: string;
  count: number;
}

export function CompanyPersonalityResults({ data }: CompanyPersonalityResultsProps) {
  const [selectedView, setSelectedView] = useState<'job' | 'years'>('job');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [jobTypeResults, setJobTypeResults] = useState<AggregatedResult[]>([]);
  const [yearsResults, setYearsResults] = useState<AggregatedResult[]>([]);

  // タイプコードを生成する関数
  // 注意: スコアの符号とタイプの対応
  // マイナス → E, N, P, F / プラス → I, S, R, O
  const calculateType = (scores: { market_engagement: number; growth_strategy: number; organization_style: number; decision_making: number }): string => {
    let typeCode = '';
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
    
    return typeCode;
  };

  // データを集計する関数
  useEffect(() => {
    if (!data || data.length === 0) return;

    // 職種別集計
    const jobTypeMap = new Map<string, any[]>();
    data.forEach(row => {
      const key = row.job_type || '不明';
      if (!jobTypeMap.has(key)) {
        jobTypeMap.set(key, []);
      }
      jobTypeMap.get(key)!.push(row);
    });

    const jobResults: AggregatedResult[] = [];
    jobTypeMap.forEach((rows, jobType) => {
      const scores = {
        market_engagement: 0,
        growth_strategy: 0,
        organization_style: 0,
        decision_making: 0
      };

      rows.forEach(row => {
        scores.market_engagement += (row.market_engagement_q1 || 0) + (row.market_engagement_q2 || 0) + (row.market_engagement_q3 || 0);
        scores.growth_strategy += (row.growth_strategy_q1 || 0) + (row.growth_strategy_q2 || 0) + (row.growth_strategy_q3 || 0) + (row.growth_strategy_q4 || 0);
        scores.organization_style += (row.organization_style_q1 || 0) + (row.organization_style_q2 || 0) + (row.organization_style_q3 || 0);
        scores.decision_making += (row.decision_making_q1 || 0) + (row.decision_making_q2 || 0) + (row.decision_making_q3 || 0);
      });

      // 平均を計算
      const count = rows.length;
      scores.market_engagement = scores.market_engagement / count;
      scores.growth_strategy = scores.growth_strategy / count;
      scores.organization_style = scores.organization_style / count;
      scores.decision_making = scores.decision_making / count;

      jobResults.push({
        jobType,
        yearsOfService: '',
        scores,
        type: calculateType(scores),
        count
      });
    });

    setJobTypeResults(jobResults);

    // 年代別集計
    const yearsMap = new Map<string, any[]>();
    data.forEach(row => {
      const key = row.years_of_service || '不明';
      if (!yearsMap.has(key)) {
        yearsMap.set(key, []);
      }
      yearsMap.get(key)!.push(row);
    });

    const yearsResultsData: AggregatedResult[] = [];
    yearsMap.forEach((rows, yearsOfService) => {
      const scores = {
        market_engagement: 0,
        growth_strategy: 0,
        organization_style: 0,
        decision_making: 0
      };

      rows.forEach(row => {
        scores.market_engagement += (row.market_engagement_q1 || 0) + (row.market_engagement_q2 || 0) + (row.market_engagement_q3 || 0);
        scores.growth_strategy += (row.growth_strategy_q1 || 0) + (row.growth_strategy_q2 || 0) + (row.growth_strategy_q3 || 0) + (row.growth_strategy_q4 || 0);
        scores.organization_style += (row.organization_style_q1 || 0) + (row.organization_style_q2 || 0) + (row.organization_style_q3 || 0);
        scores.decision_making += (row.decision_making_q1 || 0) + (row.decision_making_q2 || 0) + (row.decision_making_q3 || 0);
      });

      // 平均を計算
      const count = rows.length;
      scores.market_engagement = scores.market_engagement / count;
      scores.growth_strategy = scores.growth_strategy / count;
      scores.organization_style = scores.organization_style / count;
      scores.decision_making = scores.decision_making / count;

      yearsResultsData.push({
        jobType: '',
        yearsOfService,
        scores,
        type: calculateType(scores),
        count
      });
    });

    setYearsResults(yearsResultsData);
  }, [data]);

  const currentResults = selectedView === 'job' ? jobTypeResults : yearsResults;

  return (
    <div className="space-y-6">
      {/* ビュー切り替え */}
      <div className="flex space-x-4">
        <button
          onClick={() => setSelectedView('job')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
            selectedView === 'job'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Building className="w-5 h-5 inline mr-2" />
          職種別
        </button>
        <button
          onClick={() => setSelectedView('years')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
            selectedView === 'years'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          年代別
        </button>
      </div>

      {/* 結果表示 */}
      {currentResults.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">データがありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentResults.map((result, index) => (
            <div
              key={index}
              className="bg-white border-2 border-purple-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => {
                if (!result.type.includes('/')) {
                  setSelectedType(result.type);
                  setShowTypeModal(true);
                }
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedView === 'job' ? result.jobType : result.yearsOfService}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {result.count}名の回答
                  </p>
                </div>
                <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-lg font-bold">
                  {result.type}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">市場への関わり方:</span>
                  <span className="font-semibold">{result.scores.market_engagement >= 0 ? 'E' : 'I'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">成長・戦略スタンス:</span>
                  <span className="font-semibold">{result.scores.growth_strategy >= 0 ? 'N' : 'S'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">組織運営スタンス:</span>
                  <span className="font-semibold">{result.scores.organization_style >= 0 ? 'P' : 'R'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">意思決定スタイル:</span>
                  <span className="font-semibold">{result.scores.decision_making >= 0 ? 'F' : 'O'}</span>
                </div>
              </div>
            </div>
          ))}
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
    </div>
  );
}

