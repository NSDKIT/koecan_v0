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
        text: '外部への発信 vs 内部の充実',
        leftLabel: '部活やサークルをはじめとする、交流イベントに積極的に参加している。',
        rightLabel: '同じチーム内での活動や改善を重視し、内部での結束や絆を大事にしている。'
      },
      {
        key: 'q2',
        text: '人と関わる仕事 vs 内向きな仕事',
        leftLabel: '将来は営業や広報のように、外部の人やお客様と関わる仕事に魅力を感じる。',
        rightLabel: '研究開発やデザインなど、じっくり取り組む仕事に魅力を感じる。'
      },
      {
        key: 'q3',
        text: '学園祭リーダー vs 部室管理者',
        leftLabel: '学園祭などの大規模イベントを企画・運営することにやりがいを感じる。',
        rightLabel: '部室やコミュニティの中で物事を整え、メンバーを支える役割にやりがいを感じる。'
      },
      {
        key: 'q4',
        text: '外での発信やネットワーキングと内側の改善',
        leftLabel: 'セミナーやネットワーキングイベントに参加して新しい人と出会うことがエネルギー源だ。',
        rightLabel: '新しい知識やスキルを自分のペースで磨くことの方がエネルギー源だ。'
      },
      {
        key: 'q5',
        text: 'あなたの強みのアピール方法',
        leftLabel: '成果をプレゼンテーションやSNSなど外部に積極的に発信するのが得意だ。',
        rightLabel: '静かに良い仕事を積み重ね、評価は社内や近しい人の中で知られる形が好ましい。'
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
        rightLabel: '物事を判断する際にはデータや実績を重視し、無謀な挑戦は避ける。'
      },
      {
        key: 'q3',
        text: '変化の多い環境 vs 一貫した環境',
        leftLabel: 'トレンドや技術の変化に敏感で、常に新しい刺激を求める。',
        rightLabel: '決まったリズムや慣れた環境で安定して成果を出すのが好きだ。'
      },
      {
        key: 'q4',
        text: '取り組みのスタイル',
        leftLabel: '未知のテーマを調べる時、新しい切り口や斬新な方法を試すことが好きだ。',
        rightLabel: 'まず基本を押さえてから、成功事例に沿って進める方が安心できる。'
      },
      {
        key: 'q5',
        text: 'リスクと安定性への姿勢',
        leftLabel: 'リスクを取ってでも新しい市場や技術に挑戦したいと思う。',
        rightLabel: '安定した実績が確認できるまで挑戦は待ち、まずは現状を守る。'
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
        rightLabel: '良い意味で仲間と競い合うことで自分の力を伸ばせると考える。'
      },
      {
        key: 'q4',
        text: '成果の評価と成長の評価',
        leftLabel: '成長したスキルや助けた人の数など、質的な評価を重視する。',
        rightLabel: '成し遂げた目標や数字での成果を重視する。'
      },
      {
        key: 'q5',
        text: 'チームワーク vs 個人スコア',
        leftLabel: 'グループでの成功や体験に達成感を覚える。',
        rightLabel: '自分の実績や高いスコアに達成感を覚える。'
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
        text: '自由な進め方 vs 明確な手順',
        leftLabel: '課題に取り組むとき、自分なりの工夫で進める自由度がある方が好きだ。',
        rightLabel: '決められた手順やルールに従って進める方が安心して取り組める。'
      },
      {
        key: 'q2',
        text: '役割の柔軟さ vs 役割の明確さ',
        leftLabel: '状況に応じて役割や担当が変わることに抵抗がなく、多様な仕事を楽しめる。',
        rightLabel: '自分の役割や担当がはっきり決まっている方が集中しやすい。'
      },
      {
        key: 'q3',
        text: '変化への対応 vs 計画の遵守',
        leftLabel: '計画変更やイレギュラーが起きても臨機応変に対処するのが得意だ。',
        rightLabel: '一度決めた計画を守り、予定通りに進めることで力を発揮できる。'
      },
      {
        key: 'q4',
        text: 'スケジュールの自由度',
        leftLabel: '締め切りと大まかな目標があれば、自分の裁量でスケジュールを決めたい。',
        rightLabel: '時間割や工程表が細かく決まっている方が集中しやすい。'
      },
      {
        key: 'q5',
        text: 'ルールの範囲',
        leftLabel: 'ガイドラインが必要最低限で、柔軟に工夫できる環境が好きだ。',
        rightLabel: 'ガイドラインや規定がしっかりあり、それに従う方が安心できる。'
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
        data?.forEach((item) => {
          if (!loadedAnswers[item.category]) {
            loadedAnswers[item.category] = {};
          }
          loadedAnswers[item.category][item.question_key] = item.answer;
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
          const answer = answers[category.id]?.[question.key];
          if (answer && answer >= 1 && answer <= 5) {
            responses.push({
              user_id: user.id,
              category: category.id,
              question_key: question.key,
              answer: answer
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
              <h2 className="text-2xl font-bold text-gray-800">パーソナリティ診断</h2>
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

