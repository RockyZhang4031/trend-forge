import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from './store/useStore';
import { themeApi } from './services/api';
import { useResponsive } from './hooks/useResponsive';
import ForceGraphScene from './components/Scene/ForceGraphScene';
import HolographicSidebar from './components/HUD/HolographicSidebar';
import TopStatusBar from './components/HUD/TopStatusBar';
import NodeDetailHUD from './components/HUD/NodeDetailHUD';
import BottomConsole from './components/HUD/BottomConsole';
import InsightsDashboard from './components/HUD/InsightsDashboard';
import ReportScene from './components/HUD/ReportScene';

export default function App() {
  const store = useStore();
  const { isMobile } = useResponsive();
  const [themeId, setThemeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [introPhase, setIntroPhase] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data: themes } = await themeApi.getAll();
        if (themes && themes.length > 0) {
          const id = themes[0].id;
          setThemeId(id);
          await store.fetchTheme(id);
        }
      } catch (err) {
        console.error('Failed to load theme:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 导演式入场动画序列
  useEffect(() => {
    if (loading || !store.nodes.length) return;
    const timers = [
      setTimeout(() => setIntroPhase(1), 300),   // 主题标题亮起
      setTimeout(() => setIntroPhase(2), 1000),  // 核心节点诞生
      setTimeout(() => setIntroPhase(3), 1800),  // 连线射出
      setTimeout(() => setIntroPhase(4), 2600),  // 卫星节点浮现
    ];
    return () => timers.forEach(clearTimeout);
  }, [loading, store.nodes.length]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#05070A' }}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-mono text-[#8B95A5] tracking-wider">INITIALIZING TREND FORGE...</div>
        </div>
      </div>
    );
  }

  const canvasLeft = isMobile ? 0 : (store.sidebarOpen ? 300 : 60);

  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: '#05070A' }}>
      {/* 3D 画布层 — 报告打开时隐藏，防止 HTML 标签穿透 */}
      <div
        className="absolute top-0 right-0 bottom-0 transition-[left] duration-300 ease-out"
        style={{ left: canvasLeft, visibility: store.reportOpen ? 'hidden' : 'visible' }}
        onPointerDown={(e) => {
          if (e.target.tagName === 'CANVAS' && store.detailPanelOpen) {
            store.closePanel();
          }
        }}
      >
        <ForceGraphScene nodes={store.nodes} edges={store.edges} introPhase={introPhase} />
      </div>

      {/* 2D UI 覆盖层 */}
      <HolographicSidebar themeId={themeId} isMobile={isMobile} />
      <TopStatusBar isMobile={isMobile} />
      <InsightsDashboard isMobile={isMobile} />
      <NodeDetailHUD themeId={themeId} isMobile={isMobile} />
      <BottomConsole isMobile={isMobile} />

      {/* 首次引导 */}
      {introPhase >= 2 && store.nodes.length > 0 && !store.selectedNodeId && !store.reportOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none px-2"
          style={{ bottom: isMobile ? 60 : 80 }}
        >
          <div className="glass-panel rounded-full px-4 py-2 flex items-center gap-2 flex-wrap justify-center"
            style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)' }}>
            <span className="text-[11px] text-[#8B95A5]">点击节点查看详情</span>
            <span className="text-[#4A5568]">·</span>
            <span className="text-[11px] text-[#8B95A5]">右上角</span>
            <span className="text-[11px] text-[#00F0FF]">趋势报告</span>
          </div>
        </motion.div>
      )}

      <ReportScene />
    </div>
  );
}
