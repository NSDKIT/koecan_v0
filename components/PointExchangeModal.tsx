'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { X, Gift, Send, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

interface PointExchangeModalProps {
  currentPoints: number;
  onClose: () => void;
  onExchangeSuccess: (newPoints: number) => void;
}

export function PointExchangeModal({ currentPoints, onClose, onExchangeSuccess }: PointExchangeModalProps) {
  const { user } = useAuth();
  const [exchangeType, setExchangeType] = useState<'' | 'erabepay' | 'erabegift'>('');
  const [pointsAmount, setPointsAmount] = useState<number>(0);
  const [isLineLinked, setIsLineLinked] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingLineLink, setCheckingLineLink] = useState(true);

  // LINE連携状態をチェックする関数
  const checkLineLink = useCallback(async () => {
    if (!user) {
      setIsLineLinked(false);
      setCheckingLineLink(false);
      return;
    }

    setCheckingLineLink(true);
    try {
      console.log('LINE連携状態をチェック中...', { userId: user.id });
      
      const { data, error } = await supabase
        .from('user_line_links')
        .select('line_user_id, user_id, created_at')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('LINE連携状態の取得エラー:', error);
        console.error('エラー詳細:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setIsLineLinked(false);
        setCheckingLineLink(false);
        return;
      }
      
      // line_user_idが存在し、かつNULLでない場合のみ連携済みと判定
      const linked = !!(data && data.line_user_id && data.line_user_id.trim() !== '');
      setIsLineLinked(linked);
      
      // デバッグログ
      console.log('LINE連携状態チェック結果:', {
        userId: user.id,
        hasData: !!data,
        lineUserId: data?.line_user_id,
        isLinked: linked,
        fullData: data
      });
    } catch (err) {
      console.error('LINE連携状態の確認エラー:', err);
      setIsLineLinked(false);
    } finally {
      setCheckingLineLink(false);
    }
  }, [user]);

  // モーダルが開かれた時とユーザーが変わった時だけチェック
  useEffect(() => {
    checkLineLink();
  }, [checkLineLink]);

  const availableExchangeOptions: {
    type: 'erabepay' | 'erabegift';
    name: string;
  }[] = [
    { type: 'erabepay', name: '選べるペイ' },
    { type: 'erabegift', name: '選べるギフト' },
  ];

  const handleExchange = async () => {
    if (!user) {
      setError('ユーザー情報が取得できません。再度ログインしてください。');
      return;
    }

    // バリデーション
    if (!exchangeType) {
      setError('交換先を選択してください。');
      return;
    }

    if (pointsAmount <= 0 || pointsAmount > currentPoints) {
      setError('有効なポイント数を指定してください。');
      return;
    }

    if (pointsAmount % 500 !== 0) {
      setError('ポイント数は500pt単位で入力してください。');
      return;
    }

    if (!isLineLinked) {
      setError('LINE連携が必要です。まずLINEアカウントと連携してください。');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. ポイントを減算
      console.log('ポイント減算開始:', { userId: user.id, pointsAmount });
      
      // まず現在のポイントを取得
      const { data: currentProfile, error: fetchProfileError } = await supabase
        .from('monitor_profiles')
        .select('points')
        .eq('user_id', user.id)
        .single();

      if (fetchProfileError) {
        console.error('現在のポイント取得エラー:', fetchProfileError);
        throw new Error('現在のポイントを取得できませんでした');
      }

      const currentPoints = currentProfile?.points || 0;
      const newPoints = currentPoints - pointsAmount;

      if (newPoints < 0) {
        throw new Error('ポイントが不足しています');
      }

      console.log('ポイント更新:', { currentPoints, pointsAmount, newPoints });

      // monitor_profilesのpointsを更新
      const { error: updatePointsError } = await supabase
        .from('monitor_profiles')
        .update({ points: newPoints })
        .eq('user_id', user.id);

      if (updatePointsError) {
        console.error('ポイント更新エラー:', updatePointsError);
        throw updatePointsError;
      }

      // point_transactionsに記録
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert([
          {
            monitor_id: user.id,
            points: -pointsAmount,
            transaction_type: 'redeemed',
            notes: `ポイント交換: ${exchangeType === 'erabepay' ? '選べるペイ' : '選べるギフト'} ${pointsAmount}pt`
          },
        ]);

      if (transactionError) {
        console.error('Point Transaction Error:', transactionError);
        // ポイント更新は成功しているので、トランザクション記録のエラーは警告のみ
        console.warn('ポイント取引の記録に失敗しましたが、ポイントは減算済みです');
      } else {
        console.log('ポイント減算完了:', { currentPoints, newPoints });
      }

      // 2. Giftee APIを呼び出してギフトを送信
      console.log('ギフト送信API呼び出し開始:', {
        exchangeType,
        pointsAmount,
        userId: user.id,
        userEmail: user.email,
      });
      
      const giftResponse = await fetch('/api/giftee/send-gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchangeType,
          pointsAmount,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      console.log('ギフト送信APIレスポンス:', {
        status: giftResponse.status,
        statusText: giftResponse.statusText,
        ok: giftResponse.ok,
      });

      if (!giftResponse.ok) {
        const errorData = await giftResponse.json();
        console.error('ギフト送信APIエラーレスポンス:', errorData);
        
        // エラーの詳細を全て表示
        let errorMessage = errorData.error || 'ギフト送信に失敗しました';
        if (errorData.details) {
          errorMessage += `\n\n詳細: ${typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details, null, 2)}`;
        }
        if (errorData.status) {
          errorMessage += `\nステータス: ${errorData.status} ${errorData.statusText || ''}`;
        }
        if (errorData.requestBody) {
          errorMessage += `\nリクエスト内容: ${JSON.stringify(errorData.requestBody, null, 2)}`;
        }
        if (errorData.fullResponse) {
          errorMessage += `\n\n完全なレスポンス: ${JSON.stringify(errorData.fullResponse, null, 2)}`;
        }
        
        throw new Error(errorMessage);
      }

      const giftData = await giftResponse.json();
      console.log('ギフト送信API成功レスポンス:', giftData);

      // ギフトカードURLを取得
      const giftCardUrl = giftData.giftCardUrl || giftData.giftData?.gift_card?.url;

      if (!giftCardUrl) {
        throw new Error('ギフトカードURLの取得に失敗しました');
      }

      // 3. 交換リクエストを記録（完了済みとして）
      const exchangeRequestData = {
        monitor_id: user.id,
        exchange_type: exchangeType,
        points_amount: pointsAmount,
        contact_type: 'line_push',
        exchange_contact: null,
        contact_info: 'LINE連携済み',
        status: 'completed',
        processed_at: new Date().toISOString(),
        reward_detail: giftCardUrl, // URLを直接保存
      };

      console.log('交換リクエスト記録開始:', exchangeRequestData);

      const { data: requestData, error: requestError } = await supabase
        .from('point_exchange_requests')
        .insert([exchangeRequestData])
        .select();

      if (requestError) {
        console.error('Exchange Request Error:', {
          message: requestError.message,
          code: requestError.code,
          details: requestError.details,
          hint: requestError.hint,
          requestData: exchangeRequestData,
        });
        
        // エラーをログに記録するが、処理は続行（ギフトは既に送信済み）
        // ただし、ユーザーには警告を表示
        console.warn('交換リクエストの記録に失敗しましたが、ギフトは送信済みです。エラー:', requestError.message);
      } else {
        console.log('交換リクエスト記録成功:', requestData);
      }

      // 4. LINE通知を送信（URLを含める）
      const exchangeName = exchangeType === 'erabepay' ? '選べるペイ' : '選べるギフト';
      const lineMessage = `🎁 ポイント交換が完了しました！\n\n交換内容: ${exchangeName}\nポイント数: ${pointsAmount}pt\n\nギフトカードURL:\n${giftCardUrl}\n\nこちらからギフトをお受け取りください。`;

      console.log('LINE通知送信開始:', {
        userId: user.id,
        messageLength: lineMessage.length,
        messagePreview: lineMessage.substring(0, 100) + '...',
      });

      const lineResponse = await fetch('/api/line/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          message: lineMessage,
        }),
      });

      console.log('LINE通知送信APIレスポンス:', {
        status: lineResponse.status,
        statusText: lineResponse.statusText,
        ok: lineResponse.ok,
      });

      if (!lineResponse.ok) {
        const errorData = await lineResponse.json();
        console.error('LINE通知送信エラー:', errorData);
        
        // エラーの詳細を表示
        let errorMessage = 'LINE通知の送信に失敗しましたが、ギフトは送信済みです。';
        if (errorData.error) {
          errorMessage += `\n\nエラー: ${errorData.error}`;
        }
        if (errorData.details) {
          errorMessage += `\n\n詳細: ${typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details, null, 2)}`;
        }
        if (errorData.status) {
          errorMessage += `\nステータス: ${errorData.status} ${errorData.statusText || ''}`;
        }
        
        alert(errorMessage);
      } else {
        const lineData = await lineResponse.json();
        console.log('LINE通知送信成功:', lineData);
      }

      alert(`🎉 ポイント交換が完了しました！\n${exchangeName} ${pointsAmount}pt分のギフトをLINEでお送りしました。`);
      // リアルタイムでポイントを更新
      onExchangeSuccess(newPoints); 
      onClose();
    } catch (err) {
      console.error('Error during point exchange:', err); 
      setError(err instanceof Error ? err.message : 'ポイント交換に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 500pt単位で選択可能なポイント数のリストを生成
  const availablePointAmounts = [];
  for (let i = 500; i <= currentPoints; i += 500) {
    availablePointAmounts.push(i);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full p-3 mr-4">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">ポイント交換</h2>
              <p className="text-gray-600">貯まったポイントをギフト券に交換しましょう</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-lg text-yellow-800 mb-2">現在の獲得ポイント</p>
            <p className="text-4xl font-bold text-yellow-700">{currentPoints}pt</p>
          </div>

          {checkingLineLink && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                🔄 LINE連携状態を確認中...
              </p>
            </div>
          )}
          
          {!checkingLineLink && !isLineLinked && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                ⚠️ ポイント交換にはLINE連携が必要です。まずLINEアカウントと連携してください。
              </p>
            </div>
          )}
          
          {!checkingLineLink && isLineLinked && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                ✅ LINE連携済みです。ポイント交換が可能です。
              </p>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleExchange(); }} className="space-y-6">
            {/* 交換先の選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交換先を選択してください *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableExchangeOptions.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setExchangeType(option.type)}
                    className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all duration-200 ${
                      exchangeType === option.type
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Gift className="w-8 h-8 mb-2" />
                    <span className="font-semibold text-lg">{option.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {exchangeType && (
              <>
                {/* 交換ポイント数の入力（500pt単位） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    交換ポイント数 * (500pt単位)
                  </label>
                  {availablePointAmounts.length === 0 ? (
                    <p className="text-red-500 text-sm">交換可能なポイントがありません（最低500pt必要です）</p>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {availablePointAmounts.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setPointsAmount(amount)}
                          className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                            pointsAmount === amount
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-700 font-semibold'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {amount}pt
                        </button>
                      ))}
                    </div>
                  )}
                  {pointsAmount > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      選択中: <span className="font-semibold">{pointsAmount}pt</span>
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-semibold text-blue-800">通知方法</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    交換完了後、LINEで自動的に通知をお送りします。
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-lg hover:from-yellow-700 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={loading || !exchangeType || pointsAmount <= 0 || !isLineLinked}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                交換する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
