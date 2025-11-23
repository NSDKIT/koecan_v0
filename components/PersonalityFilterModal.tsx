'use client'

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface PersonalityFilterModalProps {
  selectedTypes: string[];
  onClose: () => void;
  onApply: (types: string[]) => void;
}

// 16タイプのパーソナリティタイプ
const PERSONALITY_TYPES = [
  'ENPF', 'ENPO', 'ENRF', 'ENRO',
  'ESPF', 'ESPO', 'ESRF', 'ESRO',
  'INPF', 'INPO', 'INRF', 'INRO',
  'ISPF', 'ISPO', 'ISRF', 'ISRO'
];

export function PersonalityFilterModal({ selectedTypes, onClose, onApply }: PersonalityFilterModalProps) {
  const [selected, setSelected] = useState<string[]>(selectedTypes);

  const toggleType = (type: string) => {
    setSelected(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
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
              <h2 className="text-2xl font-bold">価値観（パーソナリティタイプ）を選択</h2>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PERSONALITY_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selected.includes(type)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">{type}</span>
                  {selected.includes(type) && (
                    <Check className="w-4 h-4 text-purple-600" />
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
            適用 ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}

