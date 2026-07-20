import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import CommentSection from '../Comments/CommentSection';

const NODE_COLORS = {
  technology: '#00F0FF',
  person: '#FF6B35',
  company: '#6C5CE7',
  resource: '#FFD700',
  concept: '#00D9A5',
};

const NODE_ICONS = {
  technology: '⚙️',
  person: '👤',
  company: '🏢',
  resource: '💎',
  concept: '🚀',
};

export default function NodeDetailHUD({ themeId, isMobile }) {
  const store = useStore();
  const node = store.nodes.find(n => n.id === store.selectedNodeId);

  return (
    <AnimatePresence>
      {store.detailPanelOpen && node && (
        <>
          {/* 手机端：点击背景遮罩关闭 */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => store.closePanel()}
            />
          )}

          <motion.div
            key="overlay"
            initial={isMobile ? { y: '100%' } : { x: 384, opacity: 0 }}
            animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
            exit={isMobile ? { y: '100%' } : { x: 384, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={isMobile
              ? 'fixed left-0 right-0 bottom-0 z-50 max-h-[70vh] flex flex-col rounded-t-2xl'
              : 'fixed right-0 top-12 bottom-0 z-50 w-96 flex flex-col'
            }
            style={{
              background: 'rgba(10, 14, 23, 0.95)',
              backdropFilter: 'blur(24px)',
              borderLeft: isMobile ? 'none' : '1px solid rgba(0,240,255,0.1)',
              borderTop: isMobile ? '1px solid rgba(0,240,255,0.2)' : 'none',
              boxShadow: isMobile ? '0 -8px 40px rgba(0,0,0,0.6)' : 'none',
            }}
          >
            {/* 手机端拖拽指示条 — 也可以下拉关闭 */}
            {isMobile && (
              <div
                className="pt-2.5 pb-1.5 flex justify-center shrink-0 cursor-pointer"
                onClick={() => store.closePanel()}
              >
                <div className="w-12 h-1.5 rounded-full bg-white/25" />
              </div>
            )}

            {/* 扫描线 */}
            <div className="h-px w-full shrink-0" style={{
              background: 'linear-gradient(90deg, transparent, #00F0FF, transparent)',
              opacity: 0.5,
            }} />

            <PanelContent node={node} store={store} themeId={themeId} isMobile={isMobile} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PanelContent({ node, store, themeId, isMobile }) {
  const color = NODE_COLORS[node.type] || '#00F0FF';
  const icon = NODE_ICONS[node.type] || '●';

  return (
    <>
      {/* 头部 — 关闭按钮加大到 44x44 触摸区 */}
      <div className="p-4 flex items-start gap-3 shrink-0">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}40`,
            boxShadow: `0 0 16px ${color}60`,
          }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#E8ECF1] truncate">{node.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0"
              style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
              {node.type}
            </span>
            {node.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] font-mono text-[#4A5568] truncate">{tag}</span>
            ))}
          </div>
        </div>
        {/* 关闭按钮 — 44x44 最小触摸区 */}
        <button
          className="w-11 h-11 flex items-center justify-center text-xl text-[#8B95A5] hover:text-[#E8ECF1] hover:bg-white/5 rounded-lg transition-colors shrink-0"
          onClick={() => store.closePanel()}
          aria-label="关闭"
        >
          ✕
        </button>
      </div>

      {/* 描述 */}
      <div className="px-4 pb-3 shrink-0">
        <p className="text-xs leading-relaxed text-[#8B95A5]">{node.description || '暂无描述'}</p>
      </div>

      {/* 指标 */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2 shrink-0">
        <MetricCard label="热度" value={node.heat} color="#00F0FF" />
        <MetricCard label="稀缺度" value={node.scarcity} color="#FF6B35" />
        <MetricCard label="影响力" value={node.heat} color="#00D9A5" />
      </div>

      {/* 标签 */}
      {node.tags?.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1 shrink-0">
          {node.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#8B95A5]">{tag}</span>
          ))}
        </div>
      )}

      {/* 标签页切换 — 触摸区加大 */}
      <div className="flex border-y border-white/[0.06] shrink-0">
        {[
          { key: 'detail', label: '详情' },
          { key: 'comments', label: '评论' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`flex-1 py-3 text-xs relative transition-colors ${store.rightPanelTab === tab.key ? 'text-[#00F0FF]' : 'text-[#8B95A5]'}`}
            onClick={() => store.setPanelTab(tab.key)}
          >
            {tab.label}
            {store.rightPanelTab === tab.key && (
              <motion.div layoutId="detail-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00F0FF]" style={{ boxShadow: '0 0 8px rgba(0,240,255,0.6)' }} />
            )}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {store.rightPanelTab === 'comments' ? (
          <CommentSection themeId={themeId} nodeId={node.id} />
        ) : (
          <div className="p-4 text-xs text-[#8B95A5]">
            <div className="text-[10px] uppercase tracking-wider mb-2 text-[#4A5568]">生命周期</div>
            <div className="mb-3">{node.lifecycleLabel || '成长期'}</div>
            <div className="text-[10px] uppercase tracking-wider mb-2 text-[#4A5568]">关联节点</div>
            <RelatedNodes nodeId={node.id} />
          </div>
        )}
      </div>
    </>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="p-2.5 rounded-lg relative overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <div className="text-[10px] uppercase tracking-wider text-[#4A5568] ml-1.5">{label}</div>
      <div className="text-xl font-bold font-mono ml-1.5" style={{ color }}>{value || 0}</div>
      <div className="mt-1 ml-1.5 h-0.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value || 0}%` }}
          transition={{ duration: 0.6 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function RelatedNodes({ nodeId }) {
  const { edges, nodes } = useStore();
  const related = edges
    .filter(e => (e.source === nodeId || e.target === nodeId) || (e.source_node_id === nodeId || e.target_node_id === nodeId))
    .map(e => {
      const otherId = e.source === nodeId || e.source_node_id === nodeId ? (e.target || e.target_node_id) : (e.source || e.source_node_id);
      return nodes.find(n => n.id === otherId);
    })
    .filter(Boolean);

  if (!related.length) return <div className="text-[#4A5568]">暂无关联节点</div>;

  return (
    <div className="space-y-1">
      {related.map(n => (
        <div key={n.id} className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer"
          onClick={() => useStore.getState().selectNode(n.id)}>
          <div className="w-2 h-2 rounded-full" style={{ background: NODE_COLORS[n.type] || '#00F0FF' }} />
          <span className="text-[#E8ECF1]">{n.name}</span>
          <span className="text-[10px] font-mono text-[#4A5568] ml-auto">{n.heat}</span>
        </div>
      ))}
    </div>
  );
}
