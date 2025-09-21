'use client'

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, User, Eye } from 'lucide-react';
import { supabase } from '@/config/supabase';

interface ChatModalProps {
  user: any; // ログイン中のユーザー
  otherUserId?: string; // チャット相手のユーザーID (閲覧モードでは不要なためオプショナルに)
  onClose: () => void;
  readOnly?: boolean; // 閲覧モードかどうかを判定するprop
  roomIdOverride?: string; // 管理者が特定のルームIDを直接指定するためのprop
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
}

export function ChatModal({ user, otherUserId, onClose, readOnly = false, roomIdOverride }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    // roomIdOverrideが指定されているか、有効なユーザーIDペアがある場合に初期化
    if (roomIdOverride || (user && user.id && otherUserId)) {
      const setupChat = async () => {
        unsubscribe = await initializeChat();
      };
      setupChat();
    } else {
      setLoading(false);
      setError('チャットの初期化に必要なユーザー情報が不足しています。');
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, user.id, otherUserId, roomIdOverride]);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async (): Promise<() => void> => {
    setLoading(true);
    setError(null);
    setRoomId(null);
    
    try {
      let currentRoomId: string | undefined;

      // roomIdOverrideが最優先
      if (roomIdOverride) {
        currentRoomId = roomIdOverride;
        console.log(`ChatModal: Initializing with roomIdOverride: ${currentRoomId}`);
      } else if (user?.id && otherUserId) {
        console.log(`ChatModal: Initializing chat between user: ${user.id} and otherUser: ${otherUserId}`);
        const participantsArray = [user.id, otherUserId].sort();
        let { data: existingRoom, error: fetchRoomError } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('room_type', 'support')
          .contains('participants', participantsArray)
          .single();
        
        if (fetchRoomError && fetchRoomError.code !== 'PGRST116') throw fetchRoomError;

        if (existingRoom) {
          currentRoomId = existingRoom.id;
        } else if (!readOnly) { // 閲覧モードではルームを新規作成しない
           const { data: newRoom, error: createError } = await supabase
            .from('chat_rooms')
            .insert({ participants: participantsArray, room_type: 'support', created_by: user.id })
            .select('id')
            .single();
          if (createError) throw createError;
          currentRoomId = newRoom.id;
        }
      }

      if (!currentRoomId) {
        throw new Error('チャットルームを特定できませんでした。');
      }

      setRoomId(currentRoomId);
      await fetchMessages(currentRoomId);

      // リアルタイム購読の設定
      const channel = supabase
        .channel(`chat_room_${currentRoomId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${currentRoomId}` },
          (payload) => {
            const newMessage = payload.new as Message;
            // 自分のメッセージは即時反映されるため、相手のメッセージのみ追加
            if (newMessage.sender_id !== user.id) {
                 setMessages((prev) => [...prev, newMessage]);
            }
          }
        )
        .subscribe();
      
      setLoading(false);
      return () => supabase.removeChannel(channel);

    } catch (error: any) {
      setError(`チャットの初期化に失敗しました: ${error.message}`);
      setLoading(false);
      return () => {};
    }
  };

  const fetchMessages = async (currentRoomId: string) => {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('id, sender_id, message, created_at')
            .eq('room_id', currentRoomId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        setMessages(data || []);
    } catch (error) {
        console.error('Error fetching messages:', error);
        setError('メッセージの取得に失敗しました。');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId || sending || readOnly) return;

    setSending(true);
    
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      message: newMessage.trim(),
      created_at: new Date().toISOString()
    };
    
    // UIに即時反映
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{ room_id: roomId, sender_id: user.id, message: tempMessage.message }]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('メッセージの送信に失敗しました。');
      // 送信失敗したメッセージをUIから削除
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
        });
    };

    const getSenderDisplayName = (senderId: string, senderName?: string) => {
        if (senderId === user.id) {
            return 'あなた';
        }
        return senderName || '相手';
    };

    if (loading) {
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">チャットを準備中...</p>
            </div>
          </div>
        );
    }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`rounded-full p-3 mr-4 ${readOnly ? 'bg-gray-500' : 'bg-gradient-to-br from-green-500 to-green-600'}`}>
              {readOnly ? <Eye className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{readOnly ? 'チャット閲覧' : 'サポートチャット'}</h2>
              <p className="text-gray-600">{readOnly ? '送受信されたメッセージを確認しています' : 'お困りのことがあればお気軽にご相談ください'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
                <div className="text-center py-8 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-semibold mb-2">エラーが発生しました</p>
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}
            {!error && messages.length === 0 ? (
                <div className="text-center py-8">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">まだメッセージはありません</h3>
                <p className="text-gray-600">
                    {readOnly ? 'このチャットにはまだメッセージがありません。' : '何かご質問やお困りのことがあれば、お気軽にメッセージをお送りください。'}
                </p>
                </div>
            ) : (
                messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === user.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                    >
                    <div className="flex items-center mb-1">
                        <User className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">{getSenderDisplayName(message.sender_id, message.sender_name)}</span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 text-right ${
                        message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                        {formatTime(message.created_at)}
                    </p>
                    </div>
                </div>
                ))
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Message Input - readOnlyがfalseの場合のみ表示 */}
        {!readOnly && (
          <div className="border-t border-gray-200 p-6">
            <form onSubmit={sendMessage} className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending || !!error}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending || !!error}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
