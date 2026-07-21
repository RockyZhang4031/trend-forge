import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';

export default function BottomConsole({ isMobile }) {
  const store = useStore();
  const nodes = useStore(s => s.nodes);
  const analyses = useStore(s => s.analyses);
  const selectNode = useStore(s => s.selectNode);
  const flyToNode = useStore(s => s.flyToNode);

  const [logs, setLogs] = useState([
    { time: '00:00:12', type: 'info', msg: `力导向图布局完成，${store.nodes.length} 节点 ${store.edges.length} 关系` },
    { time: '00:00:10', type: 'success', msg: `主题「${store.currentTheme?.name || '机器人发展探索'}」加载成功` },
    { time: '00:00:08', type: 'info', msg: '3D 渲染引擎初始化完成' },
    { time: '00:00:05', type: 'info', msg: '粒子系统启动' },
  ]);

  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  // 关键论点轮播
  const [insights, setInsights] = useState([]);
  const [insightIdx, setInsightIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (store.nodes.length > 0) {
      setVisible(true);
      setLogs(prev => [
        { time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), type: 'success', msg: `主题数据已加载: ${store.nodes.length} 节点` },
        ...prev,
      ]);
    }
  }, [store.nodes.length]);

  // 从 analyses 中提取关键论点
  useEffect(() => {
    const items = [];
    Object.entries(analyses).forEach(([nodeId, a]) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      if (a.conclusion) {
        items.push({ nodeId, text: a.conclusion, source: node.name });
      } else if (a.thesis) {
        items.push({ nodeId, text: a.thesis.substring(0, 60) + '...', source: node.name });
      }
    });
    setInsights(items);
  }, [analyses, nodes]);

  // 自动轮播
  useEffect(() => {
    if (insights.length === 0) return;
    timerRef.current = setInterval(() => {
      setInsightIdx(i => (i + 1) % insights.length);
    }, 8000);
    return () => clearInterval(timerRef.current);
  }, [insights.length]);

  const colors = {
    info: '#00F0FF', success: '#00D9A5', warning: '#FFD700', error: '#FF2E63',
  };

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: visible ? 0 : 60, opacity: visible ? 1 : 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto"
      style={{ marginLeft: isMobile ? 0 : undefined }}
    >
      {/* 关键论点字幕条 */}
      {insights.length > 0 && (
        <div className="px-3 pb-1">
          <div
            className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => {
              const item = insights[insightIdx];
              if (item) {
                selectNode(item.nodeId);
                flyToNode(item.nodeId);
              }
            }}
          >
            <span className="text-[10px] font-mono text-[#00F0FF] shrink-0 animate-pulse">▸</span>
            <span className="text-[10px] text-[#4A5568] shrink-0">{insights[insightIdx]?.source}</span>
            <span className="text-[10px] text-[#4A5568] shrink-0">·</span>
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={insightIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-[11px] text-[#E8ECF1] block truncate"
                >
                  {insights[insightIdx]?.text}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="flex gap-0.5 shrink-0">
              {insights.slice(0, 5).map((_, i) => (
                <div key={i} className={`w-1 h-1 rounded-full ${i === insightIdx ? 'bg-[#00F0FF]' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 推演日志 */}
      <div className="glass-panel mx-3 mb-3 rounded-lg overflow-hidden" style={{ height: collapsed ? 32 : 160 }}>
        <div className="flex items-center justify-between px-3 py-1.5 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#4A5568] font-mono shrink-0">CONSOLE</span>
            <span className="text-[10px] text-[#4A5568]">推演日志</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#00D9A5]" />
            <span className="text-[10px] text-[#4A5568]">系统正常</span>
          </div>
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-0.5 px-3 pb-2">
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
