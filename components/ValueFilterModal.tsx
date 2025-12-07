'use client'

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface ValueFilterModalProps {
  selectedValues: string[];
  onClose: () => void;
  onApply: (values: string[]) => void;
}

// 8つの価値観の選択肢
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

export function ValueFilterModal({ selectedValues, onClose, onApply }: ValueFilterModalProps) {
  const [selected, setSelected] = useState<string[]>(selectedValues);

  const toggleValue = (valueId: string) => {
    setSelected(prev => {
      if (prev.includes(valueId)) {
        return prev.filter(v => v !== valueId);
      } else {
        return [...prev, valueId];
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
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-500 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">8つの価値観から選択</h2>
              <p className="text-purple-50 text-sm mt-1">複数選択可能</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleClear}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              すべてクリア
            </button>
          </div>

          <div className="space-y-2">
            {VALUE_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleValue(option.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selected.includes(option.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{option.label}</span>
                  {selected.includes(option.id) && (
                    <Check className="w-5 h-5 text-purple-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
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
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            適用
          </button>
        </div>
      </div>
    </div>
  );
}

