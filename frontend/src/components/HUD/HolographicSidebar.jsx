import { motion, AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { useStore } from '../../store/useStore';
import FeedPanel from '../Panels/FeedPanel';

const LifecycleChart = lazy(() => import('../Graph/LifecycleChart'));

const NODE_COLORS = {
  technology: '#00F0FF',
  person: '#FF6B35',
  company: '#6C5CE7',
  resource: '#FFD700',
  concept: '#00D9A5',
};

export default function HolographicSidebar({ themeId, isMobile }) {
  const store = useStore();
  const theme = store.currentTheme;
  const heatScore = theme?.heat_score || 78;

  if (isMobile) {
    return (
      <AnimatePresence>
        {store.sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60" onClick={() => store.toggleSidebar()}
            />
            <motion.div
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full z-50 w-[280px] flex flex-col"
              style={{ background: 'rgba(10,14,23,0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(0,240,255,0.15)' }}
            >
              <SidebarContent store={store} theme={theme} heatScore={heatScore} themeId={themeId} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      className="fixed left-0 top-0 h-full z-50 flex flex-col"
      initial={false}
      animate={{ width: store.sidebarOpen ? 300 : 60 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ background: 'rgba(10,14,23,0.75)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      <SidebarContent store={store} theme={theme} heatScore={heatScore} themeId={themeId} />
    </motion.div>
  );
}

function SidebarContent({ store, theme, heatScore, themeId }) {
  return (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/[0.06] shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 shrink-0"
          style={{ background: 'rgba(0,240,255,0.15)', border: '1px solid rgba(0,240,255,0.3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <AnimatePresence>
          {store.sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-bold text-sm tracking-wider text-[#E8ECF1] font-mono">TREND FORGE</motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {store.sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden">
            {/* 主题信息 */}
            <div className="p-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full bg-[#00F0FF]" style={{ boxShadow: '0 0 8px #00F0FF' }} />
                <h2 className="text-sm font-bold text-[#E8ECF1]">{theme?.name || '加载中...'}</h2>
              </div>
              <p className="text-xs leading-relaxed text-[#8B95A5] line-clamp-2">{theme?.description || ''}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#FF6B35" strokeWidth="2"
                      strokeDasharray={`${heatScore * 0.94} ${100 * 0.94}`} strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 4px #FF6B35)' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono text-[#FF6B35]">{heatScore}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#4A5568]">热度</div>
                  <div className="text-xs text-[#8B95A5]">高关注度</div>
                </div>
              </div>
            </div>

            {/* Tab — 带高亮 */}
            <div className="flex border-b border-white/[0.06] shrink-0">
              {[
                { key: 'lifecycle', label: '生命周期' },
                { key: 'feed', label: '喂养数据' },
              ].map(tab => (
                <button key={tab.key}
                  className={`flex-1 py-2.5 text-xs relative transition-colors ${store.sidebarTab === tab.key ? 'text-[#00F0FF] font-medium' : 'text-[#8B95A5]'}`}
                  onClick={() => store.setSidebarTab(tab.key)}>
                  {tab.label}
                  {store.sidebarTab === tab.key && (
                    <motion.div layoutId="sidebar-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00F0FF]"
                      style={{ boxShadow: '0 0 8px rgba(0,240,255,0.6)' }} />
                  )}
                </button>
              ))}
            </div>

            {/* 内容 */}
            <div className="flex-1 overflow-hidden">
              {store.sidebarTab === 'lifecycle' ? (
                <div className="h-full flex flex-col">
                  {/* 节点列表 — 作为主要导航 */}
                  <div className="flex-1 overflow-y-auto p-2 min-h-0">
                    <div className="text-[10px] uppercase tracking-wider px-2 mb-1 text-[#4A5568]">
                      节点 ({store.nodes.length}) · 点击聚焦
                    </div>
                    {store.nodes.map((node, i) => {
                      const isSelected = store.selectedNodeId === node.id;
                      const isHovered = store.hoveredNodeId === node.id;
                      return (
                        <motion.div
                          key={node.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer mb-0.5 transition-all"
                          style={{
                            background: isSelected ? 'rgba(0,240,255,0.12)' : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                            border: isSelected ? '1px solid rgba(0,240,255,0.4)' : '1px solid transparent',
                          }}
                          onClick={() => { store.selectNode(node.id); store.flyToNode(node.id); }}
                          onMouseEnter={() => store.hoverNode(node.id)}
                          onMouseLeave={() => store.hoverNode(null)}
                        >
                          <div className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: NODE_COLORS[node.type] || '#00F0FF', boxShadow: isSelected ? `0 0 8px ${NODE_COLORS[node.type] || '#00F0FF'}` : 'none' }} />
                          <div className="flex-1 min-w-0 text-xs truncate text-[#E8ECF1]">{node.name}</div>
                          {/* 热度微条 */}
                          <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden shrink-0">
                            <div className="h-full rounded-full" style={{ width: `${node.heat}%`, background: NODE_COLORS[node.type] || '#00F0FF' }} />
                          </div>
                          <div className="text-[10px] font-mono text-[#4A5568] w-6 text-right">{node.heat}</div>
                        </motion.div>
                      );
                    })}
                  </div>
                  {/* 生命周期图 — 固定底部 */}
                  <div className="h-32 border-t border-white/[0.06] shrink-0">
                    <Suspense fallback={<div className="flex items-center justify-center h-full text-[10px] text-[#4A5568]">加载...</div>}>
                      <LifecycleChart nodes={store.nodes} />
                    </Suspense>
                  </div>
                </div>
              ) : (
                <div className="p-3 overflow-y-auto h-full">
                  <FeedPanel themeId={themeId} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 折叠按钮 */}
      <div className="shrink-0 border-t border-white/[0.06]">
        <button
          className="w-full h-10 flex items-center justify-center text-[#8B95A5] hover:text-[#00F0FF] shrink-0 transition-colors"
          onClick={() => store.toggleSidebar()}>
          {store.sidebarOpen ? '◀' : '▶'}
        </button>
      </div>
    </>
  );
}
