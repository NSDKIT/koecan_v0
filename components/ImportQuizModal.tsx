// koecan_v0-main/components/ImportQuizModal.tsx

'use client'

import React, { useState } from 'react';
import { X, FileText, Upload, AlertCircle, Loader2, List } from 'lucide-react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ImportQuizModalProps {
  onClose: () => void;
  onImport: () => void;
}

// 複数クイズを格納する型
interface ParsedQuiz {
    title: string;
    description: string;
    questions: any[];
}

const parseMarkdown = (text: string): ParsedQuiz[] => {
    const sanitized = text.replace(/\r/g, '');
    const lines = sanitized.split('\n');
    const finalQuizzes: ParsedQuiz[] = [];

    let currentQuiz: ParsedQuiz | null = null;
    let currentQuestion: any = null;

    const finalizeQuestion = () => {
        if (!currentQuestion || !currentQuiz) return;
        if (
            currentQuestion.question_type === 'yes_no' &&
            (!currentQuestion.options || currentQuestion.options.length === 0)
        ) {
            currentQuestion.options = ['はい', 'いいえ'];
        }
        currentQuiz.questions.push(currentQuestion);
        currentQuestion = null;
    };

    const finalizeQuiz = () => {
        finalizeQuestion();
        if (currentQuiz && currentQuiz.title && currentQuiz.questions.length > 0) {
            finalQuizzes.push(currentQuiz);
        }
        currentQuiz = null;
    };

    const parseQuestionHeading = (line: string, questionIndex: number) => {
        if (line.startsWith('$$$')) {
            const parts = line.split(' ');
            const maxSelections = parts[0].includes('-')
                ? parseInt(parts[0].split('-')[1])
                : 3;
            const questionText = line.substring(line.indexOf(' ') + 1).trim();
            return {
                question_text: questionText,
                question_type: 'ranking',
                options: [],
                required: true,
                order_index: questionIndex,
                is_multiple_select: true,
                max_selections: maxSelections,
                correct_answer: null,
            };
        }

        const headingMatch = line.match(/^(#{3,5})\s*(?:\[(.+?)\])?\s*(.+)$/);
        if (!headingMatch) {
            return null;
        }

        const hashCount = headingMatch[1].length;
        const typeTag = headingMatch[2];
        let questionText = headingMatch[3].trim();

        const defaultConfig = {
            question_type: 'multiple_choice',
            is_multiple_select: hashCount === 4,
            max_selections: null as number | null,
            required: hashCount !== 5,
        };

        const config = { ...defaultConfig };

        if (typeTag) {
            const [typeTokenRaw, ...paramTokens] = typeTag.split(/\s+/);
            const typeToken = typeTokenRaw.toLowerCase();
            const params: Record<string, string> = {};
            paramTokens.forEach((token) => {
                const [key, value] = token.split('=');
                if (key && value) {
                    params[key.toLowerCase()] = value;
                }
            });

            switch (typeToken) {
                case 'single':
                    config.question_type = 'multiple_choice';
                    config.is_multiple_select = false;
                    break;
                case 'multi':
                    config.question_type = 'multiple_choice';
                    config.is_multiple_select = true;
                    if (params.max) {
                        const maxVal = parseInt(params.max);
                        config.max_selections = isNaN(maxVal) ? null : maxVal;
                    }
                    break;
                case 'text':
                    config.question_type = 'text';
                    config.is_multiple_select = false;
                    config.required = false;
                    break;
                case 'yesno':
                case 'yes_no':
                    config.question_type = 'yes_no';
                    config.is_multiple_select = false;
                    break;
                case 'ranking':
                    config.question_type = 'ranking';
                    config.is_multiple_select = true;
                    config.required = true;
                    {
                        const maxVal = params.max ? parseInt(params.max) : 3;
                        config.max_selections = isNaN(maxVal) ? 3 : maxVal;
                    }
                    break;
                case 'rating':
                    config.question_type = 'rating';
                    config.is_multiple_select = false;
                    break;
                default:
                    break;
            }

            if (params.required === 'false') {
                config.required = false;
            }
        } else {
            if (hashCount === 5) {
                config.question_type = 'text';
                config.is_multiple_select = false;
                config.required = false;
            }
        }

        return {
            question_text: questionText,
            question_type: config.question_type,
            options: [] as string[],
            required: config.required,
            order_index: questionIndex,
            is_multiple_select: config.is_multiple_select,
            max_selections: config.max_selections,
            correct_answer: null,
        };
    };

    lines.forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line) return;

        if (/^---+$/.test(line)) {
            finalizeQuiz();
            return;
        }

        if (line.startsWith('# ')) {
            if (/^#\s*（.+）/.test(line)) {
                return;
            }
            finalizeQuiz();
            const title = line.substring(2).trim();
            currentQuiz = { title, description: '', questions: [] };
            return;
        }

        if (line.startsWith('## ')) {
            if (currentQuiz && !currentQuiz.description) {
                currentQuiz.description = line.substring(3).trim();
            }
            return;
        }

        if (line.startsWith('###') || line.startsWith('####') || line.startsWith('#####') || line.startsWith('$$$')) {
            if (!currentQuiz) {
                return;
            }
            finalizeQuestion();
            const questionIndex = currentQuiz.questions.length;
            const parsedQuestion = parseQuestionHeading(line, questionIndex);
            if (parsedQuestion) {
                currentQuestion = parsedQuestion;
            }
            return;
        }

        if (line.startsWith('□ ') && currentQuestion) {
            currentQuestion.options.push(line.substring(2).trim());
            return;
        }

        if ((line.startsWith('正解:') || line.startsWith('答え:')) && currentQuestion) {
            const answerText = line.substring(line.indexOf(':') + 1).trim();
            const answers = answerText.split(',').map((a) => a.trim()).filter(Boolean);
            currentQuestion.correct_answer = answers.join(', ');
            return;
        }
    });

    finalizeQuiz();
    return finalQuizzes;
};

