'use client'

import React, { useState } from 'react';
import { X, Check, MapPin } from 'lucide-react';

interface LocationFilterModalProps {
  selectedLocations: string[];
  onClose: () => void;
  onApply: (locations: string[]) => void;
}

// 福井県内の市町村リスト
const FUKUI_LOCATIONS = [
  '福井市',
  '敦賀市',
  '小浜市',
  '大野市',
  '勝山市',
  '鯖江市',
  'あわら市',
  '越前市',
  '坂井市',
  '永平寺町',
  '池田町',
  '南越前町',
  '越前町',
  '美浜町',
  '高浜町',
  'おおい町',
  '若狭町'
];

export function LocationFilterModal({ selectedLocations, onClose, onApply }: LocationFilterModalProps) {
  const [selected, setSelected] = useState<string[]>(selectedLocations);

  const toggleLocation = (location: string) => {
    setSelected(prev => {
      if (prev.includes(location)) {
        return prev.filter(l => l !== location);
      } else {
        return [...prev, location];
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
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-500 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">勤務地を選択</h2>
              <p className="text-green-50 text-sm mt-1">複数選択可能</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-100 transition-colors"
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FUKUI_LOCATIONS.map((location) => (
              <button
                key={location}
                onClick={() => toggleLocation(location)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selected.includes(location)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-4 h-4 ${selected.includes(location) ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="font-medium text-gray-800">{location}</span>
                  </div>
                  {selected.includes(location) && (
                    <Check className="w-5 h-5 text-green-600" />
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
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            適用
          </button>
        </div>
      </div>
    </div>
  );
}

