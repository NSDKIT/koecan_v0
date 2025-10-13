// koecan_v0-main/components/ImportSurveyModal.tsx

'use client'

import React, { useState } from 'react';
import { X, FileText, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ImportSurveyModalProps {
  onClose: () => void;
  onImport: () => void;
}

export function ImportSurveyModal({ onClose, onImport }: ImportSurveyModalProps) {
  const { user } = useAuth();
  const [markdownText, setMarkdownText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const parseMarkdown = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    let title = '';
    let description = '';
    const questions: any[] = [];
    let currentQuestion: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Title (# heading)
      if (line.startsWith('# ') && !title) {
        title = line.substring(2).trim();
        continue;
      }

      // Description (## heading)
      if (line.startsWith('## ') && !description) {
        description = line.substring(3).trim();
        continue;
      }

      // Question (### heading)
      if (line.startsWith('### ')) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          question_text: line.substring(4).trim(),
          question_type: 'multiple_choice',
          options: [],
          required: true,
          order_index: questions.length
        };
        continue;
      }

      // Question (#### heading)
      if (line.startsWith('#### ')) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          question_text: line.substring(5).trim(),
          question_type: 'multiple_choice',
          options: [],
          required: true,
          order_index: questions.length,
          is_multiple_select: true
        };
        continue;
      }

      // Question (##### heading) - Text question
      if (line.startsWith('##### ')) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          question_text: line.substring(6).trim(),
          question_type: 'text',
          options: [],
          required: false,
          order_index: questions.length
        };
        continue;
      }

      // Special ranking question ($$$)
      if (line.startsWith('$$$')) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        const parts = line.split(' ');
        const maxSelections = parts[0].includes('-') ? 
          parseInt(parts[0].split('-')[1]) : 3;
        
        currentQuestion = {
          question_text: line.substring(line.indexOf(' ') + 1).trim(),
          question_type: 'ranking',
          options: [],
          required: true,
          order_index: questions.length,
          is_multiple_select: true,
          max_selections: maxSelections
        };
        continue;
      }

      // Options (□ checkbox)
      if (line.startsWith('□ ') && currentQuestion) {
        currentQuestion.options.push(line.substring(2).trim());
        continue;
      }
    }

    // Add the last question
    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return {
      title: title || 'インポートされたアンケート',
      description: description || 'マークダウンからインポートされたアンケートです。',
      questions
    };
  };

  const handlePreview = () => {
    if (!markdownText.trim()) return;
    
    try {
      const parsed = parseMarkdown(markdownText);
      setPreview(parsed);
    } catch (error) {
      alert('マークダウンの解析に失敗しました。形式を確認してください。');
    }
  };

  const handleImport = async () => {
    if (!preview || !user) return;

    setLoading(true);
    try {
      // Create survey
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert([
          {
            client_id: user.id,
            title: preview.title,
            description: preview.description,
            points_reward: 10,
            status: 'draft'
          }
        ])
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Create questions
      const questionsToInsert = preview.questions.map((q: any) => ({
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        required: q.required,
        order_index: q.order_index,
        is_multiple_select: q.is_multiple_select || false,
        max_selections: q.max_selections || null
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      alert('アンケートをインポートしました！');
      onImport();
      onClose();
    } catch (error) {
      console.error('Error importing survey:', error);
      alert('アンケートのインポートに失敗しました。');
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
          {!preview ? (
            /* Input Form */
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">マークダウンテキストを入力</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-2">マークダウン形式の例:</p>
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`# アンケートタイトル

## アンケートの説明

### 単一選択の質問
□ 選択肢1
□ 選択肢2
□ 選択肢3

#### 複数選択の質問（複数選択可）
□ 選択肢A
□ 選択肢B
□ 選択肢C

$$$1-3 ランキング質問（3つまで選択）
□ 項目1
□ 項目2
□ 項目3

##### 自由記述の質問`}
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
                <h3 className="text-lg font-semibold text-gray-800">プレビュー</h3>
                <button
                  onClick={() => setPreview(null)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  編集に戻る
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-xl font-bold text-gray-800 mb-2">{preview.title}</h4>
                <p className="text-gray-600 mb-4">{preview.description}</p>
                <p className="text-sm text-gray-500">{preview.questions.length}個の質問</p>
              </div>

              <div className="space-y-6 mb-6 max-h-64 overflow-y-auto">
                {preview.questions.map((question: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-2">
                      {index + 1}. {question.question_text}
                    </h5>
                    <div className="text-sm text-gray-600 mb-2">
                      種類: {
                        question.question_type === 'multiple_choice' ? '選択式' :
                        question.question_type === 'text' ? '自由記述' :
                        question.question_type === 'ranking' ? 'ランキング' : question.question_type
                      }
                      {question.is_multiple_select && ' (複数選択可)'}
                      {question.max_selections && ` (最大${question.max_selections}個)`}
                    </div>
                    {question.options.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {question.options.map((option: string, optionIndex: number) => (
                          <li key={optionIndex}>{option}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
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
                  インポート
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
