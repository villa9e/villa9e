'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function DreamLinePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadPosts();
    const channel = supabase
      .channel('dream_line_posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dream_line_posts' }, payload => {
        setPosts(prev => [payload.new, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadPosts() {
    const { data } = await supabase
      .from('dream_line_posts')
      .select('*, profiles(username, avatar_url)')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setPosts(data);
  }

  async function submitPost() {
    if (!newPost.trim()) return;
    setPosting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('dream_line_posts').insert({
        user_id: user.id,
        content: newPost,
        visibility: 'public',
      });
    }
    setNewPost('');
    setPosting(false);
  }

  async function giveOoWop(postId: string, receiverId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('oowops').insert({ post_id: postId, giver_id: user.id, receiver_id: receiverId });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, oowop_count: (p.oowop_count || 0) + 1 } : p));
  }

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-purple-600 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">✨</span>
        <h1 className="text-xl font-bold">Dream Line</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Post composer */}
        <div className="village-card">
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="Share your progress, a milestone, or an insight with the village…"
            rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-sm"
          />
          <button onClick={submitPost} disabled={posting || !newPost.trim()} className="mt-2 bg-purple-600 text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
            {posting ? 'Posting…' : '✨ Post to Dream Line'}
          </button>
        </div>

        {/* Feed */}
        {posts.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="village-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">
                {post.profiles?.username?.[0]?.toUpperCase() || '👤'}
              </div>
              <div>
                <p className="font-semibold text-sm">@{post.profiles?.username || 'villager'}</p>
                <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
              {post.medal_at_post && <span className="ml-auto">
                {post.medal_at_post === 'gold' ? '🥇' : post.medal_at_post === 'silver' ? '🥈' : post.medal_at_post === 'platinum' ? '🏆' : '🥉'}
              </span>}
            </div>
            <p className="text-gray-700 text-sm mb-3">{post.content}</p>
            <div className="flex items-center gap-4">
              <button onClick={() => giveOoWop(post.id, post.user_id)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 transition-colors">
                <span>🙌</span>
                <span>{post.oowop_count || 0} OoWops</span>
              </button>
              <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-village-blue transition-colors">
                <span>💬</span>
                <span>{post.comment_count || 0}</span>
              </button>
            </div>
          </motion.div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">✨</p>
            <p>The Dream Line is quiet. Be the first to share your progress!</p>
          </div>
        )}
      </div>
    </div>
  );
}
