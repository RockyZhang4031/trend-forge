import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';

export default function FeedPanel({ themeId }) {
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [sourceType, setSourceType] = useState(3);
  const [feeding, setFeeding] = useState(false);
  const [result, setResult] = useState(null);
  const { feedData } = useStore();

  const handleFeed = async () => {
    if (!content.trim()) return;
    setFeeding(true);
    setResult(null);
    try {
      const res = await feedData(themeId, content.trim(), sourceType, url.trim() || null);
      setResult(res);
      setContent('');
      setUrl('');
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setFeeding(false);
    }
  };

  const sourceTypes = [
    { value: 3, label: '用户输入' },
    { value: 1, label: '新闻' },
    { value: 2, label: '论文' },
    { value: 4, label: '报告' },
  ];

  return (
    <div className="h-full flex flex-col p-4">
      <h3 className="text-xs font-semibold text-forge-text mb-3 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-forge-primary" style={{ boxShadow: '0 0 6px rgba(0,240,255,0.6)' }} />
        喂养数据
      </h3>

      {/* Source Type */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {sourceTypes.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSourceType(opt.value)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              sourceType === opt.value
                ? 'bg-forge-primary-dim text-forge-primary border border-forge-border-glow'
                : 'text-forge-text-secondary border border-transparent hover:border-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* URL */}
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="来源链接（可选）"
        className="input-forge w-full mb-2 px-3 py-2 rounded-lg text-xs"
      />

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="粘贴新闻、文章、论文摘要等内容..."
        rows={6}
        className="input-forge w-full px-3 py-2 rounded-lg text-xs resize-none mb-3"
      />

      {/* Submit */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleFeed}
        disabled={!content.trim() || feeding}
        className="btn-forge w-full py-2.5 rounded-lg text-xs font-medium"
      >
        {feeding ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full border border-forge-primary border-t-transparent animate-spin" />
            AI 分析中...
          </span>
        ) : (
          '喂养数据'
        )}
      </motion.button>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 glass-card rounded-lg p-3 text-xs overflow-hidden"
          >
            {result.error ? (
              <p className="text-forge-error">失败: {result.error}</p>
            ) : (
              <>
                <p className="text-forge-accent-growth mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-forge-accent-growth" />
                  {result.summary}
                </p>
                {result.extracted_nodes?.length > 0 && (
                  <div className="mt-2">
                    <span className="text-forge-text-tertiary text-[10px] uppercase tracking-wider">新增节点</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.extracted_nodes.map((n) => (
                        <span key={n.id} className="px-1.5 py-0.5 rounded bg-forge-primary-dim text-forge-primary text-[10px]">
                          {n.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
