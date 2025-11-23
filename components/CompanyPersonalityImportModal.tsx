'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { Advertisement } from '@/types';
import { X, Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface CompanyPersonalityImportModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

interface ParsedRow {
  timestamp: string;
  jobType: string;
  yearsOfService: string;
  answers: {
    market_engagement: number[]; // 3問
    growth_strategy: number[];  // 4問
    organization_style: number[]; // 3問
    decision_making: number[];   // 3問
  };
}

export function CompanyPersonalityImportModal({ onClose, onImportSuccess }: CompanyPersonalityImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [availableCompanies, setAvailableCompanies] = useState<{ id: string; name: string }[]>([]);

  // 企業一覧を取得
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from('advertisements')
          .select('id, company_name')
          .eq('is_active', true)
          .order('company_name');

        if (error) throw error;
        setAvailableCompanies(data?.map((c: Advertisement) => ({ id: c.id, name: c.company_name })) || []);
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    };
    fetchCompanies();
  }, []);

  // タイプコードを生成する関数
  const calculateType = (scores: { market_engagement: number; growth_strategy: number; organization_style: number; decision_making: number }): string => {
    let typeCode = '';
    if (scores.market_engagement > 0) {
      typeCode += 'E';
    } else if (scores.market_engagement < 0) {
      typeCode += 'I';
    } else {
      typeCode += 'E/I';
    }
    
    if (scores.growth_strategy > 0) {
      typeCode += 'N';
    } else if (scores.growth_strategy < 0) {
      typeCode += 'S';
    } else {
      typeCode += 'N/S';
    }
    
    if (scores.organization_style > 0) {
      typeCode += 'P';
    } else if (scores.organization_style < 0) {
      typeCode += 'R';
    } else {
      typeCode += 'P/R';
    }
    
    if (scores.decision_making > 0) {
      typeCode += 'F';
    } else if (scores.decision_making < 0) {
      typeCode += 'O';
    } else {
      typeCode += 'F/O';
    }
    
    return typeCode;
  };

  // CSVをパースする関数
  const parseCSV = (csvText: string): ParsedRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSVファイルが空です');

    const headers = lines[0].split(',').map(h => h.trim());
    const rows: ParsedRow[] = [];

    // ヘッダーのインデックスを取得
    const timestampIdx = headers.indexOf('タイムスタンプ');
    const jobTypeIdx = headers.indexOf('職種');
    const yearsOfServiceIdx = headers.indexOf('現在の会社での勤続年数を教えてください。');
    const answerIndices = {
      market_engagement: [
        headers.indexOf('考え方の傾向'),
        headers.indexOf('活動対象の優先順位'),
        headers.indexOf('交流の中心')
      ],
      growth_strategy: [
        headers.indexOf('新しいアイデアへの姿勢'),
        headers.indexOf('仕事の進め方'),
        headers.indexOf('技術やトレンドの採用'),
        headers.indexOf('新プロジェクトの進め方')
      ],
      organization_style: [
        headers.indexOf('評価指標'),
        headers.indexOf('成功の定義'),
        headers.indexOf('失敗やトラブルへの対応')
      ],
      decision_making: [
        headers.indexOf('業務運営の方針'),
        headers.indexOf('計画の変更'),
        headers.indexOf('評価・キャリアのスタンス')
      ]
    };

    // 必須フィールドのチェック
    if (timestampIdx === -1 || jobTypeIdx === -1 || yearsOfServiceIdx === -1) {
      throw new Error('CSVファイルのヘッダーが正しくありません。必須フィールドが見つかりません。');
    }

    // データ行をパース
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length < headers.length) continue; // 不完全な行をスキップ

      const timestamp = values[timestampIdx] || '';
      const jobType = values[jobTypeIdx] || '';
      const yearsOfService = values[yearsOfServiceIdx] || '';

      // 回答を取得（数値に変換、空の場合は0）
      // 値が文字化けしている可能性があるため、数値のみを抽出
      const parseValue = (val: string): number => {
        if (!val || val.trim() === '') return 0;
        // 数値のみを抽出（負の数も含む）
        const match = val.match(/-?\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          return isNaN(num) ? 0 : num;
        }
        return 0;
      };

      const answers = {
        market_engagement: answerIndices.market_engagement.map(idx => {
          const val = values[idx] || '0';
          return parseValue(val);
        }),
        growth_strategy: answerIndices.growth_strategy.map(idx => {
          const val = values[idx] || '0';
          return parseValue(val);
        }),
        organization_style: answerIndices.organization_style.map(idx => {
          const val = values[idx] || '0';
          return parseValue(val);
        }),
        decision_making: answerIndices.decision_making.map(idx => {
          const val = values[idx] || '0';
          return parseValue(val);
        })
      };

      rows.push({
        timestamp,
        jobType,
        yearsOfService,
        answers
      });
    }

    return rows;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('CSVファイルを選択してください。');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(null);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setPreview(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSVファイルの読み込みに失敗しました。');
      setPreview(null);
    }
  };

  const handleImport = async () => {
    if (!file || !preview || preview.length === 0) {
      setError('ファイルを選択してください。');
      return;
    }

    if (!selectedCompanyId) {
      setError('企業を選択してください。');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 全データを集計してタイプを算出
      const scores = {
        market_engagement: 0,
        growth_strategy: 0,
        organization_style: 0,
        decision_making: 0
      };

      preview.forEach(row => {
        scores.market_engagement += row.answers.market_engagement.reduce((a, b) => a + b, 0);
        scores.growth_strategy += row.answers.growth_strategy.reduce((a, b) => a + b, 0);
        scores.organization_style += row.answers.organization_style.reduce((a, b) => a + b, 0);
        scores.decision_making += row.answers.decision_making.reduce((a, b) => a + b, 0);
      });

      // 平均を計算
      const count = preview.length;
      scores.market_engagement = scores.market_engagement / count;
      scores.growth_strategy = scores.growth_strategy / count;
      scores.organization_style = scores.organization_style / count;
      scores.decision_making = scores.decision_making / count;

      // タイプコードを生成
      const personalityType = calculateType(scores);

      // advertisementsテーブルにpersonality_typeを保存
      const { error: updateError } = await supabase
        .from('advertisements')
        .update({ personality_type: personalityType })
        .eq('id', selectedCompanyId);

      if (updateError) throw updateError;

      // 職種別集計
      const jobTypeMap = new Map<string, ParsedRow[]>();
      preview.forEach(row => {
        const key = row.jobType || '不明';
        if (!jobTypeMap.has(key)) {
          jobTypeMap.set(key, []);
        }
        jobTypeMap.get(key)!.push(row);
      });

      const jobTypeResults: any[] = [];
      jobTypeMap.forEach((rows, jobType) => {
        const jobScores = {
          market_engagement: 0,
          growth_strategy: 0,
          organization_style: 0,
          decision_making: 0
        };

        rows.forEach(row => {
          jobScores.market_engagement += row.answers.market_engagement.reduce((a, b) => a + b, 0);
          jobScores.growth_strategy += row.answers.growth_strategy.reduce((a, b) => a + b, 0);
          jobScores.organization_style += row.answers.organization_style.reduce((a, b) => a + b, 0);
          jobScores.decision_making += row.answers.decision_making.reduce((a, b) => a + b, 0);
        });

        const count = rows.length;
        jobScores.market_engagement = jobScores.market_engagement / count;
        jobScores.growth_strategy = jobScores.growth_strategy / count;
        jobScores.organization_style = jobScores.organization_style / count;
        jobScores.decision_making = jobScores.decision_making / count;

        jobTypeResults.push({
          company_id: selectedCompanyId,
          category_type: 'job_type',
          category_value: jobType,
          market_engagement_score: jobScores.market_engagement,
          growth_strategy_score: jobScores.growth_strategy,
          organization_style_score: jobScores.organization_style,
          decision_making_score: jobScores.decision_making,
          personality_type: calculateType(jobScores),
          response_count: count
        });
      });

      // 年代別集計
      const yearsMap = new Map<string, ParsedRow[]>();
      preview.forEach(row => {
        const key = row.yearsOfService || '不明';
        if (!yearsMap.has(key)) {
          yearsMap.set(key, []);
        }
        yearsMap.get(key)!.push(row);
      });

      const yearsResults: any[] = [];
      yearsMap.forEach((rows, yearsOfService) => {
        const yearsScores = {
          market_engagement: 0,
          growth_strategy: 0,
          organization_style: 0,
          decision_making: 0
        };

        rows.forEach(row => {
          yearsScores.market_engagement += row.answers.market_engagement.reduce((a, b) => a + b, 0);
          yearsScores.growth_strategy += row.answers.growth_strategy.reduce((a, b) => a + b, 0);
          yearsScores.organization_style += row.answers.organization_style.reduce((a, b) => a + b, 0);
          yearsScores.decision_making += row.answers.decision_making.reduce((a, b) => a + b, 0);
        });

        const count = rows.length;
        yearsScores.market_engagement = yearsScores.market_engagement / count;
        yearsScores.growth_strategy = yearsScores.growth_strategy / count;
        yearsScores.organization_style = yearsScores.organization_style / count;
        yearsScores.decision_making = yearsScores.decision_making / count;

        yearsResults.push({
          company_id: selectedCompanyId,
          category_type: 'years_of_service',
          category_value: yearsOfService,
          market_engagement_score: yearsScores.market_engagement,
          growth_strategy_score: yearsScores.growth_strategy,
          organization_style_score: yearsScores.organization_style,
          decision_making_score: yearsScores.decision_making,
          personality_type: calculateType(yearsScores),
          response_count: count
        });
      });

      // 既存の結果を削除（同じ企業の既存データを上書き）
      const { error: deleteError } = await supabase
        .from('company_personality_results')
        .delete()
        .eq('company_id', selectedCompanyId);

      if (deleteError) throw deleteError;

      // 職種別・年代別の結果をデータベースに保存
      const allResults = [...jobTypeResults, ...yearsResults];
      if (allResults.length > 0) {
        const { error: insertError } = await supabase
          .from('company_personality_results')
          .insert(allResults);

        if (insertError) throw insertError;
      }

      // データベースに保存する前に、データを準備（履歴として保存）
      const records = preview.map((row, index) => ({
        timestamp: row.timestamp,
        job_type: row.jobType,
        years_of_service: row.yearsOfService,
        market_engagement_q1: row.answers.market_engagement[0],
        market_engagement_q2: row.answers.market_engagement[1],
        market_engagement_q3: row.answers.market_engagement[2],
        growth_strategy_q1: row.answers.growth_strategy[0],
        growth_strategy_q2: row.answers.growth_strategy[1],
        growth_strategy_q3: row.answers.growth_strategy[2],
        growth_strategy_q4: row.answers.growth_strategy[3],
        organization_style_q1: row.answers.organization_style[0],
        organization_style_q2: row.answers.organization_style[1],
        organization_style_q3: row.answers.organization_style[2],
        decision_making_q1: row.answers.decision_making[0],
        decision_making_q2: row.answers.decision_making[1],
        decision_making_q3: row.answers.decision_making[2],
        row_index: index + 1,
        company_id: selectedCompanyId
      }));

      // 履歴としてlocalStorageに保存
      const existingData = JSON.parse(localStorage.getItem('company_personality_data') || '[]');
      const newData = [...existingData, ...records];
      localStorage.setItem('company_personality_data', JSON.stringify(newData));

      setSuccess(`${preview.length}件のデータをインポートし、企業のパーソナリティタイプを${personalityType}に設定しました。`);
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'データのインポートに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-500 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">企業パーソナリティ診断 CSVインポート</h2>
              <p className="text-purple-50 text-sm mt-1">CSVファイルをアップロードして診断データをインポート</p>
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center mb-4">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center mb-4">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              企業を選択
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">企業を選択してください</option>
              {availableCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSVファイルを選択
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-gray-600 font-medium">
                  {file ? file.name : 'CSVファイルを選択'}
                </span>
                <span className="text-gray-500 text-sm mt-1">
                  クリックしてファイルを選択
                </span>
              </label>
            </div>
          </div>

          {preview && preview.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                プレビュー ({preview.length}件)
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {preview.slice(0, 5).map((row, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{row.jobType}</span>
                        <span className="text-gray-600">{row.yearsOfService}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        回答数: {Object.values(row.answers).flat().length}問
                      </div>
                    </div>
                  ))}
                  {preview.length > 5 && (
                    <div className="text-center text-gray-500 text-sm py-2">
                      ... 他 {preview.length - 5}件
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              onClick={handleImport}
              disabled={!file || !preview || loading}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  インポート中...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  インポート
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

