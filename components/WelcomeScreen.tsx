'use client'

import React from 'react';
import { Star, Users, Gift, MessageCircle, ArrowRight } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { OneSignalButton } from '@/components/OneSignalButton';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="max-w-4xl mx-auto text-center relative z-20">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-orange-100">
          <div className="mb-8">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500 mb-4">
              声キャン！
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              セルフサービス型アンケートツール
            </p>
            <p className="text-lg text-gray-500">
              ポイ活しながら、キャリア相談ができる！
            </p>
            <p className="text-lg text-gray-500">
              あなたの声が未来を作る、新しいプラットフォーム
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">モニター（学生）</h3>
              <ul className="text-gray-600 space-y-2 text-left">
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                  アンケートに回答してポイント獲得
                </li>
                <li className="flex items-center">
                  <Gift className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                  ポイントを商品券に交換
                </li>
                <li className="flex items-center">
                  <MessageCircle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                  専門カウンセラーにキャリア相談
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">クライアント（企業）</h3>
              <ul className="text-gray-600 space-y-2 text-left">
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  簡単にアンケートを作成・配信
                </li>
                <li className="flex items-center">
                  <Users className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  学生の生の声を収集
                </li>
                <li className="flex items-center">
                  <MessageCircle className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  リアルタイムで結果を確認
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center mx-auto"
            >
              はじめる
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            
            <p className="text-sm text-gray-500 mb-6">
              無料でアカウントを作成して、今すぐ始めましょう
            </p>

            <OneSignalButton />
          </div>
        </div>
      </div>
    </div>
  );
}