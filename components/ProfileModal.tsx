'use client'

import React, { useState, useEffect } from 'react';
import { X, User, Save, Edit, CheckCircle, AlertCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ProfileModalProps {
  user: any;
  profile: any;
  onClose: () => void;
  onUpdate: () => void;
}

type ActiveTab = 'profile' | 'survey';
type ActiveSection = 'A' | 'B' | 'C' | 'D';

export function ProfileModal({ user, profile, onClose, onUpdate }: ProfileModalProps) {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: profile?.age || '',
    gender: profile?.gender || '',
    occupation: profile?.occupation || '',
    location: profile?.location || ''
  });

  // プロフィールアンケート用のstate
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [surveySuccess, setSurveySuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('A');
  const [surveyFormData, setSurveyFormData] = useState<any>({
    gender: '',
    grade: '',
    gradeOther: '',
    prefecture: '',
    prefectureOther: '',
    school: '',
    schoolOther: '',
    faculty: '',
    department: '',
    interestedIndustries: [],
    interestedIndustriesOther: '',
    interestedOccupations: [],
    interestedOccupationsOther: '',
    jobHuntingAreas: [],
    importantPoints: [],
    importantBenefits: [],
    dislikedPoints: [],
    livelyWorkState: [],
    jobHuntingStartPeriod: '',
    companyInfoSources: [],
    job_satisfaction_moments: [],
    infoSources: [],
    mostHelpfulInfoSource: '',
    snsExposure: '',
    impressiveSnsPost: '',
    weeklyUseSNS: [],
    companiesToWatch: [],
    goodPointsInSelection: '',
    improvementsInSelection: '',
    impressiveRecruitmentPage: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: user?.name || '',
        age: profile.age || '',
        gender: profile.gender || '',
        occupation: profile.occupation || '',
        location: profile.location || ''
      });
    }
  }, [user, profile]);

  // プロフィールアンケートデータの読み込み
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!authUser) return;
      setSurveyLoading(true);
      const { data, error } = await supabase
        .from('monitor_profile_survey')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching existing survey data:', error);
        setSurveyError('既存データの読み込みに失敗しました。');
      } else if (data) {
        setSurveyFormData({
          gender: data.gender || '',
          grade: data.grade || '',
          gradeOther: data.grade_other || '',
          prefecture: data.prefecture || '',
          prefectureOther: data.prefecture_other || '',
          school: data.school || '',
          schoolOther: data.school_other || '',
          faculty: data.faculty || '',
          department: data.department || '',
          interestedIndustries: data.interested_industries || [],
          interestedIndustriesOther: data.interested_industries_other || '',
          interestedOccupations: data.interested_occupations || [],
          interestedOccupationsOther: data.interested_occupations_other || '',
          jobHuntingAreas: data.job_hunting_areas || [],
          importantPoints: data.important_points || [],
          importantBenefits: data.important_benefits || [],
          dislikedPoints: data.disliked_points || [],
          livelyWorkState: data.lively_work_state || [],
          jobHuntingStartPeriod: data.job_hunting_start_period || '',
          companyInfoSources: data.company_info_sources || [],
          job_satisfaction_moments: data.job_satisfaction_moments || [],
          infoSources: data.info_sources || [],
          mostHelpfulInfoSource: data.most_helpful_info_source || '',
          snsExposure: data.sns_exposure || '',
          impressiveSnsPost: data.impressive_sns_post || '',
          weeklyUseSNS: data.weekly_use_sns || [],
          companiesToWatch: data.companies_to_watch || [],
          goodPointsInSelection: data.good_points_in_selection || '',
          improvementsInSelection: data.improvements_in_selection || '',
          impressiveRecruitmentPage: data.impressive_recruitment_page || '',
        });
      }
      setSurveyLoading(false);
    };
    fetchExistingData();
  }, [authUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSurveyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      setSurveyFormData((prev: any) => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter((item: string) => item !== value),
      }));
    } else {
      setSurveyFormData((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }
    setSurveySuccess(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error: userError } = await supabase
        .from('users')
        .update({ name: formData.name })
        .eq('id', user.id);

      if (userError) throw userError;

      const { error: profileError } = await supabase
        .from('monitor_profiles')
        .update({
          age: parseInt(formData.age),
          gender: formData.gender,
          occupation: formData.occupation,
          location: formData.location
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      setIsEditing(false);
      onUpdate();
      alert('プロフィールを更新しました。');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('プロフィールの更新に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      setSurveyError('ユーザー情報がありません。再度ログインしてください。');
      return;
    }
    setSurveyLoading(true);
    setSurveyError(null);
    setSurveySuccess(null);

    try {
      const dataToSave = {
        user_id: authUser.id,
        gender: surveyFormData.gender,
        grade: surveyFormData.grade,
        grade_other: surveyFormData.gradeOther,
        prefecture: surveyFormData.prefecture,
        prefecture_other: surveyFormData.prefectureOther,
        school: surveyFormData.school,
        school_other: surveyFormData.schoolOther,
        faculty: surveyFormData.faculty,
        department: surveyFormData.department,
        interested_industries: surveyFormData.interestedIndustries,
        interested_industries_other: surveyFormData.interestedIndustriesOther,
        interested_occupations: surveyFormData.interestedOccupations,
        interested_occupations_other: surveyFormData.interestedOccupationsOther,
        job_hunting_areas: surveyFormData.jobHuntingAreas,
        important_points: surveyFormData.importantPoints,
        important_benefits: surveyFormData.importantBenefits,
        disliked_points: surveyFormData.dislikedPoints,
        lively_work_state: surveyFormData.livelyWorkState,
        job_hunting_start_period: surveyFormData.jobHuntingStartPeriod,
        company_info_sources: surveyFormData.companyInfoSources,
        job_satisfaction_moments: surveyFormData.job_satisfaction_moments,
        info_sources: surveyFormData.infoSources,
        most_helpful_info_source: surveyFormData.mostHelpfulInfoSource,
        sns_exposure: surveyFormData.snsExposure,
        impressive_sns_post: surveyFormData.impressiveSnsPost,
        weekly_use_sns: surveyFormData.weeklyUseSNS,
        companies_to_watch: surveyFormData.companiesToWatch,
        good_points_in_selection: surveyFormData.goodPointsInSelection,
        improvements_in_selection: surveyFormData.improvementsInSelection,
        impressive_recruitment_page: surveyFormData.impressiveRecruitmentPage,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('monitor_profile_survey')
        .upsert(dataToSave, { onConflict: 'user_id' });

      if (upsertError) throw upsertError;

      setSurveySuccess('プロフィールアンケートを保存しました！');
      onUpdate();
    } catch (err) {
      console.error('Error saving profile survey:', err);
      setSurveyError(err instanceof Error ? err.message : '保存に失敗しました。');
    } finally {
      setSurveyLoading(false);
    }
  };

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
        const isChecked = surveyFormData[name]?.includes(optionValue);
        const isDisabled = !!(maxSelections && surveyFormData[name].length >= maxSelections && !isChecked);

        return (
          <label key={index} className="flex items-center mb-1">
            <input
              type="checkbox"
              name={name}
              value={optionValue}
              checked={isChecked}
              onChange={handleSurveyInputChange}
              disabled={isDisabled}
              className="mr-2"
            />
            <span className="text-xs sm:text-sm">{optionValue}</span>
            {isOther && (
              <input
                type="text"
                name={`${name}Other`}
                value={surveyFormData[`${name}Other`]}
                onChange={handleSurveyInputChange}
                className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="詳細"
                disabled={!isChecked}
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
        const isChecked = surveyFormData[name] === optionValue;

        return (
          <label key={index} className="flex items-center mb-1">
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={isChecked}
              onChange={handleSurveyInputChange}
              className="mr-2"
            />
            <span className="text-xs sm:text-sm">{optionValue}</span>
            {isOther && (
              <input
                type="text"
                name={`${name}Other`}
                value={surveyFormData[`${name}Other`]}
                onChange={handleSurveyInputChange}
                className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="詳細"
                disabled={!isChecked}
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
          value={surveyFormData[name]}
          onChange={handleSurveyInputChange}
          rows={rows}
          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          name={name}
          value={surveyFormData[name]}
          onChange={handleSurveyInputChange}
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
      setSurveySuccess(null);
      setSurveyError(null);
    }
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setActiveSection(sections[currentSectionIndex - 1]);
      setSurveySuccess(null);
      setSurveyError(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-2 sm:p-3 mr-2 sm:mr-4">
              <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-gray-800">プロフィール設定</h2>
              <p className="text-xs sm:text-sm text-gray-600">アカウント情報の確認・編集</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tab Navigation - Always visible */}
        <div className="border-b border-gray-200 px-3 sm:px-6 flex-shrink-0">
          <div className="flex space-x-2 sm:space-x-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              基本情報
            </button>
            <button
              onClick={() => setActiveTab('survey')}
              className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'survey'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              プロフィールアンケート
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'profile' ? (
            <>
              <div className="space-y-2 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    お名前
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">{formData.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">{user?.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      年齢
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="18"
                        max="100"
                      />
                    ) : (
                      <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">{formData.age}歳</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      性別
                    </label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">選択</option>
                        <option value="male">男性</option>
                        <option value="female">女性</option>
                        <option value="other">その他</option>
                      </select>
                    ) : (
                      <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">
                        {formData.gender === 'male' ? '男性' : formData.gender === 'female' ? '女性' : formData.gender === 'other' ? 'その他' : '未設定'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    職業
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="職業を入力"
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">{formData.occupation || '未設定'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    居住地
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="居住地を入力"
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">{formData.location || '未設定'}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 sm:space-x-4 mt-4 sm:mt-6 flex-shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={loading}
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      保存
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onClose}
                      className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      閉じる
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      編集
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {surveyLoading && !surveySuccess && !surveyError && (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 animate-spin mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-600">データを読み込み中...</p>
                </div>
              )}

              {surveyError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2 sm:p-3 rounded-lg text-xs sm:text-sm mb-3 sm:mb-4 flex items-center">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> {surveyError}
                </div>
              )}
              {surveySuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-2 sm:p-3 rounded-lg text-xs sm:text-sm mb-3 sm:mb-4 flex items-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> {surveySuccess}
                </div>
              )}

              {/* Section Navigation */}
              <div className="border-b border-gray-200 mb-4 pb-2">
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

              <form onSubmit={handleSurveySubmit} className="space-y-4 sm:space-y-6">
                {activeSection === 'A' && (
                  <section>
                    <h3 className="text-base sm:text-lg font-bold text-blue-700 mb-3 sm:mb-4">A. 基本情報（分類・フィルタ用）</h3>
                    {renderRadioGroup('Q1. 性別（いずれかを選択）', 'gender', ['男性', '女性', 'その他', '無回答'])}
                    {renderRadioGroup('Q2. 学年（いずれかを選択）', 'grade', ['大学1年', '大学2年', '大学3年', '大学4年', '大学院生', 'その他（　　　　　　　　　　　）'])}
                    {surveyFormData.grade === 'その他' && renderTextInput('その他学年', 'gradeOther', '学年を入力', 1)}
                    {renderRadioGroup('Q3. 出身地（いずれかを選択）', 'prefecture', ['福井県', '福井県外（都道府県名：　　　　　　　　　　　）'])}
                    {surveyFormData.prefecture === '福井県外' && renderTextInput('都道府県名', 'prefectureOther', '都道府県名を入力', 1)}
                    {renderRadioGroup('Q4. 所属学校（いずれかを選択）', 'school', ['福井大学', '福井県立大学', '福井工業大学', '仁愛大学', 'その他（学校名：　　　　　　　　　　　）'])}
                    {surveyFormData.school === 'その他' && renderTextInput('学校名', 'schoolOther', '学校名を入力', 1)}
                    {renderTextInput('Q5. 所属学部・学科 - 学部名', 'faculty', '学部名を入力', 1)}
                    {renderTextInput('Q5. 所属学部・学科 - 学科名', 'department', '学科名を入力', 1)}
                    {renderCheckboxGroup('Q6. 興味のある業界（複数選択可）', 'interestedIndustries', ['メーカー（製造業）', '小売・流通', 'サービス業', 'IT・インターネット', '広告・マスコミ・出版', '金融・保険', '建設・不動産', '医療・福祉', '教育・公務', '物流・運輸', '商社', 'エネルギー・インフラ', 'ベンチャー／スタートアップ', '特に決まっていない／わからない', 'その他（　　　　　　　　　　　）'])}
                    {surveyFormData.interestedIndustries.includes('その他') && renderTextInput('Q6. その他業界', 'interestedIndustriesOther', 'その他の業界名を入力', 1)}
                    {renderCheckboxGroup('Q7. 興味のある職種（複数選択可）', 'interestedOccupations', ['サービス・接客業', '営業・販売職', '事務・オフィスワーク', '製造・技術職', 'IT・クリエイティブ職', '教育・医療・福祉', '物流・運輸業', '公務員・安定志向の職業', '特に決まっていない／わからない', 'その他（　　　　　　　　　　　）'])}
                    {surveyFormData.interestedOccupations.includes('その他') && renderTextInput('Q7. その他職種', 'interestedOccupationsOther', 'その他の職種名を入力', 1)}
                    {renderCheckboxGroup('Q8. 就職希望エリア（複数選択可）', 'jobHuntingAreas', ['福井県内', '地元にUターン（福井以外）', '首都圏（東京・神奈川・千葉・埼玉）', '関西圏（大阪・京都・兵庫）', '特に決めていない'])}
                  </section>
                )}

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

                {activeSection === 'C' && (
                  <section>
                    <h3 className="text-base sm:text-lg font-bold text-blue-700 mb-3 sm:mb-4">C. 働き方に対する価値観</h3>
                    {renderCheckboxGroup('Q15. あなたが「働きがい」を感じるのはどんなときですか？', 'job_satisfaction_moments', ['感謝されたとき', 'チームで成果を出したとき', '自分の意見が活かされたとき', '昇給・評価されたとき', '挑戦ができたとき', '人の役に立ったとき', 'その他（　　　　　　　　　　　）'])}
                  </section>
                )}

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
                    disabled={currentSectionIndex === 0 || surveyLoading}
                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> 前へ
                  </button>

                  {currentSectionIndex < sections.length - 1 ? (
                    <button
                      type="button"
                      onClick={goToNextSection}
                      disabled={surveyLoading}
                      className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      次へ <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      disabled={surveyLoading}
                    >
                      {surveyLoading ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      )}
                      保存する
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
