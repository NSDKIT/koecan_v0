'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, Pin, Briefcase, Users, Calendar, Coffee, MessageSquare, Heart, Bookmark, X, Send, ArrowRight } from 'lucide-react';

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

interface BulletinPostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface BulletinBoardDisplayProps {
  initialPostId?: string | null;
  onPostClick?: (postId: string) => void;
}

export function BulletinBoardDisplay({ initialPostId, onPostClick }: BulletinBoardDisplayProps = {}) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BulletinPost | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, BulletinPostComment[]>>({});
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

  // いいね・保存の状態を取得
  const fetchLikesAndSaves = async () => {
    if (!user?.id) return;
    
    try {
      const [likesResponse, savesResponse] = await Promise.all([
        supabase
          .from('bulletin_post_likes')
          .select('post_id')
          .eq('user_id', user.id),
        supabase
          .from('bulletin_post_saves')
          .select('post_id')
          .eq('user_id', user.id)
      ]);

      if (likesResponse.error) throw likesResponse.error;
      if (savesResponse.error) throw savesResponse.error;

      setLikedPostIds(new Set((likesResponse.data || []).map((l: { post_id: string }) => l.post_id)));
      setSavedPostIds(new Set((savesResponse.data || []).map((s: { post_id: string }) => s.post_id)));
    } catch (error) {
      console.error('Error fetching likes and saves:', error);
    }
  };

  // コメントを取得
  const fetchComments = async (postId: string) => {
    if (loadingComments[postId]) return;
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const { data, error } = await supabase
        .from('bulletin_post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

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
    fetchLikesAndSaves();

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
  }, [user?.id]);

  // 初期投稿IDが設定されている場合、その投稿を選択
  useEffect(() => {
    if (initialPostId && posts.length > 0 && !selectedPost) {
      const post = posts.find(p => p.id === initialPostId);
      if (post) {
        setSelectedPost(post);
      }
    }
  }, [initialPostId, posts, selectedPost]);

  // 投稿が選択されたらコメントを取得
  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id);
    }
  }, [selectedPost]);

  // いいねのトグル
  const toggleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;

    try {
      const isLiked = likedPostIds.has(postId);
      
      if (isLiked) {
        const { error } = await supabase
          .from('bulletin_post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (error) throw error;
        setLikedPostIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('bulletin_post_likes')
          .insert([{ user_id: user.id, post_id: postId }]);

        if (error) throw error;
        setLikedPostIds(prev => new Set(prev).add(postId));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('いいねの更新に失敗しました。');
    }
  };

  // 保存のトグル
  const toggleSave = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;

    try {
      const isSaved = savedPostIds.has(postId);
      
      if (isSaved) {
        const { error } = await supabase
          .from('bulletin_post_saves')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (error) throw error;
        setSavedPostIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('bulletin_post_saves')
          .insert([{ user_id: user.id, post_id: postId }]);

        if (error) throw error;
        setSavedPostIds(prev => new Set(prev).add(postId));
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      alert('保存の更新に失敗しました。');
    }
  };

  // コメントを投稿
  const handleCommentSubmit = async (postId: string) => {
    if (!user?.id || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('bulletin_post_comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        }]);

      if (error) throw error;
      setNewComment('');
      fetchComments(postId);
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('コメントの投稿に失敗しました。');
    }
  };

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

  // 詳細ページ表示
  if (selectedPost) {
    const postComments = comments[selectedPost.id] || [];
    const categoryInfo = selectedPost.category ? categoryConfig[selectedPost.category as keyof typeof categoryConfig] : null;
    const CategoryIcon = categoryInfo?.icon || MessageCircle;

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-8">
        <button
          onClick={() => setSelectedPost(null)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <X className="w-5 h-5 mr-2" />
          戻る
        </button>

        <div className="bg-white border-2 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4 flex-wrap gap-2">
            {selectedPost.is_pinned && (
              <Pin className="w-5 h-5 text-purple-600" />
            )}
            {selectedPost.category && categoryInfo && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${categoryInfo.color}`}>
                {React.createElement(CategoryIcon, { className: 'w-3 h-3' })}
                <span>{selectedPost.category}</span>
              </div>
            )}
            <h2 className="text-2xl font-bold text-gray-800">{selectedPost.title}</h2>
          </div>

          <div className="text-sm text-gray-500 mb-6">
            {new Date(selectedPost.created_at).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>

          <div className="text-gray-700 whitespace-pre-wrap mb-6">{selectedPost.content}</div>

          {/* いいね・保存ボタン */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <button
              onClick={(e) => toggleLike(selectedPost.id, e)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                likedPostIds.has(selectedPost.id)
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${likedPostIds.has(selectedPost.id) ? 'fill-current' : ''}`} />
              <span className="font-semibold">いいね</span>
            </button>
            <button
              onClick={(e) => toggleSave(selectedPost.id, e)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                savedPostIds.has(selectedPost.id)
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${savedPostIds.has(selectedPost.id) ? 'fill-current' : ''}`} />
              <span className="font-semibold">保存</span>
            </button>
          </div>

          {/* コメントセクション */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">コメント</h3>
            
            {/* コメント入力 */}
            {user && (
              <div className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="コメントを入力..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-2"
                  rows={3}
                />
                <button
                  onClick={() => handleCommentSubmit(selectedPost.id)}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  コメントを投稿
                </button>
              </div>
            )}

            {/* コメント一覧 */}
            {loadingComments[selectedPost.id] ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
              </div>
            ) : postComments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>コメントはまだありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {postComments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      {new Date(comment.created_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // リスト表示（タイトルのみ）
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-8">
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
        <div className="space-y-3">
          {posts.map((post) => {
            const categoryInfo = post.category ? categoryConfig[post.category as keyof typeof categoryConfig] : null;
            const CategoryIcon = categoryInfo?.icon || MessageCircle;
            
            return (
              <div
                key={post.id}
                onClick={() => {
                  if (onPostClick) {
                    onPostClick(post.id);
                  } else {
                    setSelectedPost(post);
                  }
                }}
                className={`bg-white border-2 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  post.is_pinned ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  {post.is_pinned && (
                    <Pin className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  )}
                  {post.category && categoryInfo && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${categoryInfo.color} flex-shrink-0`}>
                      {React.createElement(CategoryIcon, { className: 'w-3 h-3' })}
                      <span>{post.category}</span>
                    </div>
                  )}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex-1">{post.title}</h3>
                  <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="text-sm text-gray-500 mt-2">
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
      )}
    </div>
  );
}

