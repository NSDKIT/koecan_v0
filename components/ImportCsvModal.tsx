// koecan_v0-main/components/ImportCsvModal.tsx (新規作成)

'use client'

import React, { useState } from 'react';
import { X, FileText, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Advertisement } from '@/types';

interface ImportCsvModalProps {
  onClose: () => void;
  onImport: () => void; // 成功時のコールバック (AdminDashboardのリスト再取得)
}

// CSVヘッダーの配列（CSVファイルと完全に一致させる）
const CSV_HEADERS = [
    "タイムスタンプ", "会社名", "公式ホームページのURL", "代表者名", "貴社が目指す未来（100文字以内）", 
    "所在地（本社）", "所在地（支社）", "業界（複数回答）", "設立年", "従業員数", 
    "男女比", "従業員の平均年齢（社員以外を含む）", "イチオシポイント①", "イチオシポイント①", // CSVにはイチオシポイント①が重複しているが、ここでは2つ目を②として処理
    "イチオシポイント③", "初任給", "20代の平均年収", "30代の平均年収", "3年間の定着率", 
    "昇進・キャリアパスのモデルケース", "副業の可否", "リモートワークの有無", "住宅手当・家賃補助の有無", 
    "女性の育休・産休の取得割合", "男性の育休取得割合", "実践している健康経営の取り組み（複数選択）", 
    "社内イベントの頻度（懇親会・レクリエーションなど）", "これだけは伝えたい福利厚生", "異動や転勤の有無", 
    "異動や転勤の頻度", "募集職種とその人数", "選考フロー（複数回答）", "採用に関する問い合わせ先", 
    "採用担当部署（担当者）", "採用情報ページ", "Instagram", "TikTok", "その他掲載サイトやSNSがあればご入力ください。", 
    "インターンシップ実施予定", "インターンシップ実施日程", "定員（目安でも可）", "対象学生（複数回答）", 
    "実施場所（複数回答）", "インターンシップの内容（複数選択）", "有償 or 無償", "交通費・宿泊費の支給", 
    "インターンシップ申込URL", "従業員様の働く様子や、集合写真、オフィス等、会社の雰囲気が伝わる画像を１枚ご提供ください。", 
    "考え方の傾向", "2.視野の広げ方", "1.仕事のエネルギーの使い方", "3.挑戦への向き合い方", 
    "4.変化への反応", "5.未来の捉え方", "6.モチベーションの源", "チームの中での役割", 
    "7.成果の捉え方", "8.変化対応のスタイル", "8.ルールとの向き合い方", "イチオシポイント③_重複", "イチオシポイント②_重複", "10.判断・行動の特徴"
];

