import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';

export default function Toolbar({ theme }) {
  const handleExport = async () => {
    const graphEl = document.getElementById('trend-graph-container');
    if (!graphEl) return;

    try {
      const dataUrl = await toPng(graphEl, {
        backgroundColor: '#05070A',
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

  const buttons = [
    {
      label: '截图',
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5 4V2.5C5 2.2 5.2 2 5.5 2H10.5C10.8 2 11 2.2 11 2.5V4" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
      onClick: handleExport,
    },
    {
      label: '分享',
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="3" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="13" cy="3" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="13" cy="13" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="4.8" y1="7" x2="11.2" y2="4" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="4.8" y1="9" x2="11.2" y2="12" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
      onClick: handleShare,
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {buttons.map((btn) => (
        <motion.button
          key={btn.label}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={btn.onClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-forge-text-secondary border border-transparent hover:border-forge-border-glow hover:text-forge-primary hover:bg-forge-primary-dim transition-all"
        >
          {btn.icon}
          {btn.label}
        </motion.button>
      ))}
    </div>
  );
}
