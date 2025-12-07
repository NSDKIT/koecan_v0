'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { X, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface PersonalityAssessmentModalProps {
  onClose: () => void;
  onSaveSuccess?: () => void;
}

interface Question {
  key: string;
  text: string;
  leftLabel: string;
  rightLabel: string;
}

interface Category {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

const categories: Category[] = [
  {
    id: 'market_engagement',
    title: '関わり方（外向型E vs 内向型I）',
    description: '外部への発信と内部の充実、どちらを重視するか',
    questions: [
      {
        key: 'q1',
        text: '初めての環境に入るとき',
        leftLabel: '初対面の人にも自分から声をかけてみることが多い。',
        rightLabel: 'まずは様子を見て、声をかけられることが多い。'
      },
      {
        key: 'q2',
        text: 'イベント等での立ち位置',
        leftLabel: 'イベント等を企画・運営することにやりがいを感じる。',
        rightLabel: '物事を整え、メンバーを支える役割にやりがいを感じる。'
      },
      {
        key: 'q3',
        text: '休日のリフレッシュ方法',
        leftLabel: '友人と遊ぶ、イベントに行くなど人との交流でリフレッシュする。',
        rightLabel: '一人で映画・読書・散歩など、静かな時間でエネルギーを回復する。'
      },
      {
        key: 'q4',
        text: '情報収集のスタイル',
        leftLabel: 'まず周りの人に相談し、対話を通して情報を集めてから動き始める。',
        rightLabel: 'まず自分で調べ、考えを整理してから人に相談する。'
      },
      {
        key: 'q5',
        text: 'チームでのアイデア出し',
        leftLabel: '人と話す中でアイデアがどんどん湧き、議論を通して整理していく。',
        rightLabel: 'まず自分でじっくり考えてから、まとまった案をチームに共有する。'
      },
      {
        key: 'q6',
        text: '飲みの場などにおけるコミュニケーション',
        leftLabel: '幅広くいろんな人と話す。',
        rightLabel: '特定の人と深く話す。'
      }
    ]
  },
  {
    id: 'growth_strategy',
    title: '成長・戦略スタンス（革新型N vs 安定型S）',
    description: '挑戦と変化、それとも安定と改善',
    questions: [
      {
        key: 'q1',
        text: '行動のスタンス',
        leftLabel: '新しいことにチャレンジするのが好きで、未経験の活動でも飛び込むことが多い。',
        rightLabel: '一つのことを長く深く取り組むのが好きで、着実に改善を重ねる方が得意だ。'
      },
      {
        key: 'q2',
        text: '判断軸',
        leftLabel: '「面白そうだからやってみよう」と直感で動くことが多い。',
        rightLabel: '物事を判断する際にはデータや実績を重視し、地に足のついた判断を大切にする。'
      },
      {
        key: 'q3',
        text: 'トレンドへの対応',
        leftLabel: 'トレンドや技術の変化に敏感で、常に新しい刺激を求める。',
        rightLabel: '慣れた環境で安定して成果を出すのが好きだ。'
      },
      {
        key: 'q4',
        text: '魅力的に思うアイデア',
        leftLabel: '複雑で斬新なアイデア',
        rightLabel: '単純明快なアイデア'
      },
      {
        key: 'q5',
        text: 'リスクと安定性への姿勢',
        leftLabel: '少しでも結果が出れば、新しい挑戦をしたいと思う。',
        rightLabel: '大きな実績ができるまでは地道に粘る。'
      },
      {
        key: 'q6',
        text: '好みの情報',
        leftLabel: '未来の可能性や未知の世界の話にワクワクする。',
        rightLabel: '具体的で確実性のある話の方が好きだ。'
      }
    ]
  },
  {
    id: 'organization_style',
    title: '組織運営スタンス（人材志向P vs 成果志向R）',
    description: '仲間と成長、それとも目標達成',
    questions: [
      {
        key: 'q1',
        text: '成長の仕方',
        leftLabel: 'チームメイトと助け合いながら共に成長したい。',
        rightLabel: 'チームメイトと切磋琢磨しながら共に成長したい。'
      },
      {
        key: 'q2',
        text: '評価軸',
        leftLabel: '先輩や友人からの「ありがとう」「頑張ったね」と言われることで評価されていると感じる。',
        rightLabel: 'テストの点数や競技の順位など、明確な結果が評価として大事だと思う。'
      },
      {
        key: 'q3',
        text: 'グループ内での動き方',
        leftLabel: '周りが動きやすくなるようにサポートに回ることが多い。',
        rightLabel: 'まず自分が動いてみて、チームを前に引っ張っていくことが多い。'
      },
      {
        key: 'q4',
        text: '心が動くのは？',
        leftLabel: '人とのつながりや成長が描かれたストーリー。',
        rightLabel: '困難を突破し、成果をつかむストーリー。'
      },
      {
        key: 'q5',
        text: '相談相手に１番求めること',
        leftLabel: '共感して話を聞いてほしい。',
        rightLabel: '解決策を考えて欲しい。'
      },
      {
        key: 'q6',
        text: 'モチベーションの源泉',
        leftLabel: '誰かの力になれたときに「やってよかった」と感じる。',
        rightLabel: '自分が成し遂げた成果が数字や結果として見えると、「やってよかった」と感じる。'
      }
    ]
  },
  {
    id: 'decision_making',
    title: '意思決定・マネジメントスタイル（柔軟型F vs 規律型O）',
    description: '自由な進め方、それとも明確な手順',
    questions: [
      {
        key: 'q1',
        text: '旅行の計画',
        leftLabel: '旅行は行き当たりばったりでも楽しめる。',
        rightLabel: '計画を事前に立てて行く方が楽しめる。'
      },
      {
        key: 'q2',
        text: '変化への対応',
        leftLabel: 'イレギュラーが起きても臨機応変に別の方法を試すことが多い。',
        rightLabel: 'イレギュラーが起きたら計画通りに軌道修正することが多い。'
      },
      {
        key: 'q3',
        text: 'スケジュールの組み立て方',
        leftLabel: '時間が空いたら、その都度予定を入れることが多い。',
        rightLabel: '前もって予定を入れておくことが多い。'
      },
      {
        key: 'q4',
        text: '仕事の優先順位づけ',
        leftLabel: '状況の変化に合わせて優先度を入れ替えながら進めたい。',
        rightLabel: '最初に決めた優先順位を崩さず、順番通りに進めたい。'
      },
      {
        key: 'q5',
        text: '友人との予定の立て方',
        leftLabel: '自分から誘うことは少なく、相手の予定に合わせることが多い。',
        rightLabel: '自分から日程を提案し、率先して調整することが多い。'
      },
      {
        key: 'q6',
        text: '買い物のスタイル',
        leftLabel: 'お店を回りながら直感で「いいな」と思ったものを選ぶことが多い。',
        rightLabel: '買うものを事前に決めて、必要なものだけを効率よく買う。'
      }
    ]
  }
];

export function PersonalityAssessmentModal({ onClose, onSaveSuccess }: PersonalityAssessmentModalProps) {
  const { user } = useAuth();
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // UI値（1〜5）をDB値（-2〜+2）に変換
  const convertUIToDB = (uiValue: number): number => {
    return uiValue - 3; // 1→-2, 2→-1, 3→0, 4→+1, 5→+2
  };

  // DB値（-2〜+2）をUI値（1〜5）に変換
  const convertDBToUI = (dbValue: number): number => {
    return dbValue + 3; // -2→1, -1→2, 0→3, +1→4, +2→5
  };

  // 既存の回答を読み込む
  useEffect(() => {
    const loadAnswers = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('monitor_personality_responses')
          .select('category, question_key, answer')
          .eq('user_id', user.id);

        if (error) throw error;

        const loadedAnswers: Record<string, Record<string, number>> = {};
        data?.forEach((item: { category: string; question_key: string; answer: number }) => {
          if (!loadedAnswers[item.category]) {
            loadedAnswers[item.category] = {};
          }
          // DB値（-2〜+2）をUI値（1〜5）に変換して保存
          loadedAnswers[item.category][item.question_key] = convertDBToUI(item.answer);
        });

        setAnswers(loadedAnswers);
      } catch (err) {
        console.error('回答の読み込みエラー:', err);
        setError('回答の読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    loadAnswers();
  }, [user?.id]);

  const handleAnswerChange = (categoryId: string, questionKey: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [questionKey]: value
      }
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!user?.id) {
      setError('ユーザー情報が見つかりません。');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // すべての回答を準備
      const responses: Array<{
        user_id: string;
        category: string;
        question_key: string;
        answer: number;
      }> = [];

      categories.forEach((category) => {
        category.questions.forEach((question) => {
          const uiAnswer = answers[category.id]?.[question.key];
          if (uiAnswer && uiAnswer >= 1 && uiAnswer <= 5) {
            // UI値（1〜5）をDB値（-2〜+2）に変換して保存
            responses.push({
              user_id: user.id,
              category: category.id,
              question_key: question.key,
              answer: convertUIToDB(uiAnswer)
            });
          }
        });
      });

      if (responses.length === 0) {
        setError('少なくとも1つの質問に回答してください。');
        setSaving(false);
        return;
      }

      // UPSERT（既存の回答は更新、新規の回答は挿入）
      const { error: upsertError } = await supabase
        .from('monitor_personality_responses')
        .upsert(responses, {
          onConflict: 'user_id,category,question_key'
        });

      if (upsertError) throw upsertError;

      setSuccess('回答を保存しました！');
      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess();
          onClose();
        }, 1000);
      }
    } catch (err) {
      console.error('保存エラー:', err);
      setError(err instanceof Error ? err.message : '回答の保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const currentCategory = categories[activeCategoryIndex];
  const categoryAnswers = answers[currentCategory.id] || {};
  const allAnswered = currentCategory.questions.every((q) => categoryAnswers[q.key] && categoryAnswers[q.key] >= 1 && categoryAnswers[q.key] <= 5);

  const progress = ((activeCategoryIndex + 1) / categories.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">価値観診断</h2>
              <p className="text-gray-600 mt-1">あなたの考え方の傾向を診断します</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            {activeCategoryIndex + 1} / {categories.length} カテゴリー
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">回答を読み込み中...</p>
            </div>
          ) : (
            <>
              {/* Category Info */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{currentCategory.title}</h3>
                <p className="text-gray-600">{currentCategory.description}</p>
              </div>

              {/* Questions */}
              <div className="space-y-8">
                {currentCategory.questions.map((question, qIndex) => {
                  const answer = categoryAnswers[question.key];
                  return (
                    <div key={question.key} className="border-b border-gray-200 pb-8 last:border-b-0">
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-1">
                          {qIndex + 1}. {question.text}
                          <span className="text-red-500 ml-1">*</span>
                        </h4>
                      </div>

                      {/* Likert Scale */}
                      <div className="space-y-4">
                        {/* Labels */}
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <div className="w-1/3 pr-4">
                            <p className="text-xs leading-tight">{question.leftLabel}</p>
                          </div>
                          <div className="w-1/3 text-center">
                            <p className="text-xs">考え方の傾向</p>
                          </div>
                          <div className="w-1/3 pl-4 text-right">
                            <p className="text-xs leading-tight">{question.rightLabel}</p>
                          </div>
                        </div>

                        {/* Scale */}
                        <div className="flex items-center justify-center space-x-4">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <div key={value} className="flex flex-col items-center">
                              <label className="cursor-pointer group">
                                <input
                                  type="radio"
                                  name={`${currentCategory.id}-${question.key}`}
                                  value={value}
                                  checked={answer === value}
                                  onChange={() => handleAnswerChange(currentCategory.id, question.key, value)}
                                  className="sr-only"
                                />
                                <div
                                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                    answer === value
                                      ? 'bg-orange-500 border-orange-600 scale-110 shadow-lg'
                                      : 'bg-white border-gray-300 group-hover:border-orange-400 group-hover:bg-orange-50'
                                  }`}
                                >
                                  <span
                                    className={`text-lg font-semibold ${
                                      answer === value ? 'text-white' : 'text-gray-400'
                                    }`}
                                  >
                                    {value}
                                  </span>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-green-700">{success}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (activeCategoryIndex > 0) {
                      setActiveCategoryIndex(activeCategoryIndex - 1);
                      setError(null);
                      setSuccess(null);
                    }
                  }}
                  disabled={activeCategoryIndex === 0}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeCategoryIndex === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  前へ
                </button>

                {activeCategoryIndex < categories.length - 1 ? (
                  <button
                    onClick={() => {
                      if (allAnswered) {
                        setActiveCategoryIndex(activeCategoryIndex + 1);
                        setError(null);
                        setSuccess(null);
                      } else {
                        setError('このカテゴリーのすべての質問に回答してください。');
                      }
                    }}
                    disabled={!allAnswered}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      allAnswered
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    次へ
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving || !allAnswered}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
                      saving || !allAnswered
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600'
                    }`}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        保存する
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

