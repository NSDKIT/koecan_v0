'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { MessageCircle, Briefcase, Users, Calendar, Coffee, MessageSquare } from 'lucide-react';

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

const categoryConfig = {
  '就活': { icon: Briefcase, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  'サークル': { icon: Users, color: 'bg-green-100 text-green-700 border-green-300' },
  '学生イベント': { icon: Calendar, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  'バイト': { icon: Coffee, color: 'bg-orange-100 text-orange-700 border-orange-300' },
  '雑談': { icon: MessageSquare, color: 'bg-gray-100 text-gray-700 border-gray-300' },
};

export function HomeBulletinBoardPosts() {
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // 直近1週間の投稿を取得
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const { data, error } = await supabase
          .from('bulletin_posts')
          .select('*')
          .gte('created_at', oneWeekAgo.toISOString())
          .order('is_pinned', { ascending: false })
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false })
          .limit(5);

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
      .channel('home_bulletin_posts_changes')
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
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>直近1週間の投稿はありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const categoryInfo = post.category ? categoryConfig[post.category as keyof typeof categoryConfig] : null;
        const CategoryIcon = categoryInfo?.icon || MessageCircle;
        
        return (
          <div
            key={post.id}
            className={`bg-white border-2 rounded-xl p-4 ${
              post.is_pinned ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {post.category && categoryInfo && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${categoryInfo.color} flex-shrink-0`}>
                    <CategoryIcon className="w-3 h-3" />
                    <span>{post.category}</span>
                  </div>
                )}
                <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate">{post.title}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.content}</p>
            <div className="text-xs text-gray-500">
              {new Date(post.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

