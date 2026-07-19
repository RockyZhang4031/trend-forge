import { useState } from 'react';
import { useStore } from '../../store/useStore';

export default function FeedPanel({ themeId }) {
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [sourceType, setSourceType] = useState(3); // 3=用户输入
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

  return (
    <div className="h-full flex flex-col p-4">
      <h3 className="text-sm font-semibold text-forge-text mb-3">喂养数据</h3>

      {/* Source Type */}
      <div className="flex gap-2 mb-3">
        {[
          { value: 3, label: '用户输入' },
          { value: 1, label: '新闻' },
          { value: 2, label: '论文' },
          { value: 4, label: '报告' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSourceType(opt.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              sourceType === opt.value
                ? 'bg-forge-primary text-white'
                : 'bg-forge-surface text-forge-muted hover:text-forge-text'
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
        className="w-full mb-2 px-3 py-2 bg-forge-bg text-forge-text rounded-lg border border-forge-border text-sm focus:outline-none focus:border-forge-primary"
      />

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="粘贴新闻、文章、论文摘要等内容..."
        rows={6}
        className="w-full px-3 py-2 bg-forge-bg text-forge-text rounded-lg border border-forge-border text-sm focus:outline-none focus:border-forge-primary resize-none mb-3"
      />

      {/* Submit */}
      <button
        onClick={handleFeed}
        disabled={!content.trim() || feeding}
        className="w-full py-2.5 bg-forge-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {feeding ? 'AI 分析中...' : '喂养数据'}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-3 p-3 bg-forge-surface rounded-lg text-sm">
          {result.error ? (
            <p className="text-error">失败: {result.error}</p>
          ) : (
            <>
              <p className="text-success mb-1">✓ {result.summary}</p>
              {result.extracted_nodes?.length > 0 && (
                <div className="mt-2">
                  <span className="text-forge-muted text-xs">新增节点:</span>
                  {result.extracted_nodes.map((n) => (
                    <span key={n.id} className="ml-2 text-forge-text text-xs">
                      {n.name}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
