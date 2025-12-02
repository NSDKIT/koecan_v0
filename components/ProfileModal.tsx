'use client'

import React, { useState, useEffect } from 'react';
import { X, User, Save, Edit } from 'lucide-react';
import { supabase } from '@/config/supabase';
import { MonitorProfileSurveyModal } from './MonitorProfileSurveyModal';

interface ProfileModalProps {
  user: any;
  profile: any;
  onClose: () => void;
  onUpdate: () => void;
}

type ActiveTab = 'profile' | 'survey';

export function ProfileModal({ user, profile, onClose, onUpdate }: ProfileModalProps) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update user name
      const { error: userError } = await supabase
        .from('users')
        .update({ name: formData.name })
        .eq('id', user.id);

      if (userError) throw userError;

      // Update monitor profile
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

  // プロフィールアンケートタブの場合は、MonitorProfileSurveyModalを表示
  if (activeTab === 'survey') {
    return (
      <MonitorProfileSurveyModal
        onClose={() => {
          setActiveTab('profile');
          onClose();
        }}
        onSaveSuccess={() => {
          onUpdate();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-w-[448px] my-auto max-h-[95vh] flex flex-col">
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

        {/* Tab Navigation */}
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
                activeTab !== 'profile'
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
        </div>
      </div>
    </div>
  );
}