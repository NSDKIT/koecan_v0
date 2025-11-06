// koecan_v0-main/components/InstallPWAButton.tsx

'use client'

import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';

// A2HSイベントを保存するためのグローバル変数
let deferredPrompt: any;

export function InstallPWAButton() {
  const [showButton, setShowButton] = useState(false); // ボタンの常時表示を制御
  const [isInstalled, setIsInstalled] = useState(false);
  
  // インストール状態をチェックするロジック
  useEffect(() => {
    // 既にインストールされているかをチェック
    const checkInstalled = () => {
      if (
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        (navigator as any).standalone
      ) {
        setIsInstalled(true);
      }
      setShowButton(true); // 常にボタンを表示する
    };
    
    // ブラウザのネイティブプロンプトを捕捉するロジック
    const handler = (e: any) => {
      e.preventDefault(); 
      deferredPrompt = e; 
      // イベントが発火したことをログに残す
      console.log('A2HS native prompt captured.');
    };

    checkInstalled();
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', () => setIsInstalled(true));
    };
  }, []);


  const handleInstallClick = async () => {
    if (!deferredPrompt) {
        alert('現在、お使いのブラウザでは自動的なホーム画面追加機能が利用できません。\n\nブラウザのメニューから「ホーム画面に追加」をタップしてください。');
        return;
    }
    
    // ネイティブプロンプトを起動
    deferredPrompt.prompt(); 
    
    // ユーザーの選択を待つ
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    deferredPrompt = null;
  };

  if (isInstalled) {
    return (
      <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-xl text-sm font-semibold justify-center shadow-lg">
        <CheckCircle className="w-4 h-4 mr-2" />
        アプリとしてインストール済み
      </div>
    );
  }

  // ボタンを常に表示するが、deferredPromptがない場合はクリック時の処理を変える
  return (
    <button
      onClick={handleInstallClick}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center shadow-lg"
    >
      <Download className="w-5 h-5 mr-2" />
      ホーム画面にアプリを追加
    </button>
  );
}
