// koecan_v0-main/components/AdminJobInfoManager.tsx

'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { Advertisement } from '@/types';
import { 
  Plus, Edit, Trash2, Loader2, Save, X, Eye, 
  Building, MapPin, Calendar, Users, DollarSign,
  Briefcase, Award, Youtube, BookOpen, Clock, CheckCircle
} from 'lucide-react';

interface AdminJobInfoManagerProps {
  onDataChange: () => void; // 親コンポーネント（AdminDashboard）にデータ変更を通知するコールバック
}

// タブの型定義
type ModalTab = 'basicInfo' | 'otherInfo';

// 必須フィールドのリストを定義
const REQUIRED_FIELDS = ['company_name', 'title', 'description'];

export function AdminJobInfoManager({ onDataChange }: AdminJobInfoManagerProps) {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('basicInfo'); // 新しいタブの状態

  // フォームデータ用ステート (新規作成・編集共通)
  // 全ての任意フィールドを null で初期化するように修正
  const [formData, setFormData] = useState<Partial<Advertisement>>({
    title: '',
    description: '',
    image_url: null, 
    link_url: null, 
    is_active: true,
    display_order: 1,
    priority: 100,
    company_name: '',
    location_info: null, 
    establishment_year: null, 
    employee_count: null, 
    employee_gender_ratio: null, 
    employee_age_composition: null, 
    recommended_points: [], 
    salary_info: null, 
    paid_leave_rate: null, 
    long_holidays: null, 
    training_support: null, 
    busy_season_intensity: null, 
    youtube_short_url: null, 
    recruitment_roles: null, 
    application_qualifications: null, 
    selection_flow: null, 
  });

  // ★★★ 修正: JSX外にデバッグログを移動 (フォームの状態監視用) ★★★
  useEffect(() => {
    if (isModalOpen) {
      console.log('DEBUG: Button Disabled Check (isSubmitting, company_name, title, description)', {
          isSubmitting: isSubmitting,
          company_name: formData.company_name,
          title: formData.title,
          description: formData.description,
          disabled: isSubmitting || !formData.company_name || !formData.title || !formData.description
      });
    }
  }, [formData, isSubmitting, isModalOpen]);
  // ★★★ 修正箇所ここまで ★★★

  useEffect(() => {
    console.log('AdminJobInfoManager: useEffect triggered, calling fetchAdvertisements.');
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    console.log('fetchAdvertisements: START. Setting loading to true.');
    setLoading(true);
    setError(null);
    try {
      console.log('fetchAdvertisements: Attempting to select from "advertisements" table.');
      const { data, error } = await supabase
        .from('advertisements')
        .select('*') // 全てのカラムを取得
        .order('created_at', { ascending: false });

      if (error) {
        console.error('fetchAdvertisements: ERROR fetching advertisements:', error.message, error.details, error.hint);
        throw error;
      }
      setAdvertisements(data || []);
      console.log('fetchAdvertisements: Successfully fetched advertisements:', data);
      onDataChange(); // 親コンポーネントにデータ変更を通知
    } catch (err) {
      console.error('fetchAdvertisements: CRITICAL ERROR during advertisements fetch:', err);
      setError('就職情報の取得に失敗しました。');
    } finally {
      console.log('fetchAdvertisements: FINALLY block. Setting loading to false.');
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    console.log('openCreateModal: Called.');
    setEditingAd(null); // 新規作成時はeditingAdをnullに
    setFormData({ // フォームを初期化 (nullで統一)
      title: '',
      description: '',
      image_url: null,
      link_url: null,
      is_active: true,
      display_order: 1,
      priority: 100,
      company_name: '',
      location_info: null,
      establishment_year: null,
      employee_count: null,
      employee_gender_ratio: null,
      employee_age_composition: null,
      recommended_points: [],
      salary_info: null,
      paid_leave_rate: null,
      long_holidays: null,
      training_support: null,
      busy_season_intensity: null,
      youtube_short_url: null,
      recruitment_roles: null,
      application_qualifications: null,
      selection_flow: null,
    });
    setActiveModalTab('basicInfo'); // モーダルを開く際に基本情報タブをアクティブにする
    setIsModalOpen(true);
  };

  const openEditModal = (ad: Advertisement) => {
    console.log('openEditModal: Called for AD ID:', ad.id);
    setEditingAd(ad);
    setFormData({
      ...ad,
      // nullish coalescing を使用して、null または undefined の場合に null に統一
      establishment_year: ad.establishment_year ?? null, 
      employee_count: ad.employee_count ?? null,
      image_url: ad.image_url ?? null,
      link_url: ad.link_url ?? null,
      company_name: ad.company_name ?? '',
      title: ad.title ?? '',
      description: ad.description ?? '',
      location_info: ad.location_info ?? null,
      employee_gender_ratio: ad.employee_gender_ratio ?? null,
      employee_age_composition: ad.employee_age_composition ?? null,
      salary_info: ad.salary_info ?? null,
      paid_leave_rate: ad.paid_leave_rate ?? null,
      long_holidays: ad.long_holidays ?? null,
      training_support: ad.training_support ?? null,
      busy_season_intensity: ad.busy_season_intensity ?? null,
      youtube_short_url: ad.youtube_short_url ?? null,
      recruitment_roles: ad.recruitment_roles ?? null,
      application_qualifications: ad.application_qualifications ?? null,
      selection_flow: ad.selection_flow ?? null,
      // 配列型のフィールドは常に配列であることを保証
      recommended_points: ad.recommended_points ?? [],
    });
    setActiveModalTab('basicInfo'); // モーダルを開く際に基本情報タブをアクティブにする
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log('closeModal: Called.');
    setIsModalOpen(false);
    setEditingAd(null);
    setFormData({}); // フォームデータをリセット
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target; 
    
    // 文字列の入力値に対して、空白を除去した上で、空かどうかを判定する準備
    const trimmedValue = value.trim();
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'recommended_points') {
      // カンマ区切り文字列を配列に変換し、空要素を除去
      setFormData(prev => ({ ...prev, [name]: value.split(',').map(s => s.trim()).filter(s => s !== '') }));
    } else if (type === 'number') {
      // 数値型：空文字列の場合は null を設定
      const numericValue = value === '' ? null : parseInt(value);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      // 全ての残りの文字列フィールド（input type="text", textarea, input type="url"など）の処理
      
      let finalValue: string | null = value; // 必須フィールドの場合は value を維持

      // 必須フィールドでなく、かつ、トリミングされた値が空の場合、null を設定
      if (!REQUIRED_FIELDS.includes(name) && trimmedValue === '') {
          finalValue = null;
      } else if (REQUIRED_FIELDS.includes(name) && trimmedValue === '') {
          // 必須フィールドの場合は、クライアントバリデーションのために '' を維持
          finalValue = '';
      }
      // その他 (必須フィールド & !empty) の場合は value をそのまま維持

      setFormData(prev => ({ 
          ...prev, 
          [name]: finalValue 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('--- HANDLE SUBMIT EXECUTED ---'); // ★★★ クリックイベント確認用ログ ★★★
    console.log('handleSubmit: START. Setting isSubmitting to true.'); 
    setIsSubmitting(true);
    setError(null);

    // 必須フィールドの簡易バリデーション (クライアントサイド)
    if (!formData.company_name || !formData.title || !formData.description) {
        setError('会社名、タイトル、説明は必須です。');
        setIsSubmitting(false);
        // ★★★ デバッグログが適用されている部分 ★★★
        console.error('ERROR: Client-side validation failed. Missing required field.', { 
            company_name: formData.company_name, 
            title: formData.title, 
            description: formData.description 
        });
        console.log('handleSubmit: END early due to client-side validation error.');
        return;
    }

    // FormDataから不要なメタデータを除外（RLSエラー回避策）
    const { id, created_at, updated_at, ...dataToUpdate } = formData;
    
    // 数値型の NaN を null に置き換える安全策（念のため）
    Object.keys(dataToUpdate).forEach(key => {
        const value = (dataToUpdate as any)[key];
        if (typeof value === 'number' && isNaN(value)) {
            (dataToUpdate as any)[key] = null;
        }
    });
    
    console.log('DEBUG: Data payload prepared. Proceeding to DB update.'); // ★★★ 追加されたデバッグログ ★★★

    try {
      if (editingAd) {
        console.log('--- DEBUG START (UPDATE) ---');
        console.log('Updating ID:', editingAd.id);
        console.log('Data to send (dataToUpdate):', dataToUpdate);
        console.log('--- DEBUG END ---');
        
        // 更新
        const { error: updateError, status, statusText } = await supabase
          .from('advertisements')
          .update(dataToUpdate) // 不要なメタデータを含まないオブジェクトを送信
          .eq('id', editingAd.id);

        if (updateError) {
             console.error('Supabase Update Error Details:', updateError);
             console.error('Status:', status, 'Status Text:', statusText);
             throw updateError;
        }
      } else {
        console.log('--- DEBUG START (INSERT) ---');
        console.log('Data to send (dataToUpdate):', dataToUpdate);
        console.log('--- DEBUG END ---');

        // 新規作成
        const { error: insertError, status, statusText } = await supabase
          .from('advertisements')
          .insert(dataToUpdate as any);
          
        if (insertError) {
             console.error('Supabase Insert Error Details:', insertError);
             console.error('Status:', status, 'Status Text:', statusText);
             throw insertError;
        }
      }
      
      console.log('handleSubmit: Advertisement saved successfully. Refetching list.');
      await fetchAdvertisements(); // リストを再取得
      closeModal();
    } catch (err) {
      console.error('handleSubmit: CRITICAL ERROR saving advertisement:', err);
      // Supabase のエラーオブジェクトに status/statusText があれば表示
      const errorMessage = (err as any).message || String(err);
      setError(`保存に失敗しました: ${errorMessage}`);
    } finally {
      console.log('handleSubmit: FINALLY block. Setting isSubmitting to false.');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    console.log('handleDelete: Called for AD ID:', id);
    if (!confirm('この就職情報を削除してもよろしいですか？')) {
        console.log('handleDelete: Deletion cancelled by user.');
        return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('handleDelete: Attempting to delete advertisement with ID:', id);
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log('handleDelete: Advertisement deleted successfully. Refetching list.');
      await fetchAdvertisements(); // リストを再取得
    } catch (err) {
      console.error('handleDelete: ERROR deleting advertisement:', err);
      setError('削除に失敗しました。');
    } finally {
      console.log('handleDelete: FINALLY block. Setting loading to false.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="ml-4 text-gray-600">就職情報を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">就職情報管理</h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> 新規掲載
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">エラー！</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {advertisements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">現在、掲載されている就職情報はありません。</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  会社名 / タイトル
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  所在地
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  掲載状況
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {advertisements.map((ad) => (
                <tr key={ad.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ad.company_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{ad.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ad.location_info || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ad.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {ad.is_active ? '公開中' : '非公開'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(ad)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="編集"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="text-red-600 hover:text-red-900"
                      title="削除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 就職情報 登録/編集 モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-stretch justify-center z-50">
          {/* ★★★ 修正: w-full h-full に戻し、overflow-y-auto で全体をスクロール可能に ★★★ */}
          <div className="bg-white w-full h-full flex flex-col overflow-y-auto">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
              <h3 className="text-2xl font-bold text-gray-800">{editingAd ? '就職情報を編集' : '新規就職情報を掲載'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* タブナビゲーション */}
            <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
              <button
                onClick={() => setActiveModalTab('basicInfo')}
                className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                  activeModalTab === 'basicInfo'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                基本情報
              </button>
              <button
                onClick={() => setActiveModalTab('otherInfo')}
                className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                  activeModalTab === 'otherInfo'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                その他の情報
              </button>
            </div>
            
            {/* フォーム内容（スクロール領域） */}
            {/* ★★★ 修正: flex-grow のみ。モーダル全体がスクロールするため、個別のスクロールは不要 ★★★ */}
            <form onSubmit={handleSubmit} className="flex-grow"> 
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-6 mt-6" role="alert">
                  <strong className="font-bold">エラー:</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              )}

              <div className="p-6 space-y-6"> {/* 各セクションのパディングはここに集約 */}
                {/* 基本情報タブのコンテンツ */}
                {activeModalTab === 'basicInfo' && (
                  <>
                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">基本情報</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">会社名 <span className="text-red-500">*</span></label>
                          <input type="text" name="company_name" value={formData.company_name || ''} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">タイトル <span className="text-red-500">*</span></label>
                          <input type="text" name="title" value={formData.title || ''} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">説明 <span className="text-red-500">*</span></label>
                          <textarea name="description" value={formData.description || ''} onChange={handleInputChange} required rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">所在地（本社／支社）</label>
                          <input type="text" name="location_info" value={formData.location_info || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">設立年</label>
                          <input type="number" name="establishment_year" value={formData.establishment_year ?? ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">従業員数</label>
                          <input type="number" name="employee_count" value={formData.employee_count ?? ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">男女比</label>
                          <input type="text" name="employee_gender_ratio" value={formData.employee_gender_ratio || ''} onChange={handleInputChange} placeholder="例: 男性6割、女性4割" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">年齢構成比</label>
                          <input type="text" name="employee_age_composition" value={formData.employee_age_composition || ''} onChange={handleInputChange} placeholder="例: 20代30%、30代40%" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">画像URL</label>
                          <input type="text" name="image_url" value={formData.image_url || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">企業の詳細リンクURL</label>
                          <input type="url" name="link_url" value={formData.link_url || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="flex items-center md:col-span-2">
                          <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active ?? true} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">公開する</label>
                        </div>
                      </div>
                    </section>
                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">おすすめポイント (カンマ区切り)</h4>
                      <div>
                        <textarea name="recommended_points" value={(formData.recommended_points || []).join(', ')} onChange={handleInputChange} rows={2} placeholder="例: フレックスタイム制, 充実した研修制度, 若手にも裁量" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                      </div>
                    </section>
                  </>
                )}

                {/* その他の情報タブのコンテンツ */}
                {activeModalTab === 'otherInfo' && (
                  <>
                    {/* 仕事のリアル */}
                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">仕事のリアル</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">給与・昇給・賞与（モデル年収例など）</label>
                          <input type="text" name="salary_info" value={formData.salary_info || ''} onChange={handleInputChange} placeholder="例: 25歳年収400万円" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">有給取得率</label>
                          <input type="text" name="paid_leave_rate" value={formData.paid_leave_rate || ''} onChange={handleInputChange} placeholder="例: 80%" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">長期休暇</label>
                          <input type="text" name="long_holidays" value={formData.long_holidays || ''} onChange={handleInputChange} placeholder="例: 夏季休暇5日、年末年始休暇7日" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">研修・成長支援</label>
                          <input type="text" name="training_support" value={formData.training_support || ''} onChange={handleInputChange} placeholder="例: 入社時研修、資格取得支援" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">繁忙期の忙しさ</label>
                          <textarea name="busy_season_intensity" value={formData.busy_season_intensity || ''} onChange={handleInputChange} rows={2} placeholder="例: 四半期末は残業が多いが、それ以外は定時退社が基本" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                      </div>
                    </section>

                    {/* 会社の雰囲気・文化 */}
                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">会社の雰囲気・文化</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">YouTubeショートURL</label>
                        <input type="url" name="youtube_short_url" value={formData.youtube_short_url || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                      </div>
                    </section>

                    {/* 応募・選考 */}
                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">応募・選考</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">募集職種と人数</label>
                          <textarea name="recruitment_roles" value={formData.recruitment_roles || ''} onChange={handleInputChange} rows={2} placeholder="例: 営業職 3名、開発職 2名" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">応募資格</label>
                          <textarea name="application_qualifications" value={formData.application_qualifications || ''} onChange={handleInputChange} rows={2} placeholder="例: 2026年3月卒業見込みの大学生・大学院生" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">選考フロー</label>
                          <textarea name="selection_flow" value={formData.selection_flow || ''} onChange={handleInputChange} rows={3} placeholder="例: 会社説明会 → 書類選考 → 一次面接 → 最終面接 → 内定" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </div>
            </form>
            
            {/* フッター（ボタン群）をモーダル内に固定 */}
            <div className="flex justify-end space-x-4 p-4 border-t border-gray-200 shrink-0 bg-white z-10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !formData.company_name || !formData.title || !formData.description}
                  onClick={() => console.log('Temporary onClick: Button Clicked')} // クリックイベント確認用ログ (handleSubmitの実行が確認できたら削除推奨)
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  {editingAd ? '更新' : '掲載'}
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
