import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { toPng } from 'html-to-image';

export default function TopStatusBar() {
  const store = useStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleExport = async () => {
    const graphEl = document.querySelector('canvas');
    if (!graphEl) return;
    try {
      const dataUrl = graphEl.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `trend-forge-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('导出失败: ' + err.message);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => alert('链接已复制'));
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-12 z-40 flex items-center px-4"
      style={{
        background: 'rgba(5,7,10,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingLeft: store.sidebarOpen ? 316 : 76,
      }}>
      {/* 中间 */}
      <div className="flex-1 flex items-center justify-center gap-4">
        <span className="text-xs font-medium text-[#8B95A5]">{store.currentTheme?.name || ''}</span>
        <div className="h-3 w-px bg-white/[0.06]" />
        <span className="text-xs font-mono text-[#00F0FF]">{store.nodes.length} 节点 · {store.edges.length} 关系</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#00D9A5]" />
          <span className="text-[10px] text-[#4A5568]">实时推演中</span>
        </div>
      </div>

      {/* 右侧 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-[#4A5568]">{time.toLocaleTimeString('zh-CN', { hour12: false })}</span>
        <button onClick={handleExport} className="px-2 py-1 rounded text-[10px] text-[#4A5568] hover:text-[#E8ECF1] hover:bg-white/5 transition-all">截图</button>
        <button onClick={handleShare} className="px-2 py-1 rounded text-[10px] text-[#4A5568] hover:text-[#E8ECF1] hover:bg-white/5 transition-all">分享</button>
      </div>
    </div>
  );
}
