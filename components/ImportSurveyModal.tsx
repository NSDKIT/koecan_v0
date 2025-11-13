// koecan_v0-main/components/ImportSurveyModal.tsx

'use client'

import React, { useState } from 'react';
import { X, FileText, Upload, AlertCircle, Loader2, List } from 'lucide-react'; // Loader2, List を追加
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ImportSurveyModalProps {
  onClose: () => void;
  onImport: () => void;
}

// 複数アンケートを格納する型
interface ParsedSurvey {
    title: string;
    description: string;
    questions: any[];
}


const parseMarkdown = (text: string): ParsedSurvey[] => {
    // 最初のトップレベルの見出し（# ）でドキュメントを分割
    // 正規表現: /(?=^#)/gm は、行頭にある # の直前を検索し、分割する (lookahead)
    const rawDocuments = text.trim().split(/(?=^#)/gm).filter(doc => doc.trim());
    const finalSurveys: ParsedSurvey[] = [];

    rawDocuments.forEach(docText => {
        const lines = docText.trim().split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        let title = '';
        let description = '';
        const questions: any[] = [];
        let currentQuestion: any = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Title (# heading) - 最初の行が # で始まることを期待
            if (line.startsWith('# ') && !title) {
                title = line.substring(2).trim();
                continue;
            }

            // Description (## heading) - 2番目のトップレベル
            if (line.startsWith('## ') && !description) {
                description = line.substring(3).trim();
                continue;
            }

            // Question (###, ####, ##### heading, $$$ ranking)
            const isRanking = line.startsWith('$$$');
            const isText = line.startsWith('##### ');
            const isMulti = line.startsWith('#### ');
            const isSingle = line.startsWith('### ');

            if (isRanking || isText || isMulti || isSingle) {
                // 既存の質問を保存
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }
                
                const questionText = line.substring(line.indexOf(' ') + 1).trim();
                const questionIndex = questions.length;

                if (isRanking) {
                    const parts = line.split(' ');
                    const maxSelections = parts[0].includes('-') ? 
                        parseInt(parts[0].split('-')[1]) : 3;
                    
                    currentQuestion = {
                        question_text: questionText,
                        question_type: 'ranking',
                        options: [],
                        required: true,
                        order_index: questionIndex,
                        is_multiple_select: true,
                        max_selections: maxSelections
                    };
                } else {
                    currentQuestion = {
                        question_text: questionText,
                        question_type: isText ? 'text' : 'multiple_choice',
                        options: [],
                        required: !isText, // 自由記述以外は必須と仮定
                        order_index: questionIndex,
                        is_multiple_select: isMulti,
                        max_selections: null
                    };
                }
                continue;
            }

            // Options (□ checkbox)
            if (line.startsWith('□ ') && currentQuestion) {
                currentQuestion.options.push(line.substring(2).trim());
                continue;
            }
        }

        // 最後の質問を保存
        if (currentQuestion) {
            questions.push(currentQuestion);
        }

        // アンケートとして有効な場合のみ追加
        if (title && questions.length > 0) {
            finalSurveys.push({ title, description, questions });
        }
    });

    return finalSurveys;
};


export function ImportSurveyModal({ onClose, onImport }: ImportSurveyModalProps) {
  const { user } = useAuth();
  const [markdownText, setMarkdownText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedSurvey[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = () => {
    setError(null);
    if (!markdownText.trim()) return;
    
    try {
      const parsed = parseMarkdown(markdownText);
      setPreview(parsed);
      if (parsed.length === 0) {
          setError("Markdownから有効なアンケートが抽出されませんでした。ヘッダー（#）と質問（###）を確認してください。");
      }
    } catch (error) {
      setError(`Markdown解析に失敗しました。形式を確認してください: ${error.message}`);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0 || !user) return;

    setLoading(true);
    setError(null);
    
    try {
      // ★★★ 修正箇所: 複数のアンケートを順次挿入するロジック ★★★
      for (const p of preview) {
          
          // 1. Create survey
          const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .insert([
              {
                client_id: user.id, 
                title: p.title,
                description: p.description,
                points_reward: 10,
                status: 'draft'
              }
            ])
            .select('id')
            .single(); // IDを取得

          if (surveyError) throw surveyError;

          // 2. Create questions (Bulk insert)
          const questionsToInsert = p.questions.map((q: any) => ({
            survey_id: survey.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options.length > 0 ? q.options : null, // 空配列を null に変換
            required: q.required,
            order_index: q.order_index,
            is_multiple_select: q.is_multiple_select || false,
            max_selections: q.max_selections || null
          }));

          const { error: questionsError } = await supabase
            .from('questions')
            .insert(questionsToInsert);

          if (questionsError) throw questionsError;
      }
      // ★★★ 修正箇所ここまで ★★★

      alert(`${preview.length}件のアンケートをインポートしました！`);
      onImport();
      onClose();
    } catch (error) {
      console.error('Error importing survey:', error);
      setError(`アンケートのインポートに失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3 mr-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">マークダウンからアンケート作成</h2>
              <p className="text-gray-600">マークダウン形式のテキストからアンケートを作成します</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">エラー:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {!preview ? (
            /* Input Form */
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">マークダウンテキストを入力</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-2">マークダウン形式の例 (複数インポート可):</p>
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`# 最初のアンケートタイトル

## 最初のアンケートの説明

### Q1. 単一選択の質問
□ 選択肢1
□ 選択肢2

# 2番目のアンケートタイトル

## 2番目のアンケートの説明

#### Q2. 複数選択の質問（複数選択可）
□ 選択肢A
□ 選択肢B`}
                      </pre>
                    </div>
                  </div>
                </div>

                <textarea
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="マークダウン形式でアンケートを入力してください..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handlePreview}
                  disabled={!markdownText.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  プレビュー
                </button>
              </div>
            </div>
          ) : (
            /* Preview */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">プレビュー ({preview.length}件のアンケート)</h3>
                <button
                  onClick={() => setPreview(null)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  編集に戻る
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-sm font-semibold text-gray-800 mb-2">インポートされるアンケート一覧:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 max-h-40 overflow-y-auto">
                    {preview.map((p: ParsedSurvey, index: number) => (
                        <li key={index}>
                            <List className="w-3 h-3 inline-block mr-1"/>
                            **{p.title}** ({p.questions.length}問)
                        </li>
                    ))}
                </ul>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setPreview(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  編集に戻る
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {preview.length}件をインポート
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
