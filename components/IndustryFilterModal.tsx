'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { X, Check } from 'lucide-react';

interface IndustryFilterModalProps {
  selectedIndustries: string[];
  onClose: () => void;
  onApply: (industries: string[]) => void;
}

export function IndustryFilterModal({ selectedIndustries, onClose, onApply }: IndustryFilterModalProps) {
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>(selectedIndustries);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const { data, error } = await supabase
          .from('advertisements')
          .select('industries')
          .eq('is_active', true);

        if (error) throw error;

        // 全ての業界を取得してユニークなリストを作成
        const industriesSet = new Set<string>();
        data?.forEach((ad: { industries: string[] | null }) => {
          if (ad.industries && Array.isArray(ad.industries)) {
            ad.industries.forEach((industry: string) => {
              if (industry && industry.trim()) {
                industriesSet.add(industry.trim());
              }
            });
          }
        });

        setAvailableIndustries(Array.from(industriesSet).sort());
      } catch (err) {
        console.error('Error fetching industries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIndustries();
  }, []);

  const toggleIndustry = (industry: string) => {
    setSelected(prev => {
      if (prev.includes(industry)) {
        return prev.filter(i => i !== industry);
      } else {
        return [...prev, industry];
      }
    });
  };

  const handleApply = () => {
    onApply(selected);
    onClose();
  };

  const handleClear = () => {
    setSelected([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">業界を選択</h2>
              <p className="text-blue-50 text-sm mt-1">複数選択可能</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleClear}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  すべてクリア
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableIndustries.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">業界データがありません</p>
                ) : (
                  availableIndustries.map((industry) => (
                    <button
                      key={industry}
                      onClick={() => toggleIndustry(industry)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selected.includes(industry)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{industry}</span>
                        {selected.includes(industry) && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            適用 ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}

