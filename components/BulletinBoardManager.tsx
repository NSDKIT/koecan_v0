'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { MessageCircle, Plus, Edit, Trash2, Pin, PinOff, X } from 'lucide-react';

interface BulletinPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  display_order: number;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export function BulletinBoardManager() {
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BulletinPost | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', is_pinned: false, display_order: 0, category: '' as string | null });

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

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreate = () => {
    setEditingPost(null);
    setFormData({ title: '', content: '', is_pinned: false, display_order: 0, category: null });
    setShowEditModal(true);
  };

  const handleEdit = (post: BulletinPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      is_pinned: post.is_pinned,
      display_order: post.display_order,
      category: post.category
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この投稿を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('bulletin_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('削除に失敗しました。');
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('タイトルと内容を入力してください。');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザー情報が取得できませんでした。');

      if (editingPost) {
        // 更新
        const { error } = await supabase
          .from('bulletin_posts')
          .update({
            title: formData.title,
            content: formData.content,
            is_pinned: formData.is_pinned,
            display_order: formData.display_order,
            category: formData.category || null
          })
          .eq('id', editingPost.id);

        if (error) throw error;
      } else {
        // 新規作成
        const { error } = await supabase
          .from('bulletin_posts')
          .insert({
            title: formData.title,
            content: formData.content,
            author_id: user.id,
            is_pinned: formData.is_pinned,
            display_order: formData.display_order,
            category: formData.category || null
          });

        if (error) throw error;
      }

      setShowEditModal(false);
      fetchPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('保存に失敗しました。');
    }
  };

  const togglePin = async (post: BulletinPost) => {
    try {
      const { error } = await supabase
        .from('bulletin_posts')
        .update({ is_pinned: !post.is_pinned })
        .eq('id', post.id);

      if (error) throw error;
      fetchPosts();
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('ピン留めの更新に失敗しました。');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">掲示板管理</h2>
          <p className="text-gray-600 mt-1">学生向けの掲示板に投稿を追加・編集・削除できます</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          新規投稿
        </button>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">投稿がありません</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className={`bg-white border-2 rounded-xl p-6 ${
                post.is_pinned ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
                    {post.is_pinned && (
                      <Pin className="w-5 h-5 text-purple-600" />
                    )}
                    {post.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold border border-blue-300">
                        {post.category}
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-gray-800">{post.title}</h3>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap mb-4">{post.content}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>表示順: {post.display_order}</span>
                    <span>作成日: {new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                    {post.updated_at !== post.created_at && (
                      <span>更新日: {new Date(post.updated_at).toLocaleDateString('ja-JP')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => togglePin(post)}
                    className={`p-2 rounded-lg transition-colors ${
                      post.is_pinned
                        ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={post.is_pinned ? 'ピン留めを解除' : 'ピン留めする'}
                  >
                    {post.is_pinned ? <PinOff className="w-5 h-5" /> : <Pin className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="編集"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 編集モーダル */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingPost ? '投稿を編集' : '新規投稿'}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="投稿のタイトルを入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="投稿の内容を入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリー
                  </label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">カテゴリーを選択（任意）</option>
                    <option value="就活">就活</option>
                    <option value="サークル">サークル</option>
                    <option value="学生イベント">学生イベント</option>
                    <option value="バイト">バイト</option>
                    <option value="雑談">雑談</option>
                  </select>
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_pinned}
                      onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">ピン留めする</span>
                  </label>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">表示順:</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

