import { toPng } from 'html-to-image';

export default function Toolbar({ theme, onShare, onExport }) {
  const handleExport = async () => {
    const graphEl = document.getElementById('trend-graph-container');
    if (!graphEl) return;

    try {
      const dataUrl = await toPng(graphEl, {
        backgroundColor: '#0a0e1a',
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `${theme?.name || 'trend-forge'}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('导出失败: ' + err.message);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('链接已复制到剪贴板');
    }).catch(() => {
      prompt('复制此链接分享:', url);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        className="px-3 py-1.5 bg-forge-surface text-forge-text rounded-lg text-sm hover:bg-forge-card border border-forge-border transition-colors"
      >
        📸 截图
      </button>
      <button
        onClick={handleShare}
        className="px-3 py-1.5 bg-forge-surface text-forge-text rounded-lg text-sm hover:bg-forge-card border border-forge-border transition-colors"
      >
        🔗 分享
      </button>
    </div>
  );
}
