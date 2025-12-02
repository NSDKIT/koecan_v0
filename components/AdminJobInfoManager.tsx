// koecan_v0-main/components/AdminJobInfoManager.tsx

'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { Advertisement } from '@/types';
import { 
  Plus, Edit, Trash2, Loader2, Save, X, 
  Building, MapPin, Calendar, Users, DollarSign,
  Briefcase, Award, Youtube, BookOpen, Clock, CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AdminJobInfoManagerProps {
  onDataChange: () => void; // 親コンポーネント（AdminDashboard）にデータ変更を通知するコールバック
}

// タブの型定義
type ModalTab = 'basicInfo' | 'otherInfo' | 'recruitment' | 'internship'; // 新しいタブを追加

// 必須フィールドのリストを定義
const REQUIRED_FIELDS = ['company_name']; 

export function AdminJobInfoManager({ onDataChange }: AdminJobInfoManagerProps) {
  const { user } = useAuth(); // ★★★ ユーザー情報（ID）を取得するために useAuth を使用 ★★★
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('basicInfo'); // 新しいタブの状態

  // フォームデータ用ステート (新規作成・編集共通)
  const initialFormData: Partial<Advertisement> = {
    // 基本情報
    company_name: '',
    official_website_url: null,
    representative_name: null,
    company_vision: null,
    headquarters_location: null,
    branch_office_location: null,
    industries: [], 
    establishment_year: null,
    employee_count: null,
    employee_gender_ratio: null,
    employee_avg_age: null,

    // イチオシ
    highlight_point_1: null,
    highlight_point_2: null,
    highlight_point_3: null,

    // 待遇
    starting_salary: null,
    avg_annual_income_20s: null,
    avg_annual_income_30s: null,
    three_year_retention_rate: null,
    promotion_model_case: null,

    // 働き方・福利厚生
    side_job_allowed: false,
    remote_work_available: false,
    housing_allowance_available: false,
    female_parental_leave_rate: null,
    male_parental_leave_rate: null,
    health_management_practices: [],
    internal_event_frequency: null,

    // その他
    must_tell_welfare: null,
    transfer_existence: false,
    transfer_frequency: null,

    // 募集・採用
    recruitment_roles_count: null,
    selection_flow_steps: [], 
    recruitment_contact: null,
    recruitment_department: null,
    recruitment_info_page_url: null,
    instagram_url: null,
    tiktok_url: null,
    other_sns_sites: null,

    // インターンシップ
    internship_scheduled: false,
    internship_schedule: null,
    internship_capacity: null,
    internship_target_students: [],
    internship_locations: [],
    internship_content_types: [],
    internship_paid_unpaid: null,
    transport_lodging_stipend: false,
    internship_application_url: null,

    // 旧・メタデータ（DBの NOT NULL 制約回避のため必要）
    is_active: true,
    display_order: 1,
    priority: 100,
    title: '', 
    description: '', 
  };

  const [formData, setFormData] = useState<Partial<Advertisement>>(initialFormData);

  // JSX外にデバッグログを移動 (フォームの状態監視用)
  useEffect(() => {
    if (isModalOpen) {
      console.log('DEBUG: Button Disabled Check (isSubmitting, company_name)', {
          isSubmitting: isSubmitting,
          company_name: formData.company_name,
          disabled: isSubmitting || !formData.company_name
      });
    }
  }, [formData, isSubmitting, isModalOpen]);

  useEffect(() => {
    console.log('AdminJobInfoManager: useEffect triggered, calling fetchAdvertisements.');
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    console.log('fetchAdvertisements: START. Setting loading to true.');
    setLoading(true);
    setError(null);
    try {
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
    setFormData(initialFormData); // フォームを初期化
    setActiveModalTab('basicInfo'); // モーダルを開く際に基本情報タブをアクティブにする
    setIsModalOpen(true);
  };

  const openEditModal = (ad: Advertisement) => {
    console.log('openEditModal: Called for AD ID:', ad.id);
    setEditingAd(ad);
    
    // ad を Partial<Advertisement> としてコピーし、型エラーを回避
    const adData: Partial<Advertisement> = { ...ad }; 
    
    // 数値型、ブーリアン型、配列型のフィールドを安全に初期化
    Object.keys(initialFormData).forEach(key => {
      const field = key as keyof Advertisement;
      
      if (typeof initialFormData[field] === 'number') {
        (adData as any)[field] = (adData[field] as number ?? null);
      } else if (typeof initialFormData[field] === 'boolean') {
        (adData as any)[field] = (adData[field] as boolean ?? false);
      } else if (Array.isArray(initialFormData[field])) {
        (adData as any)[field] = (adData[field] as string[] ?? []);
      } else if (REQUIRED_FIELDS.includes(key)) {
        (adData as any)[field] = (adData[field] as string ?? '');
      } else {
        (adData as any)[field] = (adData[field] as string ?? null);
      }
    });

    setFormData(adData);
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
    const trimmedValue = value.trim();

    // boolean 型のチェックボックス (単独)
    if (type === 'checkbox' && ['is_active', 'side_job_allowed', 'remote_work_available', 'housing_allowance_available', 'transfer_existence', 'internship_scheduled', 'transport_lodging_stipend'].includes(name)) {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
        return;
    }

    // 配列型のフィールド (複数選択のチェックボックス)
    const arrayFields = ['industries', 'health_management_practices', 'selection_flow_steps', 'internship_target_students', 'internship_locations', 'internship_content_types'];
    if (arrayFields.includes(name)) {
        const currentArray = (formData[name as keyof Advertisement] as string[] || []);
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ 
                ...prev, 
                [name]: checked
                    ? [...currentArray, value]
                    : currentArray.filter(item => item !== value)
            }));
        } else {
            // テキストエリアでカンマ区切り入力する場合のフォールバック
            setFormData(prev => ({ ...prev, [name]: value.split(',').map(s => s.trim()).filter(s => s !== '') }));
        }
        return;
    }

    if (type === 'number') {
        // 数値型：空文字列の場合は null を設定
        const numericValue = value === '' ? null : parseInt(value);
        setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else if (type === 'select-one' || name === 'internship_paid_unpaid') {
        // select タグまたは enum の処理
        setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
    } else {
        // 全ての残りの文字列フィールド (テキスト、URL、テキストエリアなど)
        let finalValue: string | null = value; 

        // 必須フィールドでなく、かつ、トリミングされた値が空の場合、null を設定
        if (!REQUIRED_FIELDS.includes(name) && trimmedValue === '') {
            finalValue = null;
        } else if (REQUIRED_FIELDS.includes(name) && trimmedValue === '') {
            // 必須フィールドの場合は、クライアントバリデーションのために '' を維持
            finalValue = '';
        }

        setFormData(prev => ({ 
            ...prev, 
            [name]: finalValue 
        }));
    }
  };


  const handleSubmit = async (e: React.FormEvent | MouseEvent) => {
    // e.preventDefault(); は onClick から呼ばれる場合は不要だが、onSubmitの互換性のため残す
    if (e && (e as any).preventDefault) {
        (e as any).preventDefault(); 
    }
    
    console.log('--- HANDLE SUBMIT EXECUTED ---'); // ★★★ クリックイベント確認用ログ ★★★
    console.log('handleSubmit: START. Setting isSubmitting to true.'); 
    setIsSubmitting(true);
    setError(null);

    // 必須フィールドの簡易バリデーション (クライアントサイド)
    if (!formData.company_name) {
        setError('会社名は必須です。');
        setIsSubmitting(false);
        console.error('ERROR: Client-side validation failed. Missing required field.', { 
            company_name: formData.company_name, 
        });
        console.log('handleSubmit: END early due to client-side validation error.');
        return;
    }

    // FormDataから不要なメタデータを除外（RLSエラー回避策）
    const { id, created_at, updated_at, ...dataToUpdate } = formData;
    
    // ★★★ 修正箇所 1: created_by にログインユーザーIDを設定する ★★★
    // created_by (または client_id) が NULL 不可の制約に対応
    if (user?.id) {
        (dataToUpdate as any).created_by = user.id; 
    }
        
    // title と description の NOT NULL 制約に対応するため、値を設定
    // DBの NOT NULL 制約に対応するため、company_name の値を title にコピー
    (dataToUpdate as any).title = formData.company_name; 
    // description も NOT NULL の可能性があるため、vision または company_name を使用
    (dataToUpdate as any).description = formData.company_vision || formData.company_name || '企業情報';
    
    // ★★★ 修正箇所 2: 配列型フィールドのチェックと NULL への変換 ★★★
    const arrayFields = ['industries', 'health_management_practices', 'selection_flow_steps', 'internship_target_students', 'internship_locations', 'internship_content_types'];
    
    // Object.keys(dataToUpdate) を直接使用して型安全性の問題を回避
    Object.keys(dataToUpdate).forEach(fieldKey => {
        if (arrayFields.includes(fieldKey)) {
            const arrayValue = (dataToUpdate as any)[fieldKey];
            if (Array.isArray(arrayValue) && arrayValue.length === 0) {
                // 空の配列を NULL に変換 (Postgresで空配列とNULLが区別されるため)
                (dataToUpdate as any)[fieldKey] = null; 
            }
        }
    });
    // ★★★ 修正箇所ここまで ★★★


    // 数値型の NaN を null に置き換える安全策（念のため）
    Object.keys(dataToUpdate).forEach(key => {
        const value = (dataToUpdate as any)[key];
        if (typeof value === 'number' && isNaN(value)) {
            (dataToUpdate as any)[key] = null;
        }
    });
    
    console.log('DEBUG: Data payload prepared. Proceeding to DB update.'); 
    console.log('Data to send (dataToUpdate):', dataToUpdate); // ★★★ 最終ペイロードの確認ログ ★★★


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
                    <div className="text-sm text-gray-500">{ad.title || ad.company_vision || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ad.headquarters_location || 'N/A'}
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
          {/* w-full h-full と overflow-y-auto でフルスクリーン表示のままスクロールを可能にする */}
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
                働き方・待遇
              </button>
              <button
                onClick={() => setActiveModalTab('recruitment')}
                className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                  activeModalTab === 'recruitment'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                募集・採用
              </button>
              <button
                onClick={() => setActiveModalTab('internship')}
                className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                  activeModalTab === 'internship'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                インターンシップ
              </button>
            </div>
            
            {/* フォーム内容（スクロール領域） */}
            <form onSubmit={handleSubmit} className="flex-grow"> 
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-6 mt-6" role="alert">
                  <strong className="font-bold">エラー:</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              )}

              <div className="p-6 space-y-6"> {/* 各セクションのパディングはここに集約 */}
                
                {/* ======================= タブ 1: 基本情報 ======================= */}
                {activeModalTab === 'basicInfo' && (
                  <>
                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">企業概要</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">会社名 <span className="text-red-500">*</span></label>
                          <textarea name="company_name" value={formData.company_name || ''} onChange={handleInputChange} required rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="改行や空白を保持できます"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">代表者名</label>
                          <textarea name="representative_name" value={formData.representative_name || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="改行や空白を保持できます"></textarea>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">公式ホームページのURL</label>
                          <input type="url" name="official_website_url" value={formData.official_website_url || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">貴社が目指す未来（100文字程度）</label>
                          <textarea name="company_vision" value={formData.company_vision || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                      </div>
                    </section>
                    
                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">基本情報</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">所在地（本社）</label>
                          <textarea name="headquarters_location" value={formData.headquarters_location || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="改行や空白を保持できます"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">所在地（支社）</label>
                          <textarea name="branch_office_location" value={formData.branch_office_location || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="改行や空白を保持できます"></textarea>
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
                          <label className="block text-sm font-medium text-gray-700">従業員の平均年齢（社員以外を含む）</label>
                          <input type="number" name="employee_avg_age" value={formData.employee_avg_age ?? ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">男女比（例：男性6割、女性4割）</label>
                          <textarea name="employee_gender_ratio" value={formData.employee_gender_ratio || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="改行や空白を保持できます"></textarea>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">業界（カンマ区切り、複数回答）</label>
                          <textarea name="industries" value={(formData.industries || []).join(', ')} onChange={handleInputChange} rows={2} placeholder="例: IT, 製造業, 小売" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">イチオシポイント</label>
                          <textarea name="highlight_point_1" value={formData.highlight_point_1 || ''} onChange={handleInputChange} rows={2} placeholder="イチオシポイント①（改行や空白を保持できます）" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm mb-2" />
                          <textarea name="highlight_point_2" value={formData.highlight_point_2 || ''} onChange={handleInputChange} rows={2} placeholder="イチオシポイント②（改行や空白を保持できます）" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm mb-2" />
                          <textarea name="highlight_point_3" value={formData.highlight_point_3 || ''} onChange={handleInputChange} rows={2} placeholder="イチオシポイント③（改行や空白を保持できます）" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="flex items-center md:col-span-2">
                          <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active ?? true} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">公開する</label>
                        </div>
                      </div>
                    </section>
                  </>
                )}

                {/* ======================= タブ 2: 働き方・待遇 ======================= */}
                {activeModalTab === 'otherInfo' && (
                  <>
                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">待遇・給与・定着率</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">初任給</label>
                          <textarea name="starting_salary" value={formData.starting_salary || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="改行や空白を保持できます"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">３年間の定着率</label>
                          <textarea name="three_year_retention_rate" value={formData.three_year_retention_rate || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="例: 90%（改行や空白を保持できます）"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">20代の平均年収</label>
                          <textarea name="avg_annual_income_20s" value={formData.avg_annual_income_20s || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="例: 400万円（改行や空白を保持できます）"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">30代の平均年収</label>
                          <textarea name="avg_annual_income_30s" value={formData.avg_annual_income_30s || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="例: 550万円（改行や空白を保持できます）"></textarea>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">昇進・キャリアパスのモデルケース</label>
                          <textarea name="promotion_model_case" value={formData.promotion_model_case || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">働き方・福利厚生</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <input type="checkbox" id="remote_work_available" name="remote_work_available" checked={formData.remote_work_available ?? false} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                          <label htmlFor="remote_work_available" className="ml-2 block text-sm text-gray-900">リモートワークの有無</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="side_job_allowed" name="side_job_allowed" checked={formData.side_job_allowed ?? false} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                          <label htmlFor="side_job_allowed" className="ml-2 block text-sm text-gray-900">副業の可否</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="housing_allowance_available" name="housing_allowance_available" checked={formData.housing_allowance_available ?? false} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                          <label htmlFor="housing_allowance_available" className="ml-2 block text-sm text-gray-900">住宅手当・家賃補助の有無</label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">女性の育休・産休の取得割合</label>
                          <textarea name="female_parental_leave_rate" value={formData.female_parental_leave_rate || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="例: 100%（改行や空白を保持できます）"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">男性の育休取得割合</label>
                          <textarea name="male_parental_leave_rate" value={formData.male_parental_leave_rate || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="例: 50%（改行や空白を保持できます）"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">社内イベントの頻度（懇親会など）</label>
                          <textarea name="internal_event_frequency" value={formData.internal_event_frequency || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="例: 年2回、毎月（改行や空白を保持できます）"></textarea>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">実践している健康経営の取り組み（カンマ区切り）</label>
                          <textarea name="health_management_practices" value={(formData.health_management_practices || []).join(', ')} onChange={handleInputChange} rows={2} placeholder="例: 禁煙サポート, メンタルヘルスチェック" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">これだけは伝えたい福利厚生（自由記述）</label>
                          <textarea name="must_tell_welfare" value={formData.must_tell_welfare || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">異動・転勤</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <input type="checkbox" id="transfer_existence" name="transfer_existence" checked={formData.transfer_existence ?? false} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                          <label htmlFor="transfer_existence" className="ml-2 block text-sm text-gray-900">異動や転勤の有無</label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">異動や転勤の頻度</label>
                          <textarea name="transfer_frequency" value={formData.transfer_frequency || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="例: 3年に一度、原則なし（改行や空白を保持できます）"></textarea>
                        </div>
                      </div>
                    </section>
                  </>
                )}

                {/* ======================= タブ 3: 募集・採用 ======================= */}
                {activeModalTab === 'recruitment' && (
                  <>
                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">採用募集情報</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">募集職種とその人数</label>
                          <textarea name="recruitment_roles_count" value={formData.recruitment_roles_count || ''} onChange={handleInputChange} rows={2} placeholder="例: 営業職 3名、開発職 2名" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">選考フロー（カンマ区切り、複数回答）</label>
                          <textarea name="selection_flow_steps" value={(formData.selection_flow_steps || []).join(', ')} onChange={handleInputChange} rows={2} placeholder="例: 説明会, 書類選考, 一次面接, 最終面接" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">採用情報ページ URL</label>
                          <input type="url" name="recruitment_info_page_url" value={formData.recruitment_info_page_url || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">SNS・問い合わせ先</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">採用担当部署（担当者）</label>
                          <textarea name="recruitment_department" value={formData.recruitment_department || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="改行や空白を保持できます"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">採用に関する問い合わせ先（メール/電話）</label>
                          <textarea name="recruitment_contact" value={formData.recruitment_contact || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="改行や空白を保持できます"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
                          <input type="url" name="instagram_url" value={formData.instagram_url || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">TikTok URL</label>
                          <input type="url" name="tiktok_url" value={formData.tiktok_url || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">その他掲載サイトやSNSがあればご入力ください。</label>
                          <textarea name="other_sns_sites" value={formData.other_sns_sites || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                      </div>
                    </section>
                  </>
                )}

                {/* ======================= タブ 4: インターンシップ ======================= */}
                {activeModalTab === 'internship' && (
                  <>
                    <section>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-1">インターンシップ概要</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center md:col-span-2">
                          <input type="checkbox" id="internship_scheduled" name="internship_scheduled" checked={formData.internship_scheduled ?? false} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                          <label htmlFor="internship_scheduled" className="ml-2 block text-sm text-gray-900">インターンシップ実施予定</label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">インターンシップ実施日程</label>
                          <textarea name="internship_schedule" value={formData.internship_schedule || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="例: 8月上旬、随時開催（改行や空白を保持できます）"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">定員（目安でも可）</label>
                          <textarea name="internship_capacity" value={formData.internship_capacity || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="例: 10名、各回5名（改行や空白を保持できます）"></textarea>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">対象学生（カンマ区切り、複数回答）</label>
                          <textarea name="internship_target_students" value={(formData.internship_target_students || []).join(', ')} onChange={handleInputChange} rows={2} placeholder="例: 全学部対象, 開発系専攻" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">実施場所（カンマ区切り、複数回答）</label>
                          <textarea name="internship_locations" value={(formData.internship_locations || []).join(', ')} onChange={handleInputChange} rows={2} placeholder="例: オンライン, 本社" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">インターンシップの内容（カンマ区切り、複数選択）</label>
                          <textarea name="internship_content_types" value={(formData.internship_content_types || []).join(', ')} onChange={handleInputChange} rows={2} placeholder="例: 業界理解, ワークショップ, OJT" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">有償 or 無償</label>
                          <select name="internship_paid_unpaid" value={formData.internship_paid_unpaid || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            <option value="">選択してください</option>
                            <option value="有償">有償</option>
                            <option value="無償">無償</option>
                          </select>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="transport_lodging_stipend" name="transport_lodging_stipend" checked={formData.transport_lodging_stipend ?? false} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                          <label htmlFor="transport_lodging_stipend" className="ml-2 block text-sm text-gray-900">交通費・宿泊費の支給</label>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">インターンシップ申込URL</label>
                          <input type="url" name="internship_application_url" value={formData.internship_application_url || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
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
                  type="button" 
                  onClick={handleSubmit} 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !formData.company_name} 
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
