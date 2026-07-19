import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';

export default function CommentSection({ themeId, nodeId }) {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState('');
  const [author, setAuthor] = useState('');
  const { addComment } = useStore();

  useEffect(() => {
    // 根据 nodeId 或 themeId 加载评论
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-forge-muted text-center py-8">还没有评论，来发第一条吧</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="p-3 bg-forge-surface rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-forge-text">{c.author_name}</span>
                <span className="text-xs text-forge-muted">
                  {new Date(c.created_at).toLocaleString('zh-CN')}
                </span>
              </div>
              <p className="text-sm text-forge-text leading-relaxed">{c.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-forge-border">
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="昵称（可选）"
          className="w-full mb-2 px-3 py-2 bg-forge-bg text-forge-text rounded-lg border border-forge-border text-sm focus:outline-none focus:border-forge-primary"
        />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="写下你的看法..."
          rows={3}
          className="w-full px-3 py-2 bg-forge-bg text-forge-text rounded-lg border border-forge-border text-sm focus:outline-none focus:border-forge-primary resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="mt-2 w-full py-2 bg-forge-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          发表评论
        </button>
      </div>
    </div>
  );
}
