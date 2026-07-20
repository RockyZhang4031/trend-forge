import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import CommentSection from '../Comments/CommentSection';

const NODE_COLORS = {
  technology: '#00F0FF', person: '#FF6B35', company: '#6C5CE7', resource: '#FFD700', concept: '#00D9A5',
};
const NODE_ICONS = {
  technology: '⚙️', person: '👤', company: '🏢', resource: '💎', concept: '🚀',
};
const TYPE_LABELS = {
  technology: '技术', person: '人物', company: '公司', resource: '资源', concept: '概念',
};

export default function NodeDetailHUD({ themeId, isMobile }) {
  const store = useStore();
  const node = store.nodes.find(n => n.id === store.selectedNodeId);

  return (
    <AnimatePresence>
      {store.detailPanelOpen && node && (
        <>
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50" onClick={() => store.closePanel()}
            />
          )}
          <motion.div
            key="overlay"
            initial={isMobile ? { y: '100%' } : { x: 384, opacity: 0 }}
            animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
            exit={isMobile ? { y: '100%' } : { x: 384, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={isMobile
              ? 'fixed left-0 right-0 bottom-0 z-50 max-h-[75vh] flex flex-col rounded-t-2xl'
              : 'fixed right-0 top-12 bottom-0 z-50 w-96 flex flex-col'}
            style={{
              background: 'rgba(10,14,23,0.95)', backdropFilter: 'blur(24px)',
              borderLeft: isMobile ? 'none' : '1px solid rgba(0,240,255,0.1)',
              borderTop: isMobile ? '1px solid rgba(0,240,255,0.2)' : 'none',
              boxShadow: isMobile ? '0 -8px 40px rgba(0,0,0,0.6)' : 'none',
            }}>
            {isMobile && (
              <div className="pt-2.5 pb-1.5 flex justify-center shrink-0 cursor-pointer" onClick={() => store.closePanel()}>
                <div className="w-12 h-1.5 rounded-full bg-white/25" />
              </div>
            )}
            <div className="h-px w-full shrink-0" style={{ background: 'linear-gradient(90deg, transparent, #00F0FF, transparent)', opacity: 0.5 }} />
            <PanelContent node={node} store={store} themeId={themeId} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PanelContent({ node, store, themeId }) {
  const color = NODE_COLORS[node.type] || '#00F0FF';
  const icon = NODE_ICONS[node.type] || '●';
  const typeLabel = TYPE_LABELS[node.type] || node.type;

  return (
    <>
      <div className="p-4 flex items-start gap-3 shrink-0">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}40`, boxShadow: `0 0 16px ${color}60` }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[#E8ECF1] truncate">{node.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0"
              style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>{typeLabel}</span>
            {node.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#8B95A5] truncate">{tag}</span>
            ))}
          </div>
        </div>
        <button className="w-11 h-11 flex items-center justify-center text-xl text-[#8B95A5] hover:text-[#E8ECF1] hover:bg-white/5 rounded-lg transition-colors shrink-0"
          onClick={() => store.closePanel()} aria-label="关闭">✕</button>
      </div>

      <div className="px-4 pb-3 shrink-0">
        <p className="text-xs leading-relaxed text-[#8B95A5]">{node.description || '暂无描述'}</p>
      </div>

      <div className="px-4 pb-3 shrink-0 space-y-2">
        <ScoreBar label="热度" value={node.heat} color="#00F0FF" />
        <ScoreBar label="稀缺度" value={node.scarcity} color="#FF6B35" />
        <ScoreBar label="影响力" value={node.heat} color="#00D9A5" />
      </div>

      <div className="flex border-y border-white/[0.06] shrink-0">
        {[
          { key: 'detail', label: '关联节点' },
          { key: 'comments', label: '评论' },
        ].map(tab => (
          <button key={tab.key}
            className={`flex-1 py-3 text-xs relative transition-colors ${store.rightPanelTab === tab.key ? 'text-[#00F0FF] font-medium' : 'text-[#8B95A5]'}`}
            onClick={() => store.setPanelTab(tab.key)}>
            {tab.label}
            {store.rightPanelTab === tab.key && (
              <motion.div layoutId="detail-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00F0FF]" style={{ boxShadow: '0 0 8px rgba(0,240,255,0.6)' }} />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {store.rightPanelTab === 'comments' ? (
          <CommentSection themeId={themeId} nodeId={node.id} />
        ) : (
          <div className="p-3"><RelatedNodes nodeId={node.id} /></div>
        )}
      </div>
    </>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] uppercase tracking-wider text-[#4A5568] w-14 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value || 0}%` }} transition={{ duration: 0.5 }}
          className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <span className="text-sm font-bold font-mono w-8 text-right" style={{ color }}>{value || 0}</span>
    </div>
  );
}

function RelatedNodes({ nodeId }) {
  const { edges, nodes } = useStore();
  const selectNode = useStore(s => s.selectNode);
  const flyToNode = useStore(s => s.flyToNode);

  const related = edges
    .filter(e => {
      const sid = typeof e.source === 'string' ? e.source : e.source?.id;
      const tid = typeof e.target === 'string' ? e.target : e.target?.id;
      return sid === nodeId || tid === nodeId;
    })
    .map(e => {
      const sid = typeof e.source === 'string' ? e.source : e.source?.id;
      const tid = typeof e.target === 'string' ? e.target : e.target?.id;
      const otherId = sid === nodeId ? tid : sid;
      return { node: nodes.find(n => n.id === otherId), edge: e };
    })
    .filter(r => r.node);

  if (!related.length) return <div className="text-xs text-[#4A5568] py-4 text-center">暂无关联节点</div>;

  const EDGE_LABELS = { drives: '驱动', depends: '依赖', competes: '竞争', belongs: '属于' };

  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-[#4A5568] mb-2">关联节点 ({related.length})</div>
      {related.map(({ node, edge }) => (
        <div key={node.id}
          className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
          onClick={() => { selectNode(node.id); flyToNode(node.id); }}>
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: NODE_COLORS[node.type] || '#00F0FF' }} />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[#E8ECF1] truncate">{node.name}</div>
            <div className="text-[9px] text-[#4A5568]">{EDGE_LABELS[edge.type] || edge.type} · 强度 {edge.weight || 50}</div>
          </div>
          <div className="w-6 h-1 bg-white/5 rounded-full overflow-hidden shrink-0">
            <div className="h-full rounded-full" style={{ width: `${node.heat}%`, background: NODE_COLORS[node.type] || '#00F0FF' }} />
          </div>
          <span className="text-[10px] font-mono text-[#4A5568] w-6 text-right">{node.heat}</span>
        </div>
      ))}
    </div>
  );
}
