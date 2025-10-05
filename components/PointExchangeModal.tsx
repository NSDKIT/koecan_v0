'use client'

import React, { useState, useEffect } from 'react';
import { X, Gift, Send, Loader2, Mail, MessageSquare } from 'lucide-react'; // アイコン追加
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth'; // useAuthをインポート

interface PointExchangeModalProps {
  currentPoints: number;
  onClose: () => void;
  onExchangeSuccess: () => void; // Callback to refresh points on success
}

// 連絡先情報の型を更新
type ContactType = 'email' | 'line_push';

export function PointExchangeModal({ currentPoints, onClose, onExchangeSuccess }: PointExchangeModalProps) {
  const { user } = useAuth();
  const [exchangeType, setExchangeType] = useState<'' | 'paypay' | 'amazon' | 'starbucks'>('');
  const [pointsAmount, setPointsAmount] = useState<number>(0);
  const [contactInfo, setContactInfo] = useState('');
  const [contactType, setContactType] = useState<ContactType>('email'); // 新しいステート
  const [isLineLinked, setIsLineLinked] = useState<boolean>(false); // LINE連携状態
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LINE連携状態をチェック
  useEffect(() => {
    const checkLineLink = async () => {
      if (!user) return;
      // user_line_links テーブルに user_id があるか確認
      const { data, error } = await supabase
        .from('user_line_links')
        .select('user_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      
      if (data) {
        setIsLineLinked(true);
        // LINE連携済みの場合は、デフォルトの通知方法をLINEにする (UX改善)
        setContactType('line_push');
      } else {
        setIsLineLinked(false);
        setContactType('email');
      }
    };

    checkLineLink();
  }, [user]);

  const availableExchangeOptions: {
    type: 'paypay' | 'amazon' | 'starbucks';
    name: string;
    minPoints: number;
    maxPoints: number;
  }[] = [
    { type: 'paypay', name: 'PayPayポイント', minPoints: 500, maxPoints: currentPoints },
    { type: 'amazon', name: 'Amazonギフトカード', minPoints: 1000, maxPoints: currentPoints },
    { type: 'starbucks', name: 'スターバックス eGift', minPoints: 300, maxPoints: currentPoints },
  ];

  const handleExchange = async () => {
    if (!user) {
      setError('ユーザー情報が取得できません。再度ログインしてください。');
      return;
    }

    if (!exchangeType || pointsAmount <= 0 || pointsAmount > currentPoints || (contactType === 'email' && contactInfo.trim() === '')) {
      setError('全ての必須項目を入力し、有効なポイント数を指定してください。');
      return;
    }

    const selectedOption = availableExchangeOptions.find(opt => opt.type === exchangeType);
    if (!selectedOption || pointsAmount < selectedOption.minPoints) {
      setError(`${selectedOption?.name}の交換には最低${selectedOption?.minPoints}ポイントが必要です。`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create point transaction (redeemed) - ★★★ .select()を削除 ★★★
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert([
          {
            monitor_id: user.id,
            points: -pointsAmount,
            transaction_type: 'redeemed',
            notes: `ポイント交換リクエスト: ${exchangeType} ${pointsAmount}pt`
          },
        ]); // .select() を削除

      if (transactionError) {
         console.error('Point Transaction Error:', transactionError);
         throw transactionError;
      }

      // 2. Create point exchange request - ★★★ .select()を削除 ★★★
      const { error: requestError } = await supabase
        .from('point_exchange_requests')
        .insert([
          {
            monitor_id: user.id,
            exchange_type: exchangeType,
            points_amount: pointsAmount,
            // 修正: 連絡先情報のフィールドを contact_type と exchange_contact に分ける
            contact_type: contactType, 
            exchange_contact: contactType === 'email' ? contactInfo : null, // LINEの場合はnull
            contact_info: contactType === 'email' ? contactInfo : 'LINE連携済み', // 互換性のため残す
            notes: notes.trim() === '' ? null : notes.trim(),
            status: 'pending',
          },
        ]); // .select() を削除

      if (requestError) {
          console.error('Exchange Request Error:', requestError);
          throw requestError;
      }

      alert('ポイント交換リクエストを送信しました！処理が完了するまでお待ちください。');
      onExchangeSuccess(); 
      onClose();
    } catch (err) {
      // Supabaseエラーオブジェクト全体をログに出力
      console.error('Error during point exchange:', err); 
      setError(err instanceof Error ? err.message : 'ポイント交換に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const selectedOption = availableExchangeOptions.find(opt => opt.type === exchangeType);

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
              <p className="text-gray-600">貯まったポイントをギフト券等に交換しましょう</p>
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

          <form onSubmit={(e) => { e.preventDefault(); handleExchange(); }} className="space-y-6">
            
            {/* 交換先の選択 (既存) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交換先を選択してください *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availableExchangeOptions.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setExchangeType(option.type)}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                      exchangeType === option.type
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Gift className="w-6 h-6 mb-2" />
                    <span className="font-semibold">{option.name}</span>
                    <span className="text-xs text-gray-500 mt-1">最低 {option.minPoints}pt</span>
                  </button>
                ))}
              </div>
            </div>

            {exchangeType && (
              <>
                {/* 報酬ポイント数の入力 (既存) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    交換ポイント数 *
                  </label>
                  <input
                    type="number"
                    value={pointsAmount === 0 ? '' : pointsAmount}
                    onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder={`1pt単位 (例: ${selectedOption?.minPoints})`}
                    min={selectedOption?.minPoints || 1}
                    max={selectedOption?.maxPoints || currentPoints}
                    required
                  />
                  {selectedOption && pointsAmount < selectedOption.minPoints && pointsAmount !== 0 && (
                    <p className="text-red-500 text-xs mt-1">最低交換ポイントは {selectedOption.minPoints}pt です。</p>
                  )}
                   {pointsAmount > currentPoints && (
                    <p className="text-red-500 text-xs mt-1">現在のポイント ({currentPoints}pt) を超えることはできません。</p>
                  )}
                </div>

                {/* ★★★ 新規: 通知連絡先の選択 ★★★ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    交換完了通知の受け取り方法 *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* メール選択 */}
                    <button
                      type="button"
                      onClick={() => setContactType('email')}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                        contactType === 'email'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Mail className="w-6 h-6 mb-2" />
                      <span className="font-semibold">メールで通知</span>
                    </button>

                    {/* LINE選択 */}
                    <button
                      type="button"
                      onClick={() => isLineLinked && setContactType('line_push')}
                      disabled={!isLineLinked}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                        contactType === 'line_push'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      <MessageSquare className="w-6 h-6 mb-2" />
                      <span className="font-semibold">LINEで通知</span>
                      {!isLineLinked && <span className="text-xs text-red-500 mt-1">未連携</span>}
                    </button>
                  </div>
                </div>

                {/* ★★★ 連絡先情報の入力 (メール選択時のみ表示) ★★★ */}
                {contactType === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      連絡先情報 (メールアドレスなど) *
                    </label>
                    <input
                      type="text"
                      name="contactInfo"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder={
                        exchangeType === 'paypay' ? 'PayPayに登録の電話番号またはメールアドレス' :
                        exchangeType === 'amazon' ? 'ギフトカード送付先のメールアドレス' :
                        'スターバックス eGift送付先のメールアドレス'
                      }
                      required={contactType === 'email'}
                    />
                  </div>
                )}
                
                {/* 備考 (既存) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    備考 (任意)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="何かご要望があればご記入ください"
                  />
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
                disabled={loading || !exchangeType || pointsAmount <= 0 || pointsAmount > currentPoints || (contactType === 'email' && contactInfo.trim() === '') || (selectedOption && pointsAmount < selectedOption.minPoints)}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                交換リクエストを送信
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
