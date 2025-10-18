'use client'

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/config/supabase';
import { MessageCircle, User, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// 型定義
interface ChatRoom {
  id: string;
  name: string;
  created_at: string;
  participants: string[];
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender: {
    name: string | null;
  } | null;
}

interface AdminSupportChatViewerProps {
  onBack: () => void; // 選択画面に戻るための関数
}

export function AdminSupportChatViewer({ onBack }: AdminSupportChatViewerProps) {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // チャットルーム一覧を初回に取得
  useEffect(() => {
    fetchChatRooms();
  }, []);

  // 選択されたルームのメッセージをリアルタイムで購読
  useEffect(() => {
    if (!selectedRoom) return;

    const channel = supabase
      .channel(`admin_chat_room_${selectedRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${selectedRoom.id}`,
        },
        (payload: any) => {
          fetchMessages(selectedRoom.id, false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRoom]);

  // メッセージリストが更新されたら最下部にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChatRooms = async () => {
    setLoadingRooms(true);
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('room_type', 'support')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setChatRooms(data || []);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchMessages = async (roomId: string, showLoading = true) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          sender_id,
          message,
          created_at,
          sender:users(name)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const formattedMessages = data?.map((msg: any) => ({
        ...msg,
        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
      })) || [];
      setMessages(formattedMessages as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room);
    fetchMessages(room.id);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col z-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-purple-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-800">
                サポートチャット閲覧パネル
              </h1>
            </div>
          </div>
           <div className="text-sm text-gray-600">
              管理者: {user?.name || user?.email}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Room List */}
        <div className="w-1/3 border-r bg-white overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">チャットルーム一覧 ({chatRooms.length})</h2>
          </div>
          {loadingRooms ? (
            <div className="p-4 text-center text-gray-500">読み込み中...</div>
          ) : (
            <ul>
              {chatRooms.map(room => (
                <li key={room.id}>
                  <button
                    onClick={() => handleRoomSelect(room)}
                    className={`w-full text-left p-4 border-b hover:bg-gray-50 ${selectedRoom?.id === room.id ? 'bg-blue-50' : ''}`}
                  >
                    <p className="font-semibold text-gray-800 truncate">{room.name || `Room ID: ${room.id.substring(0,8)}`}</p>
                    <p className="text-sm text-gray-500">{new Date(room.created_at).toLocaleDateString('ja-JP')}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Message Viewer */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {!selectedRoom ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>左のリストからチャットを選択してください</p>
            </div>
          ) : loadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div className="p-4 border-b bg-white">
                <h3 className="text-lg font-bold">{selectedRoom.name}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-lg">
                       <div className={`text-xs text-gray-500 mb-1 ${message.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                          {message.sender?.name || '不明なユーザー'}
                      </div>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-800 shadow-sm'
                        }`}
                      >
                        <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.message}</p>
                        <p className={`text-xs mt-1 text-right ${
                          message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                 <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
