// koecan_v0-main/components/OneSignalButton.tsx

'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react'; 

export const OneSignalButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true); 
  const [message, setMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null); 
  // oneSignalReady は isNotificationsReady が true になるまで待つために使用
  const [oneSignalReady, setOneSignalReady] = useState(false); 
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  // Service Worker 登録試行後に OneSignal SDK が初期化を完了したことを示すフラグ
  const initializedFlag = useRef(false);

  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Service Worker 登録後の OneSignal Notifications API の可用性をチェック
  const isNotificationsReady = useCallback(() => {
    const OneSignal = (window as any).OneSignal;
    return (
        OneSignal && 
        OneSignal.Notifications && 
        typeof OneSignal.Notifications.getPermission === 'function'
    );
  }, []);

  // OneSignal SDKの状態をチェックし、UIを更新する関数 (Service Worker Ready 後に実行されるべき)
  const checkOneSignalStatus = useCallback(async () => {
    if (initializedFlag.current) return true; // 二重実行防止

    if (!isNotificationsReady()) {
        addDebugInfo('Error: Notifications API is not ready after SW registration.');
        setIsLoading(false);
        setIsSubscribed(false);
        return false;
    }

    const OneSignal = (window as any).OneSignal;
    addDebugInfo('OneSignal SDK fully ready. Starting final check.');
    setOneSignalReady(true);
    initializedFlag.current = true; // 初期化完了フラグをセット
    
    try {
        // 1. 初期状態の確認 (v16 API)
        const permission = await OneSignal.Notifications.getPermission();
        const isEnabled = permission === 'granted';
        setIsSubscribed(isEnabled);
        
        addDebugInfo(`Initial permission status: ${permission}`);
        
        if (isEnabled) {
            OneSignal.User.getPushSubscriptionId().then((userId: string) => {
                addDebugInfo(`OneSignal User ID: ${userId}`);
            });
        }

        // 2. 購読状態変更のイベントリスナーを設定 (v16 API)
        OneSignal.Notifications.addEventListener('permissionChange', (isGranted: boolean) => {
          setIsSubscribed(isGranted);
          addDebugInfo(`Permission changed to: ${isGranted ? 'Granted' : 'Denied'}`);
        });

    } catch (error) {
         console.error("Error in OneSignal initial check:", error);
         addDebugInfo(`Error in initial check: ${error}`);
         setIsSubscribed(false);
         setMessage('⚠️ 初期状態の確認中にエラーが発生しました。');
    } finally {
         setIsLoading(false); // 初期チェック完了
    }
    return true; 
  }, [isNotificationsReady, addDebugInfo]);


  useEffect(() => {
    addDebugInfo('Component mounted');
    
    // 環境チェック
    addDebugInfo(`HTTPS: ${window.location.protocol === 'https:'}`);
    addDebugInfo(`Notification API: ${'Notification' in window}`);
    addDebugInfo(`Service Worker: ${'serviceWorker' in navigator}`);
    
    (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];

    // Service Worker がアクティブになるのを待ち、成功したら初期化完了とみなす
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            // Service Worker が ready になったら、OneSignalDeferred.push を待たずに直接チェック
            // ただし、getPermission が ready でない可能性も考慮し、isNotificationsReady で再チェック
            if (!initializedFlag.current) {
                checkOneSignalStatus(); 
            }
        }).catch(error => {
            addDebugInfo(`Service Worker Ready check FAILED: ${error}`);
            setIsLoading(false);
            setIsSubscribed(false);
            setMessage('❌ Service Workerの登録に失敗しました。');
        });
    }

    // タイムアウトロジック: Service Worker Ready も含め、初期化が15秒で完了しない場合
    const timeout = setTimeout(() => {
        if (!initializedFlag.current) {
            addDebugInfo('OneSignal init timed out (15s). Exiting loop.');
            setIsLoading(false);
            setIsSubscribed(false);
            setMessage('❌ 通知機能の初期化に失敗しました。時間をおいて再試行してください。');
        }
    }, 15000); 

    return () => {
        clearTimeout(timeout);
    };

  }, [checkOneSignalStatus, addDebugInfo]);


  const handleSubscribe = async () => {
    addDebugInfo('Subscribe button clicked');
    setIsLoading(true);
    setMessage('');
    
    try {
      if (!('Notification' in window) || !oneSignalReady) {
          setMessage('❌ 通知機能が利用できないか、初期化が完了していません。');
          setIsLoading(false);
          return;
      }

      (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
        addDebugInfo('Inside OneSignalDeferred.push for subscription');

        // requestPermission() はプロンプトを表示し、ユーザーの許可を待つ (v16 API)
        const result = await OneSignal.Notifications.requestPermission();
        
        if (result) {
           setMessage('✅ プッシュ通知が有効になりました！OneSignalに登録されました。');
           OneSignal.User.getPushSubscriptionId().then((userId: string) => {
               addDebugInfo(`OneSignal User ID after subscription: ${userId}`);
           });
        } else {
           setMessage('⚠️ 購読に失敗しました。ブラウザ設定を確認してください。');
        }
        
        // 最終的な状態を再確認し、UIを更新
        const finalPermission = await OneSignal.Notifications.getPermission();
        setIsSubscribed(finalPermission === 'granted');
        setIsLoading(false);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDebugInfo(`Subscribe error: ${errorMessage}`);
      setMessage('❌ プッシュ通知の設定に失敗しました。');
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = () => {
    addDebugInfo('Unsubscribe button clicked');
    setIsLoading(true);

    if (oneSignalReady) {
      (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
        try {
            // falseを渡して購読解除をリクエスト
            await OneSignal.Notifications.requestPermission(false); 
            setIsSubscribed(false);
            setMessage('🔕 プッシュ通知を無効にしました。');
            addDebugInfo('Unsubscribed successfully');
        } catch (error) {
            console.error("Error unsubscribing:", error);
            setMessage('❌ 通知の無効化に失敗しました。');
        } finally {
            setIsLoading(false);
        }
      });
    } else {
        setIsLoading(false);
    }
  };

  const handleTestBrowserNotification = async () => {
    addDebugInfo('Testing browser notification');
    try {
      const permission = await Notification.requestPermission();
      addDebugInfo(`Browser permission: ${permission}`);
      
      if (permission === 'granted') {
        new Notification('テスト通知', {
          body: 'ブラウザの通知機能は正常に動作しています。',
          icon: '/icon-192x192.png'
        });
        addDebugInfo('Test notification sent');
      }
    } catch (error) {
      addDebugInfo(`Browser notification error: ${error}`);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  // isSubscribed が null の間はローディング表示
  if (isSubscribed === null) {
      return (
          <div className="flex items-center justify-center space-y-4 p-6 bg-white rounded-lg shadow-lg">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
              <p className="text-gray-600">通知状態を確認中...</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800">プッシュ通知設定</h3>
      <p className="text-sm text-gray-600 text-center">
        重要なお知らせやアンケートの通知を受け取るために、プッシュ通知を有効にしてください。
      </p>
      
      {!oneSignalReady && (
        <div className="text-yellow-600 text-sm">OneSignalを読み込み中...</div>
      )}
      
      {isSubscribed === false ? (
        <button
          onClick={handleSubscribe}
          disabled={isLoading || !oneSignalReady}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {isLoading ? '設定中...' : 'プッシュ通知を許可する'}
        </button>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <div className="text-green-600 font-semibold">✅ プッシュ通知が有効です</div>
          <button
            onClick={handleUnsubscribe}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            通知を無効にする
          </button>
        </div>
      )}
      
      {message && (
        <div className="text-sm text-center max-w-xs whitespace-pre-line bg-gray-50 p-3 rounded-lg">
          {message}
        </div>
      )}
      
      {/* デバッグセクション */}
      <div className="w-full max-w-md border-t pt-4">
        <h4 className="text-sm font-semibold mb-2">デバッグ情報</h4>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={handleTestBrowserNotification}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
          >
            ブラウザ通知テスト
          </button>
          <button
            onClick={clearDebugInfo}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
          >
            ログクリア
          </button>
        </div>
        
        <div className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-y-auto">
          {debugInfo.length === 0 ? (
            <div className="text-gray-500">デバッグ情報はここに表示されます</div>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index} className="mb-1">{info}</div>
            ))
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center max-w-xs">
        <p>📱 <strong>携帯端末をご利用の場合：</strong></p>
        <p>• <strong>Android:</strong> Chrome、Firefox、Edgeをご使用ください</p>
        <p>• <strong>iPhone:</strong> Safariでホーム画面に追加後、PWAとして起動してください</p>
      </div>
    </div>
  );
};
