import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';

export default function CommentSection({ themeId, nodeId }) {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState('');
  const [author, setAuthor] = useState('');
  const { addComment } = useStore();

  useEffect(() => {
    loadComments();
  }, [nodeId, themeId]);

  const loadComments = async () => {
    const { commentApi } = await import('../../services/api');
    try {
      const { data } = nodeId
        ? await commentApi.getByNode(nodeId)
        : await commentApi.getByTheme(themeId);
      setComments(data || []);
    } catch (err) {
      setComments([]);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    try {
      await addComment({
        theme_id: nodeId ? null : themeId,
        node_id: nodeId || null,
        author_name: author || '匿名用户',
        content: input.trim(),
      });
      setInput('');
      loadComments();
    } catch (err) {
      alert('评论失败: ' + err.message);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {comments.length === 0 ? (
          <p className="text-xs text-forge-text-tertiary text-center py-8">还没有评论</p>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="glass-card rounded-lg p-2.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-forge-primary">{c.author_name}</span>
                  <span className="text-[10px] text-forge-text-tertiary tnum">
                    {new Date(c.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <p className="text-xs text-forge-text leading-relaxed">{c.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="昵称（可选）"
          className="input-forge w-full mb-2 px-3 py-1.5 rounded-lg text-xs"
        />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="写下你的看法..."
          rows={2}
          className="input-forge w-full px-3 py-1.5 rounded-lg text-xs resize-none mb-2"
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="btn-forge w-full py-1.5 rounded-lg text-xs font-medium"
        >
          发表评论
        </motion.button>
      </div>
    </div>
  );
}
