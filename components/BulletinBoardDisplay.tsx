'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { MessageCircle, Pin, Briefcase, Users, Calendar, Coffee, MessageSquare } from 'lucide-react';

const categoryConfig = {
  '就活': { icon: Briefcase, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  'サークル': { icon: Users, color: 'bg-green-100 text-green-700 border-green-300' },
  '学生イベント': { icon: Calendar, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  'バイト': { icon: Coffee, color: 'bg-orange-100 text-orange-700 border-orange-300' },
  '雑談': { icon: MessageSquare, color: 'bg-gray-100 text-gray-700 border-gray-300' },
};

interface BulletinPost {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  display_order: number;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export function BulletinBoardDisplay() {
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('bulletin_posts')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching bulletin posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    // リアルタイム購読
    const channel = supabase
      .channel('bulletin_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bulletin_posts'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">掲示板</h2>
        <p className="text-gray-600">お知らせや重要な情報をお届けします</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">現在、投稿はありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`bg-white border-2 rounded-xl p-6 ${
                post.is_pinned ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2 mb-3 flex-wrap gap-2">
                {post.is_pinned && (
                  <Pin className="w-5 h-5 text-purple-600" />
                )}
                {post.category && categoryConfig[post.category as keyof typeof categoryConfig] && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
                    categoryConfig[post.category as keyof typeof categoryConfig].color
                  }`}>
                    {React.createElement(categoryConfig[post.category as keyof typeof categoryConfig].icon, { className: 'w-3 h-3' })}
                    <span>{post.category}</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-800">{post.title}</h3>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>
              <div className="text-sm text-gray-500">
                {new Date(post.updated_at).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