export function ImportQuizModal({ onClose, onImport }: ImportQuizModalProps) {
  const { user } = useAuth();
  const [markdownText, setMarkdownText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedQuiz[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatError = (error: unknown) => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null) {
      try {
        return JSON.stringify(error, null, 2);
      } catch (_) {
        return String(error);
      }
    }
    return String(error);
  };

  const handlePreview = () => {
    setError(null);
    if (!markdownText.trim()) return;
    
    try {
      const parsed = parseMarkdown(markdownText);
      setPreview(parsed);
      if (parsed.length === 0) {
          setError("Markdownから有効なクイズが抽出されませんでした。ヘッダー（#）と質問（###）を確認してください。");
      }
    } catch (error: unknown) {
      setError(`Markdown解析に失敗しました。形式を確認してください: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0 || !user) return;

    setLoading(true);
    setError(null);
    
    try {
      // 複数のクイズを順次挿入
      for (const p of preview) {
          // 1. Create quiz
          const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
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
            .single();

          if (quizError) throw quizError;

          // 2. Create questions (Bulk insert)
          const questionsToInsert = p.questions.map((q: any) => ({
            quiz_id: quiz.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options.length > 0 ? q.options : null,
            required: q.required,
            order_index: q.order_index,
            is_multiple_select: q.is_multiple_select || false,
            max_selections: q.max_selections || null,
            correct_answer: q.correct_answer || null
          }));

          const { error: questionsError } = await supabase
            .from('quiz_questions')
            .insert(questionsToInsert);

          if (questionsError) throw questionsError;
      }

      alert(`${preview.length}件のクイズをインポートしました！`);
      onImport();
      onClose();
    } catch (error: unknown) {
      console.error('Error importing quiz:', error);
      setError(`クイズのインポートに失敗しました: ${formatError(error)}`);
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
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-3 mr-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">マークダウンからクイズ作成</h2>
              <p className="text-gray-600">マークダウン形式のテキストからクイズを作成します</p>
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
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-800">
                      <p className="font-semibold mb-2">マークダウン形式の例 (複数インポート可):</p>
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`# 最初のクイズタイトル

## 最初のクイズの説明

### Q1. 単一選択の質問
□ 選択肢1
□ 選択肢2
正解: 選択肢1

# 2番目のクイズタイトル

## 2番目のクイズの説明

#### Q2. 複数選択の質問（複数選択可）
□ 選択肢A
□ 選択肢B
正解: 選択肢A`}
                      </pre>
                    </div>
                  </div>
                </div>

                <textarea
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                  placeholder="マークダウン形式でクイズを入力してください..."
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
                  className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                <h3 className="text-lg font-semibold text-gray-800">プレビュー ({preview.length}件のクイズ)</h3>
                <button
                  onClick={() => setPreview(null)}
                  className="text-orange-600 hover:text-orange-700"
                >
                  編集に戻る
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-sm font-semibold text-gray-800 mb-2">インポートされるクイズ一覧:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 max-h-40 overflow-y-auto">
                    {preview.map((p: ParsedQuiz, index: number) => (
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

