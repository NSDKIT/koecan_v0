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
    title: '市場への関わり方（外向型E vs 内向型I）',
    description: '外部への発信と内部の充実、どちらを重視するか',
    questions: [
      {
        key: 'q1',
        text: '外部との関わり',
        leftLabel: '他の学校の部活やサークルなどの、外部との交流を大事にしている。',
        rightLabel: 'チーム内での活動や改善を重視し、内部での結束や絆を大事にしている。'
      },
      {
        key: 'q2',
        text: '人との関わり',
        leftLabel: '将来は営業や広報のように、外部の人やお客様と関わる仕事に魅力を感じる。',
        rightLabel: '研究開発やデザインなど、じっくり取り組む仕事に魅力を感じる。'
      },
      {
        key: 'q3',
        text: 'イベント等での立ち位置',
        leftLabel: '学園祭などの大規模イベントを企画・運営することにやりがいを感じる。',
        rightLabel: '部室やコミュニティの中で物事を整え、メンバーを支える役割にやりがいを感じる。'
      },
      {
        key: 'q4',
        text: '外での発信やネットワーキングと内側の改善',
        leftLabel: '新しい人と出会うことがエネルギー源だ。',
        rightLabel: '新しい知識やスキルを自分のペースで磨くことの方がエネルギー源だ。'
      },
      {
        key: 'q5',
        text: '休日のリフレッシュ方法',
        leftLabel: '友人と遊ぶ、イベントに行くなど人との交流でリフレッシュする。',
        rightLabel: '一人で映画・読書・散歩など、静かな時間でエネルギーを回復する。'
      },
      {
        key: 'q6',
        text: '情報収集のスタイル',
        leftLabel: 'まず周りの人に相談し、対話を通して情報を集めてから動き始める。',
        rightLabel: 'まず自分で調べ、考えを整理してから人に相談する。'
      },
      {
        key: 'q7',
        text: 'チームでのアイデア出し',
        leftLabel: '人と話す中でアイデアがどんどん湧き、議論を通して整理していく。',
        rightLabel: 'まず自分でじっくり考えてから、まとまった案をチームに共有する。'
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
        text: '挑戦と変化 vs 安定と改善',
        leftLabel: '新しいことにチャレンジするのが好きで、未経験の活動でも飛び込むことが多い。',
        rightLabel: '一つのことを長く深く取り組むのが好きで、着実に改善を重ねる方が得意だ。'
      },
      {
        key: 'q2',
        text: 'アイデア先行 vs データ重視',
        leftLabel: '「面白そうだからやってみよう」と直感で動くことが多く、失敗も学びと捉える。',
        rightLabel: '物事を判断する際にはデータや実績を重視し、地に足のついた判断を大切にする。'
      },
      {
        key: 'q3',
        text: '変化の多い環境 vs 一貫した環境',
        leftLabel: 'トレンドや技術の変化に敏感で、常に新しい刺激を求める。',
        rightLabel: '慣れた環境で安定して成果を出すのが好きだ。'
      },
      {
        key: 'q4',
        text: '取り組みのスタイル',
        leftLabel: '物事に取り組む際に、新しい切り口や斬新な方法を試すことが好きだ。',
        rightLabel: 'まず基本を押さえてから、成功事例に沿って進める方が安心できる。'
      },
      {
        key: 'q5',
        text: 'リスクと安定性への姿勢',
        leftLabel: 'リスクを取ってでも新しい市場や技術に挑戦したいと思う。',
        rightLabel: '実績ができるまでは挑戦せず、まずは現状を守る。'
      },
      {
        key: 'q6',
        text: '学びのモチベーション',
        leftLabel: '好奇心のまま、学びの幅を広げることが多い。',
        rightLabel: '必要な知識を確実に押さえ、身についたものを着実に活かすことに満足感がある。'
      },
      {
        key: 'q7',
        text: 'チームへの貢献スタイル',
        leftLabel: '新しい企画を提案したり、変化のきっかけを作る役割にやりがいを感じる。',
        rightLabel: '既存のプロセスを整えたり、安定した運用を支えるポジションが得意。'
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
        text: '仲間と成長 vs 目標達成',
        leftLabel: 'チームメイトと助け合いながら共に成長することにやりがいを感じる。',
        rightLabel: '自分自身が成果を上げ、具体的な目標を達成することにやりがいを感じる。'
      },
      {
        key: 'q2',
        text: '感謝と支援 vs 評価と数値',
        leftLabel: '先輩や友人からの「ありがとう」「頑張ったね」と言われることで評価されていると感じる。',
        rightLabel: 'テストの点数や競技の順位など、明確な結果が評価として大事だと思う。'
      },
      {
        key: 'q3',
        text: '助け合い vs 競争意識',
        leftLabel: '周りのメンバーのサポートや協力があってこそ成功すると考える。',
        rightLabel: '仲間と切磋琢磨することで自分の力を伸ばせると考える。'
      },
      {
        key: 'q4',
        text: 'チームワーク vs 個人スコア',
        leftLabel: 'グループでの成功に達成感を覚える。',
        rightLabel: '自分の実績や高いスコアに達成感を覚える。'
      },
      {
        key: 'q5',
        text: '活動の原動力',
        leftLabel: '仲間が困っていると放っておけず、チーム全体が良くなることがモチベーションだ。',
        rightLabel: '自分の成果が評価される場面で力を発揮し、明確なゴールがあるとやる気が高まる。'
      },
      {
        key: 'q6',
        text: 'チームでの役割の好み',
        leftLabel: '雰囲気づくりやメンバーのサポート役として、チームが動きやすくなる環境づくりが得意。',
        rightLabel: '目標に直結するポジションで、自分の成果がチームの勝敗に影響する役割を担いたい。'
      },
      {
        key: 'q7',
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
        text: '物事の進め方',
        leftLabel: '課題に取り組むとき、自分なりのやり方で進める方が好きだ。',
        rightLabel: '決められた手順やルールに従って進める方が安心して取り組める。'
      },
      {
        key: 'q2',
        text: '自分の役割',
        leftLabel: '固定された役割にしばられず、状況に応じて動く方がしっくりくる。',
        rightLabel: '自分の役割や担当がはっきり決まっている方が集中しやすい。'
      },
      {
        key: 'q3',
        text: '変化への対応',
        leftLabel: 'イレギュラーが起きても臨機応変に対応するのが得意だ。',
        rightLabel: '一度決めた計画を守り、予定通りに進めることで力を発揮できる。'
      },
      {
        key: 'q4',
        text: 'スケジュールの組み立て方',
        leftLabel: '自分で進め方を調整できる方が動きやすい。',
        rightLabel: '明確なスケジュールがある方が動きやすい。'
      },
      {
        key: 'q5',
        text: 'ルールの範囲',
        leftLabel: '必要最低限のガイドラインだけあれば十分。状況に応じて変えたい。',
        rightLabel: 'はっきりしたルールや基準があった方が迷わず動ける。'
      },
      {
        key: 'q6',
        text: '問題解決のアプローチ',
        leftLabel: 'とりあえずやってみながら形にしていく"手を動かして考えるタイプ"。',
        rightLabel: '情報整理や計画を整えてから動く"段取りを大事にするタイプ"。'
      },
      {
        key: 'q7',
        text: '仕事の優先順位づけ',
        leftLabel: '状況の変化に合わせて優先度を入れ替えながら進めたい。',
        rightLabel: '最初に決めた優先順位を崩さず、順番通りに進めたい。'
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

