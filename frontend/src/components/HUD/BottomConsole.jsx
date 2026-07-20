import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';

export default function BottomConsole({ isMobile }) {
  const store = useStore();
  const [logs, setLogs] = useState([
    { time: '00:00:12', type: 'info', msg: `力导向图布局完成，${store.nodes.length} 节点 ${store.edges.length} 关系` },
    { time: '00:00:10', type: 'success', msg: `主题「${store.currentTheme?.name || '机器人发展探索'}」加载成功` },
    { time: '00:00:08', type: 'info', msg: '3D 渲染引擎初始化完成' },
    { time: '00:00:05', type: 'info', msg: '粒子系统启动' },
  ]);

  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (store.nodes.length > 0) {
      setVisible(true);
      setLogs(prev => [
        { time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), type: 'success', msg: `${store.nodes.length} 节点 ${store.edges.length} 关系已加载` },
        ...prev.slice(0, 19),
      ]);
    }
  }, [store.nodes.length, store.edges.length]);

  if (!visible) return null;

  const colors = {
    success: '#00D9A5',
    warn: '#FF6B35',
    error: '#FF2E63',
    info: '#8B95A5',
  };

  // 手机端：高度更小，默认折叠，去掉 paddingLeft
  const height = isMobile ? (collapsed ? 32 : 80) : (collapsed ? 32 : 120);
  const paddingLeft = isMobile ? 0 : (store.sidebarOpen ? 300 : 60);

  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height }}
      className="fixed bottom-0 left-0 right-0 z-40 overflow-hidden"
      style={{
        background: 'rgba(5,7,10,0.9)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingLeft,
      }}
    >
      <div className="h-full p-3 flex flex-col">
        <div className="flex items-center justify-between mb-1.5 shrink-0">
          <button
            className="text-[10px] uppercase tracking-wider text-[#4A5568] hover:text-[#8B95A5] flex items-center gap-1"
            onClick={() => setCollapsed(c => !c)}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}>
              <path d="M4 0L0 4h8z" />
            </svg>
            推演日志
          </button>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#00D9A5]" />
            <span className="text-[10px] text-[#4A5568]">系统正常</span>
          </div>
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-0.5">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[#4A5568] shrink-0">{log.time}</span>
                <span className="shrink-0" style={{ color: colors[log.type] || '#8B95A5' }}>[{log.type.toUpperCase()}]</span>
                <span className="text-[#8B95A5] truncate">{log.msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
