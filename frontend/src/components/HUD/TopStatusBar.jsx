import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';

export default function TopStatusBar({ isMobile }) {
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

  // 手机端：不留左侧 padding，简化布局
  const paddingLeft = isMobile ? 12 : (store.sidebarOpen ? 316 : 76);

  return (
    <div className="fixed top-0 left-0 right-0 h-12 z-40 flex items-center px-3"
      style={{
        background: 'rgba(5,7,10,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingLeft,
      }}>
      {/* 手机端：菜单按钮 */}
      {isMobile && (
        <button
          className="mr-2 p-1.5 rounded text-[#8B95A5] hover:text-[#00F0FF] shrink-0"
          onClick={() => store.toggleSidebar()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* 中间 */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className="text-xs font-medium text-[#8B95A5] truncate">{store.currentTheme?.name || ''}</span>
        <div className="h-3 w-px bg-white/[0.06] shrink-0" />
        <span className="text-xs font-mono text-[#00F0FF] shrink-0">
          {store.nodes.length}节点 · {store.edges.length}关系
        </span>
        {!isMobile && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#00D9A5]" />
            <span className="text-[10px] text-[#4A5568]">实时推演中</span>
          </div>
        )}
      </div>

      {/* 右侧 */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-mono text-[#4A5568] hidden sm:inline">
          {time.toLocaleTimeString('zh-CN', { hour12: false })}
        </span>
        <button onClick={handleExport} className="px-2 py-1 rounded text-[10px] text-[#4A5568] hover:text-[#E8ECF1] hover:bg-white/5 transition-all">截图</button>
        <button onClick={handleShare} className="px-2 py-1 rounded text-[10px] text-[#4A5568] hover:text-[#E8ECF1] hover:bg-white/5 transition-all hidden sm:inline">分享</button>
      </div>
    </div>
  );
}
