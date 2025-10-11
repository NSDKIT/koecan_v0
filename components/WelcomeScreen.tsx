// koecan_v0-main/components/WelcomeScreen.tsx

'use client'

import React, { useState } from 'react';
import { Star, Users, Gift, MessageCircle, ArrowRight, Briefcase, Sparkles, UserCheck } from 'lucide-react'; // ★★★ アイコンを追加 ★★★
import { AnimatedBackground } from '@/components/AnimatedBackground';
// import { OneSignalButton } from '@/components/OneSignalButton'; // 削除

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
            {/* ★★★ 修正: 文字サイズを半分に (text-5xl -> text-3xl) ★★★ */}
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500 mb-4">
              声キャン！
            </h1>
          </div>

          {/* ★★★ 修正: グリッドを削除し、内容を新しいリストに置き換える ★★★ */}
          <div className="space-y-4 max-w-md mx-auto mb-12">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              {/* ★★★ 修正: h3タグの内容を削除 ★★★ */}
              <h3 className="text-xl font-semibold text-gray-800 mb-3"></h3>
              
              {/* ★★★ 修正: 新しい箇条書きリストに置き換え ★★★ */}
              <ul className="text-gray-600 space-y-3 text-left">
                <li className="flex items-center">
                  <Sparkles className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                  自分にマッチした企業に出会える
                </li>
                <li className="flex items-center">
                  <UserCheck className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                  就活の専門家に相談できる
                </li>
                <li className="flex items-center">
                  <Briefcase className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                  企業情報GET
                </li>
                <li className="flex items-center">
                  <Gift className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                  それでいて、ポイ活もできる
                </li>
              </ul>
              {/* ★★★ 修正箇所ここまで ★★★ */}
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

            {/* <OneSignalButton /> を削除 */}
          </div>
        </div>
      </div>
    </div>
  );
}
