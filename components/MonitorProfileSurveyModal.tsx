'use client'

import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, AlertCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

interface MonitorProfileSurveyModalProps {
  onClose: () => void;
  onSaveSuccess: () => void;
}

// Define types for active section
type ActiveSection = 'A' | 'B' | 'C' | 'D';

export function MonitorProfileSurveyModal({ onClose, onSaveSuccess }: MonitorProfileSurveyModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('A'); // New state for active section

  // Initial form state (simplified for example, full state would be complex)
  // In a real application, you might load existing data from a Supabase table.
  const [formData, setFormData] = useState<any>({
    // A. 基本情報
    gender: '', // Q1
    grade: '', // Q2
    gradeOther: '', // Q2 その他
    prefecture: '', // Q3
    prefectureOther: '', // Q3 福井県外
    school: '', // Q4
    schoolOther: '', // Q4 その他
    faculty: '', // Q5 学部名
    department: '', // Q5 学科名
    interestedIndustries: [], // Q6
    interestedIndustriesOther: '', // Q6 その他
    interestedOccupations: [], // Q7
    interestedOccupationsOther: '', // Q7 その他
    jobHuntingAreas: [], // Q8

    // B. 就活意識・価値観
    importantPoints: [], // Q9 (上位3つ)
    importantBenefits: [], // Q10 (上位3つ)
    dislikedPoints: [], // Q11 (1つ以上)
    livelyWorkState: [], // Q12
    jobHuntingStartPeriod: '', // Q13
    companyInfoSources: [], // Q14

    // C. 働き方に対する価値観
    job_satisfaction_moments: [], // Q15 (データベースのカラム名に合わせた)

    // D. 情報接点・企業認知
    infoSources: [], // Q16
    mostHelpfulInfoSource: '', // Q17
    snsExposure: '', // Q18
    impressiveSnsPost: '', // Q19 (記述式)
    weeklyUseSNS: [], // Q20
    companiesToWatch: [], // Q21
    goodPointsInSelection: '', // Q22 (記述式)
    improvementsInSelection: '', // Q23 (記述式)
    impressiveRecruitmentPage: '', // Q24 (記述式)
  });

  // Load existing data on mount (if available)
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('monitor_profile_survey') // 例: 新しく作成するテーブル名
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
        console.error('Error fetching existing survey data:', error);
        setError('既存データの読み込みに失敗しました。');
      } else if (data) {
        // formDataにデータベースから取得したデータをマッピング
        setFormData({
          gender: data.gender || '',
          grade: data.grade || '',
          gradeOther: data.grade_other || '', // データベースのカラム名
          prefecture: data.prefecture || '',
          prefectureOther: data.prefecture_other || '', // データベースのカラム名
          school: data.school || '',
          schoolOther: data.school_other || '', // データベースのカラム名
          faculty: data.faculty || '',
          department: data.department || '',
          interestedIndustries: data.interested_industries || [], // データベースのカラム名
          interestedIndustriesOther: data.interested_industries_other || '', // データベースのカラム名
          interestedOccupations: data.interested_occupations || [], // データベースのカラム名
          interestedOccupationsOther: data.interested_occupations_other || '', // データベースのカラム名
          jobHuntingAreas: data.job_hunting_areas || [], // データベースのカラム名

          importantPoints: data.important_points || [], // データベースのカラム名
          importantBenefits: data.important_benefits || [], // データベースのカラム名
          dislikedPoints: data.disliked_points || [], // データベースのカラム名
          livelyWorkState: data.lively_work_state || [], // データベースのカラム名
          jobHuntingStartPeriod: data.job_hunting_start_period || '', // データベースのカラム名
          companyInfoSources: data.company_info_sources || [], // データベースのカラム名

          job_satisfaction_moments: data.job_satisfaction_moments || [], // データベースのカラム名

          infoSources: data.info_sources || [], // データベースのカラム名
          mostHelpfulInfoSource: data.most_helpful_info_source || '', // データベースのカラム名
          snsExposure: data.sns_exposure || '', // データベースのカラム名
          impressiveSnsPost: data.impressive_sns_post || '', // データベースのカラム名
          weeklyUseSNS: data.weekly_use_sns || [], // データベースのカラム名
          companiesToWatch: data.companies_to_watch || [], // データベースのカラム名
          goodPointsInSelection: data.good_points_in_selection || '', // データベースのカラム名
          improvementsInSelection: data.improvements_in_selection || '', // データベースのカラム名
          impressiveRecruitmentPage: data.impressive_recruitment_page || '', // データベースのカラム名
        });
      }
      setLoading(false);
    };
    fetchExistingData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      setFormData((prev: any) => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter((item: string) => item !== value),
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }
    setSuccess(null); // Clear success message on change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('ユーザー情報がありません。再度ログインしてください。');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upsert (insert or update) data into a new table
      // `formData` のキーをデータベースのカラム名に合わせる
      const dataToSave = {
        user_id: user.id,
        gender: formData.gender,
        grade: formData.grade,
        grade_other: formData.gradeOther, // データベースのカラム名に合わせる
        prefecture: formData.prefecture,
        prefecture_other: formData.prefectureOther, // データベースのカラム名に合わせる
        school: formData.school,
        school_other: formData.schoolOther, // データベースのカラム名に合わせる
        faculty: formData.faculty,
        department: formData.department,
        interested_industries: formData.interestedIndustries, // データベースのカラム名に合わせる
        interested_industries_other: formData.interestedIndustriesOther, // データベースのカラム名に合わせる
        interested_occupations: formData.interestedOccupations, // データベースのカラム名に合わせる
        interested_occupations_other: formData.interestedOccupationsOther, // データベースのカラム名に合わせる
        job_hunting_areas: formData.jobHuntingAreas, // データベースのカラム名に合わせる

        important_points: formData.importantPoints, // データベースのカラム名に合わせる
        important_benefits: formData.importantBenefits, // データベースのカラム名に合わせる
        disliked_points: formData.dislikedPoints, // データベースのカラム名に合わせる
        lively_work_state: formData.livelyWorkState, // データベースのカラム名に合わせる
        job_hunting_start_period: formData.jobHuntingStartPeriod, // データベースのカラム名に合わせる
        company_info_sources: formData.companyInfoSources, // データベースのカラム名に合わせる

        job_satisfaction_moments: formData.job_satisfaction_moments, // データベースのカラム名に合わせる

        info_sources: formData.infoSources, // データベースのカラム名に合わせる
        most_helpful_info_source: formData.mostHelpfulInfoSource, // データベースのカラム名に合わせる
        sns_exposure: formData.snsExposure, // データベースのカラム名に合わせる
        impressive_sns_post: formData.impressiveSnsPost, // データベースのカラム名に合わせる
        weekly_use_sns: formData.weeklyUseSNS, // データベースのカラム名に合わせる
        companies_to_watch: formData.companiesToWatch, // データベースのカラム名に合わせる
        good_points_in_selection: formData.goodPointsInSelection, // データベースのカラム名に合わせる
        improvements_in_selection: formData.improvementsInSelection, // データベースのカラム名に合わせる
        impressive_recruitment_page: formData.impressiveRecruitmentPage, // データベースのカラム名に合わせる
        
        updated_at: new Date().toISOString(), // 最終更新日時
      };

      const { data, error: upsertError } = await supabase
        .from('monitor_profile_survey') // 例: 新しく作成するテーブル名
        .upsert(
          dataToSave,
          { onConflict: 'user_id' } // user_id が競合した場合に更新
        );

      if (upsertError) throw upsertError;

      setSuccess('プロフィールアンケートを保存しました！');
      onSaveSuccess(); // Invoke callback for parent component
      // onClose(); // Optionally close modal on success
    } catch (err) {
      console.error('Error saving profile survey:', err);
      setError(err instanceof Error ? err.message : '保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 質問のオプションに「その他」が含まれる場合の処理を簡略化するため、オプションの文字列から括弧とその中身を削除するヘルパー関数
  const getOptionValue = (option: string) => option.split('（')[0].trim();


  const renderCheckboxGroup = (
    question: string,
    name: string,
    options: string[],
    maxSelections?: number,
    minSelections?: number
  ) => (
    <div className="mb-3 sm:mb-4">
      <p className="font-semibold text-xs sm:text-sm text-gray-800 mb-1 sm:mb-2">{question}</p>
      {options.map((option, index) => {
        const optionValue = getOptionValue(option);
        const isOther = option.includes('その他');
        const isChecked = formData[name]?.includes(optionValue);
        const isDisabled = !!(maxSelections && formData[name].length >= maxSelections && !isChecked);

        return (
          <label key={index} className="flex items-center mb-1">
            <input
              type="checkbox"
              name={name}
              value={optionValue}
              checked={isChecked}
              onChange={handleInputChange}
              disabled={isDisabled}
              className="mr-2"
            />
            <span className="text-xs sm:text-sm">{optionValue}</span>
            {isOther && (
              <input
                type="text"
                name={`${name}Other`} // `Other` サフィックスを付ける
                value={formData[`${name}Other`]}
                onChange={handleInputChange}
                className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="詳細"
                disabled={!isChecked} // 「その他」がチェックされていない場合は無効
              />
            )}
          </label>
        );
      })}
      {maxSelections && <p className="text-xs text-gray-500 mt-1">（{maxSelections}つまで選択可）</p>}
      {minSelections && <p className="text-xs text-red-500 mt-1">（{minSelections}つ以上選択してください）</p>}
    </div>
  );

  const renderRadioGroup = (question: string, name: string, options: string[]) => (
    <div className="mb-3 sm:mb-4">
      <p className="font-semibold text-xs sm:text-sm text-gray-800 mb-1 sm:mb-2">{question}</p>
      {options.map((option, index) => {
        const optionValue = getOptionValue(option);
        const isOther = option.includes('その他');
        const isChecked = formData[name] === optionValue;

        return (
          <label key={index} className="flex items-center mb-1">
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={isChecked}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-xs sm:text-sm">{optionValue}</span>
            {isOther && (
              <input
                type="text"
                name={`${name}Other`} // `Other` サフィックスを付ける
                value={formData[`${name}Other`]}
                onChange={handleInputChange}
                className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="詳細"
                disabled={!isChecked} // 「その他」がチェックされていない場合は無効
              />
            )}
          </label>
        );
      })}
    </div>
  );

  const renderTextInput = (question: string, name: string, placeholder: string, rows?: number) => (
    <div className="mb-3 sm:mb-4">
      <label className="block font-semibold text-xs sm:text-sm text-gray-800 mb-1 sm:mb-2">{question}</label>
      {rows ? (
        <textarea
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          rows={rows}
          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
      )}
    </div>
  );

  const sections: ActiveSection[] = ['A', 'B', 'C', 'D'];
  const currentSectionIndex = sections.indexOf(activeSection);

  const goToNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setActiveSection(sections[currentSectionIndex + 1]);
      setSuccess(null); // Clear success message when changing section
      setError(null);   // Clear error message when changing section
    }
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setActiveSection(sections[currentSectionIndex - 1]);
      setSuccess(null); // Clear success message when changing section
      setError(null);   // Clear error message when changing section
    }
  };


  if (loading && !success && !error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 text-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 animate-spin mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full my-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <h2 className="text-base sm:text-xl font-bold text-gray-800">プロフィールアンケート</h2>
            <span className="ml-2 sm:ml-3 px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
              追加情報
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tab Navigation for sections */}
        <div className="border-b border-gray-200 px-3 sm:px-6 flex-shrink-0">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveSection('A')}
              className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeSection === 'A' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              A. 基本情報
            </button>
            <button
              onClick={() => setActiveSection('B')}
              className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeSection === 'B' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              B. 就活意識・価値観
            </button>
            <button
              onClick={() => setActiveSection('C')}
              className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeSection === 'C' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              C. 働き方
            </button>
            <button
              onClick={() => setActiveSection('D')}
              className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeSection === 'D' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              D. 情報接点
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 sm:p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2 sm:p-3 rounded-lg text-xs sm:text-sm mb-3 sm:mb-4 flex items-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-2 sm:p-3 rounded-lg text-xs sm:text-sm mb-3 sm:mb-4 flex items-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* A. 基本情報 */}
            {activeSection === 'A' && (
              <section>
                <h3 className="text-base sm:text-lg font-bold text-blue-700 mb-3 sm:mb-4">A. 基本情報（分類・フィルタ用）</h3>
                {renderRadioGroup('Q1. 性別（いずれかを選択）', 'gender', ['男性', '女性', 'その他', '無回答'])}
                {renderRadioGroup('Q2. 学年（いずれかを選択）', 'grade', ['大学1年', '大学2年', '大学3年', '大学4年', '大学院生', 'その他（　　　　　　　　　　　）'])}
                {formData.grade === 'その他' && renderTextInput('その他学年', 'gradeOther', '学年を入力', 1)}
                {renderRadioGroup('Q3. 出身地（いずれかを選択）', 'prefecture', ['福井県', '福井県外（都道府県名：　　　　　　　　　　　）'])}
                {formData.prefecture === '福井県外' && renderTextInput('都道府県名', 'prefectureOther', '都道府県名を入力', 1)}
                {renderRadioGroup('Q4. 所属学校（いずれかを選択）', 'school', ['福井大学', '福井県立大学', '福井工業大学', '仁愛大学', 'その他（学校名：　　　　　　　　　　　）'])}
                {formData.school === 'その他' && renderTextInput('学校名', 'schoolOther', '学校名を入力', 1)}
                {renderTextInput('Q5. 所属学部・学科 - 学部名', 'faculty', '学部名を入力', 1)}
                {renderTextInput('Q5. 所属学部・学科 - 学科名', 'department', '学科名を入力', 1)}
                {renderCheckboxGroup('Q6. 興味のある業界（複数選択可）', 'interestedIndustries', ['製造業', '建設・不動産', '運送・物流・倉庫', '卸売', '小売', '飲食・宿泊・サービス', 'IT・情報通信', '広告・デザイン', 'マーケティング・コンサルティング', '医療・福祉', '人材・教育', '金融・保険', '公務・団体・インフラ', '美容・健康', 'その他（　　　　　　　　　　　）'])}
                {formData.interestedIndustries.includes('その他') && renderTextInput('Q6. その他業界', 'interestedIndustriesOther', 'その他の業界名を入力', 1)}
                {renderCheckboxGroup('Q7. 興味のある職種（複数選択可）', 'interestedOccupations', ['経営・管理職', '企画・マーケティング', '営業', '販売・サービス', '専門職', '金融', '医療・福祉', 'IT', 'クリエイティブ', '技術・研究', '教育・保育・公共サービス', 'その他（　　　　　　　　　　　）'])}
                {formData.interestedOccupations.includes('その他') && renderTextInput('Q7. その他職種', 'interestedOccupationsOther', 'その他の職種名を入力', 1)}
                {renderCheckboxGroup('Q8. 就職希望エリア（複数選択可）', 'jobHuntingAreas', ['福井県内', '地元にUターン（福井以外）', '首都圏（東京・神奈川・千葉・埼玉）', '関西圏（大阪・京都・兵庫）', '特に決めていない'])}
              </section>
            )}

            {/* B. 就活意識・価値観 */}
            {activeSection === 'B' && (
              <section>
                <h3 className="text-base sm:text-lg font-bold text-blue-700 mb-3 sm:mb-4">B. 就活意識・価値観</h3>
                {renderCheckboxGroup('Q9. 企業を選ぶ際に重視するポイントは？', 'importantPoints', ['福利厚生', '成長できる環境', '職場の雰囲気・人間関係', '自分の得意分野が活かせる', 'ワークライフバランス', '地元・地域への貢献性', '経営・雇用が安定している', '裁量の大きさ（若手でも任せてもらえる）', 'やりがいを感じられる仕事', 'リモートワーク・柔軟な働き方ができる', '副業可能', '企業の知名度', '勤務地', '業界', '会社として力を入れていること（職場環境や事業など）', '企業のミッション・ビジョンに共感できる', 'その他（　　　　　　　　　　　）'], 3)}
                {renderCheckboxGroup('Q10. 特に重視する福利厚生は？', 'importantBenefits', ['社会保険・退職金など制度が整っている', '産休・育休・介護休暇などが取りやすい', '有給が取りやすい', '社割・旅行補助・レジャー施設優待などがある', '教育制度（資格支援・外部研修）など自己投資の支援がある', 'イベント・交流・サークル活動などが盛ん', '髪色、ネイル、ピアス、服装などの身だしなみが自由'], 3)}
                {renderCheckboxGroup('Q11. この項目が充実していないと嫌だなと感じるポイントは？', 'dislikedPoints', ['福利厚生', '成長できる環境', '職場の雰囲気・人間関係', '自分の得意分野が活かせる', 'ワークライフバランス', '地元・地域への貢献性', '経営・雇用が安定している', '裁量の大きさ（若手でも任せてもらえる）', 'やりがいを感じられる仕事', 'リモートワーク・柔軟な働き方ができる', '副業可能', '企業の知名度', '勤務地', '業界', '会社として力を入れていること（職場環境や事業など）', '企業のミッション・ビジョンに共感できる', 'その他（　　　　　　　　　　　）'], undefined, 1)}
                {renderCheckboxGroup('Q12. 生き生き働いていると感じるのは、どのような状態だと思いますか？', 'livelyWorkState', ['やりがいを感じている', '人間関係が良好', 'プライベートが充実している', '評価されていると感じる', '成長実感がある', '自主的に動けている', '月末にお金が振り込まれる瞬間'])}
                {renderRadioGroup('Q13. 就活を始めた時期を教えてください', 'jobHuntingStartPeriod', ['1年生の時から', '2年生の時から', '3年生の春前（1〜3月）', '3年生の春（4〜6月）', '3年生の夏（7〜9月）', '3年生の秋（10〜12月）', '3年生の冬（1〜2月）', '4年生以降', '就活はしていない／考えていない'])}
                {renderCheckboxGroup('Q14. 会社のHPやSNSの採用アカウントで知りたい内容は？', 'companyInfoSources', ['社員の日常', '採用情報', '製品やサービス紹介', '職場の雰囲気', '従業員の雰囲気', '社員インタビュー', '企業文化紹介（企業のミッション・ビジョン）'])}
              </section>
            )}

            {/* C. 働き方に対する価値観 */}
            {activeSection === 'C' && (
              <section>
                <h3 className="text-base sm:text-lg font-bold text-blue-700 mb-3 sm:mb-4">C. 働き方に対する価値観</h3>
                {renderCheckboxGroup('Q15. あなたが「働きがい」を感じるのはどんなときですか？', 'job_satisfaction_moments', ['感謝されたとき', 'チームで成果を出したとき', '自分の意見が活かされたとき', '昇給・評価されたとき', '挑戦ができたとき', '人の役に立ったとき', 'その他（　　　　　　　　　　　）'])}
              </section>
            )}

            {/* D. 情報接点・企業認知 */}
            {activeSection === 'D' && (
              <section>
                <h3 className="text-base sm:text-lg font-bold text-blue-700 mb-3 sm:mb-4">D. 情報接点・企業認知</h3>
                {renderCheckboxGroup('Q16. 企業情報はどこで入手しますか？', 'infoSources', ['マイナビ', 'リクナビ', 'その他就活サイト', '大学のキャリアセンター', '合同説明会', 'Instagram', 'YouTube', 'TikTok', 'X（旧Twitter）', '企業ホームページ', '知人からの紹介', 'その他（　　　　　　　　　　　）'])}
                {renderRadioGroup('Q17. 就職活動で特に参考になった情報源は？', 'mostHelpfulInfoSource', ['マイナビ', 'リクナビ', 'その他就活サイト', '学校のキャリアセンター', '合同説明会', 'Instagram', 'YouTube', 'TikTok', 'X（旧Twitter）', '企業ホームページ', 'その他（　　　　　　　　　　　）'])}
                {renderRadioGroup('Q18. SNSで企業アカウントを見たことがありますか？', 'snsExposure', ['よく見る', 'たまに見る', '見たことはあるが、ほとんど見ない', '見たことがない'])}
                {renderTextInput('Q19. 印象に残っている企業のSNS投稿があれば、その内容を教えてください。（記述式）', 'impressiveSnsPost', '内容を具体的に記述してください', 3)}
                {renderCheckboxGroup('Q20. 週5日以上使用するSNSをすべて教えてください。', 'weeklyUseSNS', ['Instagram', 'TikTok', 'YouTube', 'X（旧Twitter）'])}
                {renderCheckboxGroup('Q21. 就職を考えている企業の何を見ますか？', 'companiesToWatch', ['企業ホームページ', 'Instagram', 'TikTok', 'YouTube', 'X（旧Twitter）', 'Googleマップ', 'その他（　　　　　　　　　　　）'])}
                {renderTextInput('Q22. 選考過程で「この企業は良い」と感じたポイントは何でしたか？（記述式）', 'goodPointsInSelection', '具体的に記述してください', 3)}
                {renderTextInput('Q23. 説明会や選考過程で「もっとこうしてほしい」と感じる点はありますか？（記述式）', 'improvementsInSelection', '具体的に記述してください', 3)}
                {renderTextInput('Q24. 採用ページで印象に残っている内容があれば、業界とその内容を教えてください。（記述式）', 'impressiveRecruitmentPage', '業界と内容を記述してください', 3)}
              </section>
            )}

            <div className="flex space-x-2 sm:space-x-4 pt-4 sm:pt-6 mt-4 sm:mt-6 flex-shrink-0 border-t border-gray-200">
              <button
                type="button"
                onClick={goToPreviousSection}
                disabled={currentSectionIndex === 0 || loading}
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> 前へ
              </button>

              {currentSectionIndex < sections.length - 1 ? (
                <button
                  type="button"
                  onClick={goToNextSection}
                  disabled={loading}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  次へ <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  )}
                  保存する
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
