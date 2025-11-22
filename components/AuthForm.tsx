// koecan_v0-main/components/AuthForm.tsx

'use client'

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/config/supabase';
import { supabase } from '@/config/supabase';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Building, MapPin } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';

interface AuthFormProps {
  onBack: () => void;
}

export function AuthForm({ onBack }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  // ★★★ 修正箇所: role を 'monitor' に固定 ★★★
  const [role, setRole] = useState<'monitor' | 'client'>('monitor'); 
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-specific fields (未使用になるが、コードの整合性のため残す)
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');

  // Monitor-specific fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Supabaseが設定されていません');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          console.error('ログインエラー:', error);
          throw error;
        }
        // ログイン成功時は、useAuthフックが認証状態の変化を検知してユーザー情報を取得する
        // onAuthStateChangeのSIGNED_INイベントが発火して、ユーザー情報が設定される
        console.log('ログイン成功:', data.user?.id);
        // AuthFormのローディングは解除しない（useAuthがSIGNED_INイベントを処理するまで待つ）
        // useAuthのonAuthStateChangeがSIGNED_INイベントを処理して、ユーザー情報を設定すると、
        // page.tsxでuserが設定され、AuthFormが非表示になる
        return; // ログイン成功時はここで終了（finallyブロックをスキップ）
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          // Create user profile (roleは 'monitor' に固定)
          const { error: userError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                email,
                name,
                role: 'monitor', // ★★★ 修正: role を 'monitor' に固定して挿入 ★★★
              },
            ]);

          if (userError) {
             console.error('Profile creation failed:', userError);
             setError(`ユーザープロファイル作成に失敗しました: ${userError.message}`);
             setLoading(false);
             await supabase.auth.signOut();
             return; 
          }

          // Create role-specific profile
          // ★★★ 修正: 'client' の処理を削除 ★★★
          // ★★★ 'monitor' の処理のみ実行 ★★★
          if (role === 'monitor') { // role の state は削除されたが、ここでは 'monitor' として処理
            const { error: monitorError } = await supabase
              .from('monitor_profiles')
              .insert([
                {
                  user_id: data.user.id,
                  age: parseInt(age),
                  gender,
                  occupation,
                  location,
                },
              ]);
            if (monitorError) {
                console.error('Monitor profile creation failed:', monitorError);
                setError(`モニター情報作成に失敗しました: ${monitorError.message}`);
                setLoading(false);
                await supabase.auth.signOut();
                return;
            }
          }
          // 新規登録成功時も、useAuthフックが認証状態の変化を検知してユーザー情報を取得する
          console.log('新規登録成功:', data.user.id);
        }
        // 新規登録成功時も、useAuthがSIGNED_INイベントを処理するまで待つ
        return; // 新規登録成功時もここで終了（finallyブロックをスキップ）
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full border border-orange-100 relative z-20">
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-gray-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500 mb-2">
            {isLogin ? 'ログイン' : '新規登録'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'アカウントにログインしてください' : 'アカウントを作成してください'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="パスワードを入力"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  お名前
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="お名前を入力"
                    required
                  />
                </div>
              </div>

              {/* ★★★ 修正箇所: 役割選択を非表示/削除し、モニター（学生）に固定 ★★★ */}
              <div className="hidden">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  役割 (固定: モニター)
                </label>
                {/* 役割選択ロジックを削除 */}
              </div>
              {/* ★★★ 修正箇所ここまで ★★★ */}

              {/* ★★★ 修正箇所: クライアント固有のフォームを削除 ★★★ */}
              {/* {role === 'client' && ( ... )} を削除 */}
              {/* ★★★ 修正箇所ここまで ★★★ */}

              {/* ★★★ 修正箇所: モニター固有のフォームのみ残す ★★★ */}
              {/* role === 'monitor' は常に true なので条件判定を削除 */}
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        年齢
                      </label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="年齢"
                        min="18"
                        max="100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        性別
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      >
                        <option value="">選択</option>
                        <option value="male">男性</option>
                        <option value="female">女性</option>
                        <option value="other">その他</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      職業
                    </label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="職業を入力"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      居住地
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="居住地を入力"
                      />
                    </div>
                  </div>
                </>
              {/* ★★★ 修正箇所ここまで ★★★ */}
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? '処理中...' : isLogin ? 'ログイン' : '登録'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
          >
            {isLogin ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方はこちら'}
          </button>
        </div>
      </div>
    </div>
  );
}
