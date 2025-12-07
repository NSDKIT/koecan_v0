'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { X, Check } from 'lucide-react';

interface DetailedSearchModalProps {
  onClose: () => void;
  onApply: (selectedValues: string[]) => void;
  userInterestedIndustries: string[];
  userInterestedOccupations: string[];
}

// 価値観の8つの選択肢
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

export function DetailedSearchModal({ 
  onClose, 
  onApply,
  userInterestedIndustries,
  userInterestedOccupations 
}: DetailedSearchModalProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ステップ1: 価値観を選択
  const handleValueToggle = (valueId: string) => {
    setSelectedValues(prev => {
      if (prev.includes(valueId)) {
        return prev.filter(v => v !== valueId);
      } else {
        return [...prev, valueId];
      }
    });
  };

  // ステップ2: 業界で絞り込み
  const handleStep2Next = async () => {
    if (selectedValues.length === 0) {
      alert('価値観を1つ以上選択してください。');
      return;
    }

    setLoading(true);
    try {
      // 価値観に基づいて企業をフィルタリング
      // 価値観の選択肢（E, I, N, S, F, T, P, J）をパーソナリティタイプに変換
      const personalityTypes = convertValuesToPersonalityTypes(selectedValues);
      
      // パーソナリティタイプに一致する企業を取得
      const { data: companies, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .in('personality_type', personalityTypes);

      if (error) throw error;

      // 業界で絞り込み
      const filtered = companies?.filter(company => {
        if (!company.industries || !Array.isArray(company.industries)) return false;
        return userInterestedIndustries.some(industry => 
          company.industries!.some(compIndustry => compIndustry === industry)
        );
      }) || [];

      setFilteredCompanies(filtered);
      setStep(2);
    } catch (error) {
      console.error('企業フィルタリングエラー:', error);
      alert('企業の絞り込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // ステップ3: 職種で絞り込み
  const handleStep3Next = async () => {
    setLoading(true);
    try {
      // 職種で絞り込み
      const { data: jobTypeData, error: jobError } = await supabase
        .from('company_personality_individual_responses')
        .select('company_id, job_type')
        .in('job_type', userInterestedOccupations);

      if (jobError) throw jobError;

      const companyIdsWithJobTypes = new Set(
        jobTypeData?.map((item: { company_id: string | null }) => item.company_id).filter((id: string | null): id is string => id !== null) || []
      );

      const finalFiltered = filteredCompanies.filter(company => 
        companyIdsWithJobTypes.has(company.id)
      );

      setFilteredCompanies(finalFiltered);
      setStep(3);
    } catch (error) {
      console.error('職種フィルタリングエラー:', error);
      alert('職種での絞り込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 価値観の選択肢をパーソナリティタイプに変換
  // 注意: F/TとP/Jは逆になっている
  // F（人を大切にする柔らかい雰囲気）→ P（人材志向）
  // T（数値的な目標に向かって突き進む）→ R（成果志向）
  // P（自分なりのやり方で進められる）→ F（柔軟型）
  // J（ルールが明確で迷わず働ける）→ O（規律型）
  const convertValuesToPersonalityTypes = (values: string[]): string[] => {
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
  };

  const handleApply = () => {
    // 最終結果を適用
    onApply(selectedValues);
    onClose();
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">詳細検索</h2>
              <p className="text-orange-50 text-sm mt-1">ステップ {step}/3</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-orange-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <>
              <h3 className="text-lg font-bold text-gray-800 mb-4">1. 価値観</h3>
              <div className="space-y-2">
                {VALUE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleValueToggle(option.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedValues.includes(option.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{option.label}</span>
                      {selectedValues.includes(option.id) && (
                        <Check className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-lg font-bold text-gray-800 mb-4">2. 業界で絞り込み</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">あなたが選択した業界:</p>
                <div className="flex flex-wrap gap-2">
                  {userInterestedIndustries.map((industry) => (
                    <span
                      key={industry}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {filteredCompanies.length}件の企業が見つかりました
                </p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-lg font-bold text-gray-800 mb-4">3. 職種で絞り込み</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">あなたが選択した職種:</p>
                <div className="flex flex-wrap gap-2">
                  {userInterestedOccupations.map((occupation) => (
                    <span
                      key={occupation}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {occupation}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {filteredCompanies.length}件の企業が見つかりました
                </p>
              </div>
            </>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl flex space-x-4">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              戻る
            </button>
          )}
          {step === 1 && (
            <button
              onClick={handleStep2Next}
              disabled={selectedValues.length === 0 || loading}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors font-semibold ${
                selectedValues.length === 0 || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              次へ
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleStep3Next}
              disabled={loading || filteredCompanies.length === 0}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors font-semibold ${
                loading || filteredCompanies.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              次へ
            </button>
          )}
          {step === 3 && (
            <button
              onClick={handleApply}
              disabled={loading || filteredCompanies.length === 0}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors font-semibold ${
                loading || filteredCompanies.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              適用
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

