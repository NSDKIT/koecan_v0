'use client'

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, User } from 'lucide-react';
import { supabase } from '@/config/supabase';

interface ChatModalProps {
  user: any; // ログイン中のユーザー（モニターまたはサポート担当者）
  otherUserId: string; // チャット相手のユーザーID
  onClose: () => void;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
}

export function ChatModal({ user, otherUserId, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsubscribe: () => void;
    if (user && user.id && otherUserId) {
      // ChatModalがマウントされるたびに新しいチャットを初期化し、クリーンアップ関数を返す
      const setupChat = async () => {
        unsubscribe = await initializeChat();
      };
      setupChat();
    } else {
      setLoading(false);
      console.warn('ChatModal: User, user.id, or otherUserId is not available/configured. Cannot initialize chat.');
    }
    return () => {
      // コンポーネントがアンマウントされるときに購読を解除
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, user.id, otherUserId]); // userとotherUserIdが変更されたら再実行

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async (): Promise<() => void> => {
    console.log('ChatModal: Initializing chat between user:', user.id, 'and otherUser:', otherUserId);
    setLoading(true); 
    setError(null); // エラーをリセット
    setRoomId(null); // ルームIDをリセットして再設定に備える

    try {
      if (!user.id || !otherUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(otherUserId)) {
          console.error('ChatModal: Invalid user ID or otherUserId provided.');
          setError('チャット初期化エラー: ユーザーIDまたは相手のユーザーIDが不正です。');
          setLoading(false);
          return () => {}; // クリーンアップ関数を返す
      }

      const participantsArray = [user.id, otherUserId].sort(); // ソートして一貫性を保つ

      let { data: existingRoom, error: fetchRoomError } = await supabase
        .from('chat_rooms')
        .select('id, name') // nameも取得
        .eq('room_type', 'support') // 'support'ルームに限定
        .contains('participants', participantsArray) // 両者が参加しているルーム
        .single();

      if (fetchRoomError && fetchRoomError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('ChatModal: Error fetching existing room:', fetchRoomError);
        throw fetchRoomError;
      }
      
      let currentRoomId = existingRoom?.id;
      console.log('ChatModal: Existing room found:', currentRoomId);

      if (!currentRoomId) {
        console.log('ChatModal: No existing room found, creating new one...');
        // チャットルームの名前は相手のユーザー名で設定
        const { data: otherUserData, error: otherUserError } = await supabase
            .from('users')
            .select('name')
            .eq('id', otherUserId)
            .single();
        if (otherUserError) {
            console.error('ChatModal: Error fetching other user name:', otherUserError);
        }
        const otherUserName = otherUserData?.name || 'Unknown User';
        const roomName = `${otherUserName}とのチャット`;

        const { data: newRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .insert([
            {
              name: roomName,
              room_type: 'support',
              participants: participantsArray,
              created_by: user.id 
            }
          ])
          .select('id')
          .single();

        if (roomError) {
          console.error('ChatModal: Error creating new room:', roomError);
          throw roomError;
        }
        currentRoomId = newRoom.id;
        console.log('ChatModal: New room created with ID:', currentRoomId);
      }

      setRoomId(currentRoomId);
      await fetchMessages(currentRoomId);

      // リアルタイム購読の設定
      const channelName = `chat_room_${currentRoomId}_${user.id}`; // ユーザーごとに一意なチャンネル名
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${currentRoomId}`,
          },
          async (payload) => {
            console.log('ChatModal: Realtime message received:', payload);
            const newMessageData = payload.new as Message;
            // 送信者名をフェッチ
            const { data: senderData, error: senderError } = await supabase
                .from('users')
                .select('name')
                .eq('id', newMessageData.sender_id)
                .single();

            if (senderError) {
                console.error('ChatModal: Error fetching sender name in realtime:', senderError);
            }
            const senderName = senderData?.name || 'Unknown';

            setMessages((prevMessages) => [
              ...prevMessages,
              { ...newMessageData, sender_name: senderName }
            ]);
            scrollToBottom();
          }
        )
        .subscribe();

      setLoading(false);
      console.log('ChatModal: Initialization finished, loading set to false.');

      // クリーンアップ関数を返す
      return () => {
        console.log('ChatModal: Unsubscribing from channel:', channelName);
        supabase.removeChannel(channel);
      };

    } catch (error: any) {
      console.error('ChatModal: Error initializing chat:', error);
      setError(`チャットの初期化に失敗しました: ${error.message || String(error)}`);
      setLoading(false);
      return () => {}; // クリーンアップ関数を返す
    }
  };

  const fetchMessages = async (roomId: string) => {
    console.log('ChatModal: Fetching messages for room:', roomId);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          sender_id,
          message,
          created_at,
          users:sender_id (name)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithNames = data.map(msg => ({
        ...msg,
        sender_name: (msg.users as any)?.name || 'Unknown'
      }));

      setMessages(messagesWithNames);
      console.log('ChatModal: Messages fetched:', messagesWithNames.length);
    } catch (error) {
      console.error('ChatModal: Error fetching messages:', error);
      setError(`メッセージの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId || sending) return;

    setSending(true);
    console.log('ChatModal: Sending message:', newMessage);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([
          {
            room_id: roomId,
            sender_id: user.id,
            message: newMessage.trim()
          }
        ]);

      if (error) throw error;

      setNewMessage('');
      console.log('ChatModal: Message sent successfully.');
    } catch (error) {
      console.error('ChatModal: Error sending message:', error);
      setError(`メッセージの送信に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
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
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 mr-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">サポートチャット</h2>
              <p className="text-gray-600">お困りのことがあればお気軽にご相談ください</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && ( // エラー表示
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
              <h3 className="text-lg font-medium text-gray-800 mb-2">チャットを開始しましょう</h3>
              <p className="text-gray-600">何かご質問やお困りのことがあれば、お気軽にメッセージをお送りください。</p>
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
                  <p className={`text-xs mt-1 ${
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

        {/* Message Input */}
        <div className="border-t border-gray-200 p-6">
          <form onSubmit={sendMessage} className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending || !!error} // エラーがある場合も無効化
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || !!error} // エラーがある場合も無効化
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
      </div>
    </div>
  );
}