// CSVヘッダーとDBカラムのマッピング
const FIELD_MAPPING: { [key: string]: keyof Advertisement } = {
    "会社名": "company_name",
    "公式ホームページのURL": "official_website_url",
    "代表者名": "representative_name",
    "貴社が目指す未来（100文字以内）": "company_vision",
    "所在地（本社）": "headquarters_location",
    "所在地（支社）": "branch_office_location",
    "業界（複数回答）": "industries",
    "設立年": "establishment_year",
    "従業員数": "employee_count",
    "男女比": "employee_gender_ratio",
    "従業員の平均年齢（社員以外を含む）": "employee_avg_age",
    "イチオシポイント①": "highlight_point_1",
    "イチオシポイント①_2": "highlight_point_2", // CSVの重複を考慮し2つ目を②として扱う
    "イチオシポイント③": "highlight_point_3",
    "初任給": "starting_salary",
    "20代の平均年収": "avg_annual_income_20s",
    "30代の平均年収": "avg_annual_income_30s",
    "3年間の定着率": "three_year_retention_rate",
    "昇進・キャリアパスのモデルケース": "promotion_model_case",
    "副業の可否": "side_job_allowed",
    "リモートワークの有無": "remote_work_available",
    "住宅手当・家賃補助の有無": "housing_allowance_available",
    "女性の育休・産休の取得割合": "female_parental_leave_rate",
    "男性の育休取得割合": "male_parental_leave_rate",
    "実践している健康経営の取り組み（複数選択）": "health_management_practices",
    "社内イベントの頻度（懇親会・レクリエーションなど）": "internal_event_frequency",
    "これだけは伝えたい福利厚生": "must_tell_welfare",
    "異動や転勤の有無": "transfer_existence",
    "異動や転勤の頻度": "transfer_frequency",
    "募集職種とその人数": "recruitment_roles_count",
    "選考フロー（複数回答）": "selection_flow_steps",
    "採用に関する問い合わせ先": "recruitment_contact",
    "採用担当部署（担当者）": "recruitment_department",
    "採用情報ページ": "recruitment_info_page_url",
    "Instagram": "instagram_url",
    "TikTok": "tiktok_url",
    "その他掲載サイトやSNSがあればご入力ください。": "other_sns_sites",
    "インターンシップ実施予定": "internship_scheduled",
    "インターンシップ実施日程": "internship_schedule",
    "定員（目安でも可）": "internship_capacity",
    "対象学生（複数回答）": "internship_target_students",
    "実施場所（複数回答）": "internship_locations",
    "インターンシップの内容（複数選択）": "internship_content_types",
    "有償 or 無償": "internship_paid_unpaid",
    "交通費・宿泊費の支給": "transport_lodging_stipend",
    "インターンシップ申込URL": "internship_application_url",
    "従業員様の働く様子や、集合写真、オフィス等、会社の雰囲気が伝わる画像を１枚ご提供ください。": "image_url",
    // 従業員様の働く様子... -> image_url にマッピング (任意)
    // 以下の項目はDBに定義がないが、CSVに存在するため無視（または別のカラムにマッピングが必要）
    // "考え方の傾向": null, "2.視野の広げ方": null, "1.仕事のエネルギーの使い方": null, ...
};

// 特定の文字列をブーリアンに変換するヘルパー関数
const toBoolean = (val: string) => {
    const lower = val.toLowerCase().trim();
    return lower === 'あり' || lower === '有' || lower === '可' || lower === 'true';
};

// CSVテキストをAdvertisementオブジェクトの配列に変換する関数
const parseCsvToAdvertisements = (csvText: string, creatorId: string): Partial<Advertisement>[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) throw new Error("CSVにはヘッダーとデータ行が必要です。");

    // ヘッダー行を読み込み（CSVヘッダーと一致していることを前提とする）
    let headers = lines[0].split(',').map(h => h.trim());
    
    // CSVのヘッダーが重複している部分を修正
    if (headers[13] === "イチオシポイント①") headers[13] = "イチオシポイント①_2";
    if (headers[51] === "イチオシポイント③") headers[51] = "イチオシポイント③_重複";
    if (headers[52] === "イチオシポイント②") headers[52] = "イチオシポイント②_重複";


    const results: Partial<Advertisement>[] = [];
    const now = new Date().toISOString();

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const ad: Partial<Advertisement> = {
            is_active: true, // デフォルトでアクティブ
            priority: 100,
            created_by: creatorId,
            created_at: now,
            updated_at: now,
        };
        
        for (let j = 0; j < values.length && j < headers.length; j++) {
            const header = headers[j];
            const value = values[j].trim();
            const dbField = FIELD_MAPPING[header];

            if (!dbField) continue;
            if (value === '') continue; // 空値はスキップ

            switch (dbField) {
                case 'industries':
                case 'health_management_practices':
                case 'selection_flow_steps':
                case 'internship_target_students':
                case 'internship_locations':
                case 'internship_content_types':
                    // 配列型: カンマ区切りを配列に変換 (全角・半角カンマ両方対応)
                    const arrValue = value.split(/[、,]/).map(s => s.trim()).filter(s => s !== ''); 
                    (ad as any)[dbField] = arrValue.length > 0 ? arrValue : null;
                    break;
                case 'side_job_allowed':
                case 'remote_work_available':
                case 'housing_allowance_available':
                case 'transfer_existence':
                case 'transport_lodging_stipend':
                    // ブーリアン型: 特定の文字列を boolean に変換
                    (ad as any)[dbField] = toBoolean(value);
                    break;
                case 'establishment_year':
                case 'employee_count':
                case 'employee_avg_age':
                    // 数値型
                    (ad as any)[dbField] = parseInt(value) || null;
                    break;
                case 'company_vision':
                    // description の NOT NULL 制約への対応（優先度高）
                    if (value.length > 100) {
                        ad.company_vision = value.substring(0, 100) + '...';
                    } else {
                        ad.company_vision = value;
                    }
                    ad.description = ad.company_vision; // 旧 description にも設定
                    ad.title = ad.company_name; // 旧 title にも設定
                    break;
                default:
                    // その他のテキスト型
                    (ad as any)[dbField] = value;
            }
        }
        
        // 会社名が必須
        if (ad.company_name) {
            results.push(ad);
        } else {
            console.log(`WARNING: 行 ${i + 1} の企業名は空のためスキップされました。`); 
        }
    }
    return results;
};


