import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import { themeApi } from './services/api';
import TrendGraph from './components/Graph/TrendGraph';
import LifecycleChart from './components/Graph/LifecycleChart';
import NodeDetail from './components/Panels/NodeDetail';
import CommentSection from './components/Comments/CommentSection';
import FeedPanel from './components/Panels/FeedPanel';
import Toolbar from './components/Common/Toolbar';
import ParticleField from './components/Background/ParticleField';

export default function App() {
  const {
    currentTheme,
    nodes,
    edges,
    loading,
    error,
    selectedNode,
    rightPanelOpen,
    rightPanelTab,
    fetchTheme,
    selectNode,
    closePanel,
    setPanelTab,
  } = useStore();

  const [leftPanelTab, setLeftPanelTab] = useState('lifecycle');
  const [themeId, setThemeId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('theme');

    if (id) {
      setThemeId(id);
      fetchTheme(id).catch(() => console.log('Failed to load theme:', id));
    } else {
      themeApi.getAll().then(({ data }) => {
        if (data && data.length > 0) {
          const firstTheme = data[0];
          setThemeId(firstTheme.id);
          fetchTheme(firstTheme.id).catch(() => console.log('Failed to load theme:', firstTheme.id));
        }
      }).catch(() => {
        console.log('Backend not configured yet, running in offline mode');
      });
    }
  }, []);

  const isDemo = !currentTheme && !loading;

  return (
    <div className="relative flex h-screen overflow-hidden" style={{ background: '#05070A' }}>
      {/* 粒子背景 */}
      <ParticleField />

      {/* ---- Left Sidebar ---- */}
      <AnimatePresence mode="wait">
        {!sidebarCollapsed && (
          <motion.aside
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 flex flex-col glass-panel scan-line"
            style={{ width: 280, borderRight: '1px solid rgba(0, 240, 255, 0.1)' }}
          >
            {/* Logo */}
            <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded animate-spin-slow"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent, #00F0FF, transparent)',
                      mask: 'radial-gradient(circle, transparent 55%, black 56%)',
                      WebkitMask: 'radial-gradient(circle, transparent 55%, black 56%)',
                    }}
                  />
                  <span className="relative text-sm font-bold text-forge-primary text-glow">TF</span>
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-wide text-forge-text">
                    TREND FORGE
                  </h1>
                  <p className="text-[10px] text-forge-text-secondary tracking-wider uppercase">
                    Deep Space Terminal
                  </p>
                </div>
              </div>
            </div>

            {/* Theme Info */}
            <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-start gap-2 mb-2">
                <div className="w-1 h-5 rounded-full bg-forge-primary shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
                <h2 className="text-base font-semibold text-forge-text leading-tight">
                  {currentTheme?.name || '机器人发展探索'}
                </h2>
              </div>
              <p className="text-xs text-forge-text-secondary leading-relaxed line-clamp-2">
                {currentTheme?.description || 'Demo 模式 - 后端未连接'}
              </p>
              {currentTheme && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <circle
                        className="ring-progress"
                        cx="20" cy="20" r="16"
                        fill="none"
                        stroke="#00F0FF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 16}
                        strokeDashoffset={2 * Math.PI * 16 * (1 - (currentTheme.heat_score || 0) / 100)}
                        style={{ filter: 'drop-shadow(0 0 4px rgba(0,240,255,0.6))' }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tnum text-forge-primary">
                      {currentTheme.heat_score?.toFixed(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-forge-text-tertiary uppercase tracking-wider">HEAT INDEX</div>
                    <div className="text-xs text-forge-text-secondary">
                      {currentTheme.heat_score >= 75 ? '🔥 高热' : currentTheme.heat_score >= 50 ? '⚡ 活跃' : '低温'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Left Tabs */}
            <div className="flex border-b relative" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {['lifecycle', 'feed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLeftPanelTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-medium tab-pill ${leftPanelTab === tab ? 'active' : 'text-forge-text-secondary'}`}
                >
                  {tab === 'lifecycle' ? '生命周期' : '喂养数据'}
                  {leftPanelTab === tab && (
                    <motion.div
                      layoutId="leftTabIndicator"
                      className="pill-indicator"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Left Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {leftPanelTab === 'lifecycle' ? (
                  <motion.div
                    key="lifecycle"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="p-2 h-full"
                  >
                    <div className="h-44 glass-card rounded-lg p-2">
                      <div className="text-[10px] text-forge-text-tertiary uppercase tracking-wider mb-1 px-1">
                        节点生命周期分布
                      </div>
                      <div className="h-36">
                        <LifecycleChart nodes={nodes} />
                      </div>
                    </div>
                    <div className="p-3 mt-2 grid grid-cols-2 gap-2">
                      <div className="glass-card rounded-lg p-2.5">
                        <div className="text-[10px] text-forge-text-tertiary uppercase">节点</div>
                        <div className="text-xl font-bold tnum text-forge-primary">{nodes.length}</div>
                      </div>
                      <div className="glass-card rounded-lg p-2.5">
                        <div className="text-[10px] text-forge-text-tertiary uppercase">关系</div>
                        <div className="text-xl font-bold tnum text-forge-accent-cold">{edges.length}</div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="feed"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <FeedPanel themeId={themeId} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-3 border-t text-[10px] text-forge-text-tertiary text-center tracking-wider" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              v2.0 · DEEP SPACE EDITION
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ---- Main Graph Area ---- */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between px-4 h-12 glass-panel border-b" style={{ borderBottom: '1px solid rgba(0, 240, 255, 0.08)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-forge-text-secondary hover:text-forge-primary transition-colors"
              title="切换侧边栏"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="9" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="9" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="9" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-forge-accent-growth animate-pulse-glow" />
              <span className="text-xs text-forge-text-secondary">
                {loading ? (
                  <span className="text-forge-primary">SYNCING...</span>
                ) : (
                  <>
                    <span className="tnum text-forge-text">{nodes.length}</span> NODES
                    <span className="mx-2 text-forge-text-tertiary">·</span>
                    <span className="tnum text-forge-text">{edges.length}</span> EDGES
                  </>
                )}
              </span>
            </div>
          </div>
          <Toolbar theme={currentTheme} />
        </div>

        {/* Graph */}
        <div className="flex-1 relative">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 glass-card rounded-lg text-sm border border-forge-error/30 text-forge-error"
            >
              {error}
            </motion.div>
          )}
          {isDemo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 glass-card rounded-lg text-sm border border-forge-accent-warm/30 text-forge-accent-warm"
            >
              ⚠ OFFLINE MODE — 后端未连接
            </motion.div>
          )}
          <TrendGraph nodes={nodes} edges={edges} onSelectNode={selectNode} />
        </div>
      </main>

      {/* ---- Right Panel ---- */}
      <AnimatePresence>
        {rightPanelOpen && selectedNode && (
          <motion.aside
            initial={{ x: 384, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 384, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 glass-panel flex flex-col"
            style={{ width: 384, borderLeft: '1px solid rgba(0, 240, 255, 0.1)' }}
          >
            <NodeDetail
              node={selectedNode}
              onClose={closePanel}
              onTabChange={setPanelTab}
              comments={[]}
            />
            {rightPanelTab === 'comments' && (
              <div className="h-96 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <CommentSection themeId={themeId} nodeId={selectedNode.id} />
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
