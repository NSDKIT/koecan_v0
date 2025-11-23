'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { PersonalityTypeModal } from '@/components/PersonalityTypeModal';
import { Building, Users, Brain, ChevronDown, ChevronUp } from 'lucide-react';

interface CompanyPersonalityBreakdownProps {
  companyId: string;
}

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

export function CompanyPersonalityBreakdown({ companyId }: CompanyPersonalityBreakdownProps) {
  const [jobTypeResults, setJobTypeResults] = useState<PersonalityResult[]>([]);
  const [yearsResults, setYearsResults] = useState<PersonalityResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'job' | 'years'>('job');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchResults = async () => {
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

    if (companyId) {
      fetchResults();
    }
  }, [companyId]);

  const toggleCategory = (categoryValue: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryValue)) {
      newExpanded.delete(categoryValue);
    } else {
      newExpanded.add(categoryValue);
    }
    setExpandedCategories(newExpanded);
  };

  const currentResults = selectedView === 'job' ? jobTypeResults : yearsResults;

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
      {/* ビュー切り替え */}
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

      {/* 結果表示 */}
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

