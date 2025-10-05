'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { PointExchangeRequest, User } from '@/types';
import { Loader2, CheckCircle, XCircle, Gift, AlertCircle, Send } from 'lucide-react';

interface ExchangeRequestWithMonitor extends PointExchangeRequest {
  monitor: User | null; // ★★★ 修正: モニターが削除されている可能性を考慮し、nullを許容 ★★★
}

export function PointExchangeManager() {
  const [requests, setRequests] = useState<ExchangeRequestWithMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('point_exchange_requests')
        .select(`
          *,
          monitor:users (id, name, email)
          -- 新しく追加したカラムを明示的に含める
          , contact_type, exchange_contact, reward_detail
        `)
        .eq('status', 'pending') // ステータスがpendingのもののみ取得
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRequests(data as ExchangeRequestWithMonitor[] || []); // キャストを明示
    } catch (err) {
      console.error('Error fetching exchange requests:', err);
      setError('リクエストの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    request: PointExchangeRequest, 
    newStatus: 'completed' | 'rejected', 
    rewardDetail: string
  ) => {
    setIsSubmitting(true);
    setError(null);

    // 却下の場合は rewardDetail は不要だが、完了時は必須
    if (newStatus === 'completed' && !rewardDetail.trim()) {
        setError('承認するには、ギフト券URLまたはコードの入力が必須です。');
        setIsSubmitting(false);
        return;
    }
    
    // DB更新ペイロード
    const payload: any = {
        status: newStatus,
        processed_at: new Date().toISOString(),
        reward_detail: rewardDetail.trim() || null, 
    };

    try {
      // ★★★ INSERTとは異なり、UPDATEには.select()は不要（PostgRESTの標準） ★★★
      const { error } = await supabase
        .from('point_exchange_requests')
        .update(payload)
        .eq('id', request.id);

      if (error) throw error;

      alert(`リクエストID ${request.id.substring(0, 8)} を ${newStatus === 'completed' ? '承認' : '却下'} しました。通知が送信されます。`);
      fetchRequests(); // リストを更新

    } catch (err) {
      console.error('Error updating status:', err);
      setError('ステータス更新に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        <p className="ml-4 text-gray-600">ポイント交換リクエストを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-yellow-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Gift className="w-6 h-6 mr-2 text-yellow-600" />
        ポイント交換リクエスト（保留中: {requests.length}件）
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">エラー！</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">現在、承認待ちのリクエストはありません。</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => (
            <RequestCard 
                key={req.id} 
                request={req} 
                onUpdate={handleUpdateStatus} 
                isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// リクエストカードのサブコンポーネント
interface RequestCardProps {
    request: ExchangeRequestWithMonitor;
    onUpdate: (request: PointExchangeRequest, newStatus: 'completed' | 'rejected', rewardDetail: string) => Promise<void>;
    isSubmitting: boolean;
}

function RequestCard({ request, onUpdate, isSubmitting }: RequestCardProps) {
    const [rewardDetail, setRewardDetail] = useState('');
    
    // ★★★ 修正箇所 1: request.monitor が null の場合を考慮した安全なアクセス ★★★
    const monitorName = request.monitor?.name || request.monitor?.email || '不明なモニター';
    
    // 連絡先表示ロジック
    let contactDisplay = '';
    if (request.contact_type === 'line_push') {
        contactDisplay = 'LINEプッシュ通知';
    } else {
        contactDisplay = `メール/その他 (${request.contact_info || '未入力'})`;
    }

    return (
        <div className="border border-yellow-300 rounded-xl p-5 bg-white shadow-md">
            <div className="flex justify-between items-start mb-3 border-b pb-3">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">
                        {request.points_amount}pt → {request.exchange_type}
                    </h3>
                    <p className="text-sm text-gray-500">
                        申請日時: {new Date(request.created_at).toLocaleString('ja-JP')}
                    </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    保留中
                </span>
            </div>
            
            <div className="mb-4 space-y-1 text-sm">
                {/* ★★★ 修正箇所 2: email のアクセスも安全にする ★★★ */}
                <p><strong>申請者:</strong> {monitorName} ({request.monitor?.email || 'N/A'})</p>
                <p className="flex items-center">
                    <strong>通知先:</strong> 
                    <span className={`ml-2 px-2 rounded-full text-xs font-semibold ${
                        request.contact_type === 'line_push' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                        {contactDisplay}
                    </span>
                </p>
                <p><strong>備考:</strong> {request.notes || 'なし'}</p>
            </div>

            {/* ギフト券URL/コード入力フィールド */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    ギフト券URL/コード (承認時に**必須**)
                </label>
                <textarea
                    rows={2}
                    value={rewardDetail}
                    onChange={(e) => setRewardDetail(e.target.value)}
                    placeholder="PayPay送付完了の旨、Amazonギフトコード、URLなどを入力してください"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    disabled={isSubmitting}
                />
            </div>

            {/* アクションボタン */}
            <div className="flex space-x-3 justify-end">
                <button
                    onClick={() => onUpdate(request, 'rejected', '')}
                    disabled={isSubmitting}
                    className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                    <XCircle className="w-5 h-5 mr-1" /> 却下
                </button>
                <button
                    onClick={() => onUpdate(request, 'completed', rewardDetail)}
                    disabled={isSubmitting || !rewardDetail.trim()}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 mr-1 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-1" />}
                    承認 & 送信
                </button>
            </div>
        </div>
    );
}
