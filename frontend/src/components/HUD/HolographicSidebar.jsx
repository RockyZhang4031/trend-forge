import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import LifecycleChart from '../Graph/LifecycleChart';
import FeedPanel from '../Panels/FeedPanel';

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

  // 手机端：抽屉式覆盖 + 背景遮罩
  if (isMobile) {
    return (
      <AnimatePresence>
        {store.sidebarOpen && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => store.toggleSidebar()}
            />
            {/* 抽屉 */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full z-50 w-[280px] flex flex-col"
              style={{
                background: 'rgba(10, 14, 23, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(0,240,255,0.15)',
              }}
            >
              <SidebarContent store={store} theme={theme} heatScore={heatScore} themeId={themeId} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // 桌面端：固定侧边栏
  return (
    <motion.div
      className="fixed left-0 top-0 h-full z-50 flex flex-col"
      initial={false}
      animate={{ width: store.sidebarOpen ? 300 : 60 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        background: 'rgba(10, 14, 23, 0.75)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <SidebarContent store={store} theme={theme} heatScore={heatScore} themeId={themeId} />
    </motion.div>
  );
}

function SidebarContent({ store, theme, heatScore, themeId }) {
  return (
    <>
      {/* Logo 区 */}
      <div className="h-14 flex items-center px-4 border-b border-white/[0.06] shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 shrink-0"
          style={{ background: 'rgba(0,240,255,0.15)', border: '1px solid rgba(0,240,255,0.3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <AnimatePresence>
          {store.sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-sm tracking-wider text-[#E8ECF1] font-mono"
            >
              TREND FORGE
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {store.sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* 主题信息 */}
            <div className="p-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full bg-[#00F0FF]" style={{ boxShadow: '0 0 8px #00F0FF' }} />
                <h2 className="text-sm font-bold text-[#E8ECF1]">{theme?.name || '加载中...'}</h2>
              </div>
              <p className="text-xs leading-relaxed text-[#8B95A5] line-clamp-2">{theme?.description || ''}</p>

              {/* 热度环 */}
              <div className="mt-3 flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#FF6B35" strokeWidth="2"
                      strokeDasharray={`${heatScore * 0.94} ${100 * 0.94}`} strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 4px #FF6B35)' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono text-[#FF6B35]">
                    {heatScore}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#4A5568]">热度</div>
                  <div className="text-xs text-[#8B95A5]">高关注度</div>
                </div>
              </div>
            </div>

            {/* 标签页 */}
            <div className="flex border-b border-white/[0.06] shrink-0">
              {[
                { key: 'lifecycle', label: '生命周期' },
                { key: 'feed', label: '喂养数据' },
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`flex-1 py-2 text-xs relative transition-colors ${store.sidebarTab === tab.key ? 'text-[#00F0FF]' : 'text-[#8B95A5]'}`}
                  onClick={() => store.setSidebarTab(tab.key)}
                >
                  {tab.label}
                  {store.sidebarTab === tab.key && (
                    <motion.div
                      layoutId="sidebar-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00F0FF]"
                      style={{ boxShadow: '0 0 8px rgba(0,240,255,0.6)' }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* 标签内容 */}
            <div className="flex-1 overflow-hidden">
              {store.sidebarTab === 'lifecycle' ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 min-h-0">
                    <LifecycleChart nodes={store.nodes} />
                  </div>
                  {/* 节点列表 */}
                  <div className="h-48 overflow-y-auto p-2 border-t border-white/[0.06]">
                    <div className="text-[10px] uppercase tracking-wider px-2 mb-1 text-[#4A5568]">
                      节点 ({store.nodes.length})
                    </div>
                    {store.nodes.map((node, i) => (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer mb-0.5"
                        style={{
                          background: store.selectedNodeId === node.id ? 'rgba(0,240,255,0.1)' : 'transparent',
                          border: store.selectedNodeId === node.id ? '1px solid rgba(0,240,255,0.3)' : '1px solid transparent',
                        }}
                        onClick={() => { store.selectNode(node.id); store.flyToNode(node.id); }}
                        onMouseEnter={() => store.hoverNode(node.id)}
                        onMouseLeave={() => store.hoverNode(null)}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: NODE_COLORS[node.type] || '#00F0FF' }} />
                        <div className="flex-1 min-w-0 text-xs truncate text-[#E8ECF1]">{node.name}</div>
                        <div className="text-[10px] font-mono text-[#4A5568]">{node.heat}</div>
                      </motion.div>
                    ))}
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
      <button
        className="h-10 flex items-center justify-center border-t border-white/[0.06] text-[#8B95A5] hover:text-[#00F0FF] shrink-0 transition-colors"
        onClick={() => store.toggleSidebar()}
      >
        {store.sidebarOpen ? '◀' : '▶'}
      </button>
    </>
  );
}