export function ImportCsvModal({ onClose, onImport }: ImportCsvModalProps) {
  const { user } = useAuth();
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Partial<Advertisement>[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = () => {
    setError(null);
    if (!csvText.trim()) {
        setError("CSVテキストを入力してください。");
        return;
    }
    
    try {
      const parsed = parseCsvToAdvertisements(csvText, user?.id || 'unknown-user');
      setPreview(parsed);
      if (parsed.length === 0) {
          setError("CSVから有効な企業情報が抽出されませんでした。ヘッダーとデータを確認してください。");
      }
    } catch (err) {
      // ★★★ 修正箇所: 型ガードを使用して err.message にアクセス ★★★
      setError(`CSV解析に失敗しました。形式を確認してください: ${err instanceof Error ? err.message : String(err)}`);
      setPreview(null);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0 || !user) return;

    setLoading(true);
    setError(null);
    
    // NOTE: SupabaseのBulk Insertは巨大なデータではタイムアウトすることがあるため、
    // ここではシンプルに一括挿入を試みます。

    try {
      // データベースへの挿入
      const { error: insertError } = await supabase
        .from('advertisements')
        .insert(preview as any); // Advertisement[]を挿入

      if (insertError) throw insertError;

      alert(`${preview.length}件の企業情報をインポートしました！`);
      onImport(); // 親コンポーネントに通知しリストを更新
      onClose();
    } catch (err) {
      console.error('Error importing advertisements:', err);
      // ★★★ 修正箇所: 型ガードを使用して err.message にアクセス ★★★
      setError(`データベースへの挿入に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
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
              <h2 className="text-2xl font-bold text-gray-800">CSVから企業情報を一括インポート</h2>
              <p className="text-gray-600">CSV形式のテキストを解析し、企業情報を登録します</p>
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">CSVデータを入力</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-2">重要:</p>
                      <p>CSVはヘッダー（1行目）を含めて、カンマ区切りで入力してください。</p>
                      <p>ヘッダーはGoogleフォームの回答形式に厳密に一致させる必要があります。</p>
                    </div>
                  </div>
                </div>

                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="例: タイムスタンプ,会社名,公式ホームページのURL,...\n2025/10/06 20:28:55,株式会社A,https://a.com,..."
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
                  disabled={!csvText.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  プレビュー ({csvText.split('\n').length - 1}件)
                </button>
              </div>
            </div>
          ) : (
            /* Preview */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">プレビュー ({preview.length}件の企業情報)</h3>
                <button
                  onClick={() => setPreview(null)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  編集に戻る
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-sm font-semibold text-gray-800 mb-2">インポートされる企業名:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 max-h-40 overflow-y-auto">
                    {preview.map((ad, index) => (
                        <li key={index}>**{ad.company_name}** - ビジョン: {ad.company_vision ? ad.company_vision.substring(0, 30) : 'N/A'}</li>
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
                  {preview.length}件をデータベースに挿入
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
