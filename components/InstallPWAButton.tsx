// koecan_v0-main/components/InstallPWAButton.tsx (新規作成)

'use client'

import React, { useState, useEffect } from 'react';
import { Download, CheckCircle } from 'lucide-react';

// A2HSイベントを保存するためのグローバル変数
let deferredPrompt: any;

export function InstallPWAButton() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // インストール状態をチェックするロジック (簡易版)
  useEffect(() => {
    // navigator.standalone (iOS) または display-mode (Android PWA) をチェック
    const checkInstalled = () => {
      if (
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        (navigator as any).standalone
      ) {
        setIsInstalled(true);
      }
    };
    checkInstalled();
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    return () => window.removeEventListener('appinstalled', () => setIsInstalled(true));
  }, []);

  // ブラウザのネイティブプロンプトを捕捉するロジック
  useEffect(() => {
    if (isInstalled) return;

    const handler = (e: any) => {
      // Chromeが自動的にプロンプトを表示するのを防ぐ
      e.preventDefault(); 
      // イベントを保存
      deferredPrompt = e; 
      // インストールボタンを表示
      setShowInstallPrompt(true); 
      console.log('A2HS prompt captured.');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isInstalled]);


  const handleInstallClick = async () => {
    if (!deferredPrompt) {
        alert('ホーム画面への追加機能は、ブラウザがサポートしている場合にのみ利用可能です。');
        return;
    }
    
    setShowInstallPrompt(false);
    
    // 保存したネイティブプロンプトを起動
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
      <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-full text-sm font-medium">
        <CheckCircle className="w-4 h-4 mr-2" />
        アプリとしてインストール済み
      </div>
    );
  }

  if (!showInstallPrompt) {
    return (
      <p className="text-xs text-gray-500">
        （この機能は、お使いのブラウザがサポートする時期に表示されます）
      </p>
    );
  }

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
