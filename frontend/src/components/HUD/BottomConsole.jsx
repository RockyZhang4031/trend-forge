import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';

export default function BottomConsole() {
  const store = useStore();
  const [logs, setLogs] = useState([
    { time: '00:00:12', type: 'info', msg: `力导向图布局计算完成，${store.nodes.length} 个节点，${store.edges.length} 条关系` },
    { time: '00:00:10', type: 'success', msg: `主题「${store.currentTheme?.name || '机器人发展探索'}」数据加载成功` },
    { time: '00:00:08', type: 'info', msg: '3D 渲染引擎初始化完成' },
    { time: '00:00:05', type: 'info', msg: '粒子系统启动，1500 个粒子' },
  ]);

  const [visible, setVisible] = useState(false);

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

  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: 120 }}
      className="fixed bottom-0 left-0 right-0 z-40 overflow-hidden"
      style={{
        background: 'rgba(5,7,10,0.9)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingLeft: store.sidebarOpen ? 300 : 60,
      }}
    >
      <div className="h-full p-3 flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] uppercase tracking-wider text-[#4A5568]">推演日志</div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#00D9A5]" />
            <span className="text-[10px] text-[#4A5568]">系统正常</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-0.5">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[#4A5568]">{log.time}</span>
              <span style={{ color: colors[log.type] || '#8B95A5' }}>[{log.type.toUpperCase()}]</span>
              <span className="text-[#8B95A5]">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
