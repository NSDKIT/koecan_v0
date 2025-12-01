'use client'

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { supabase } from '@/config/supabase';

interface JobTypeFilterModalProps {
  selectedJobTypes: string[];
  onClose: () => void;
  onApply: (jobTypes: string[]) => void;
}

export function JobTypeFilterModal({ selectedJobTypes, onClose, onApply }: JobTypeFilterModalProps) {
  const [selected, setSelected] = useState<string[]>(selectedJobTypes);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 職種一覧を取得
    const fetchJobTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('company_personality_individual_responses')
          .select('job_type')
          .not('job_type', 'is', null);

        if (error) {
          console.error('職種取得エラー:', error);
          return;
        }

        // 一意の職種を取得
        const uniqueJobTypes: string[] = Array.from<string>(
          new Set(
            data
              .map((item: { job_type: string | null }) => item.job_type)
              .filter((jobType: string | null): jobType is string => jobType !== null && jobType !== '')
          )
        ).sort();

        setJobTypes(uniqueJobTypes);
      } catch (error) {
        console.error('職種取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobTypes();
  }, []);

  const toggleJobType = (jobType: string) => {
    setSelected(prev => {
      if (prev.includes(jobType)) {
        return prev.filter(t => t !== jobType);
      } else {
        return [...prev, jobType];
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
              <h2 className="text-2xl font-bold">業種を選択</h2>
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
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">職種を読み込み中...</p>
            </div>
          ) : jobTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">職種データがありません</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {jobTypes.map((jobType) => (
                  <button
                    key={jobType}
                    onClick={() => toggleJobType(jobType)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selected.includes(jobType)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{jobType}</span>
                      {selected.includes(jobType) && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              適用 ({selected.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

