import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import CommentSection from '../Comments/CommentSection';
import AnalysisPanel from './AnalysisPanel';
import AssetCard from './AssetCard';

const NODE_COLORS = {
  technology: '#00F0FF', person: '#FF6B35', company: '#6C5CE7', resource: '#FFD700', concept: '#00D9A5',
};
const NODE_ICONS = {
  technology: '⚙️', person: '👤', company: '🏢', resource: '💎', concept: '🚀',
};
const TYPE_LABELS = {
  technology: '技术', person: '人物', company: '公司', resource: '资源', concept: '概念',
};
const EDGE_LABELS = {
  drives: '驱动', depends: '依赖', competes: '竞争', belongs: '属于',
};

export default function NodeDetailHUD({ themeId, isMobile }) {
  const store = useStore();
  const node = store.nodes.find(n => n.id === store.selectedNodeId);
  const rightPanelTab = store.rightPanelTab;
  const hasAsset = node?.type === 'company' || node?.asset;
  const hasAnalysis = node?.analysis || store.analyses[node?.id];

  const tabs = [
    { key: 'detail', label: '详情', icon: '📋' },
    { key: 'analysis', label: '分析', icon: '🧠', show: hasAnalysis },
    { key: 'asset', label: '投资', icon: '📊', show: hasAsset },
    { key: 'comments', label: '评论', icon: '💬' },
  ].filter(t => t.show !== false);

  // 确保当前 tab 可用
  const currentTab = tabs.find(t => t.key === rightPanelTab) ? rightPanelTab : 'detail';

  return (
    <AnimatePresence>
      {store.detailPanelOpen && node && (
        <>
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-40"
              onClick={() => store.closePanel()}
            />
          )}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute top-0 right-0 bottom-0 z-50 flex flex-col"
            style={{
              width: isMobile ? '100%' : '340px',
              background: 'rgba(8, 12, 18, 0.92)',
              backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* 头部 */}
            <div className="p-3 border-b border-white/[0.06]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${NODE_COLORS[node.type]}15`, border: `1px solid ${NODE_COLORS[node.type]}40` }}>
                    <span className="text-sm">{NODE_ICONS[node.type]}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#E8ECF1]">{node.name}</div>
                    <div className="text-[10px] text-[#4A5568]">{TYPE_LABELS[node.type]}</div>
                  </div>
                </div>
                <button onClick={() => store.closePanel()} className="text-[#4A5568] hover:text-[#E8ECF1] text-lg leading-none">×</button>
              </div>

              {/* 评分 */}
              <div className="flex gap-2">
                {[
                  { label: '热度', value: node.heat, color: '#FF6B35' },
                  { label: '稀缺', value: node.scarcity, color: '#FFD700' },
                  { label: '阶段', value: node.lifecycle, color: '#00D9A5' },
                ].map(s => (
                  <div key={s.label} className="flex-1 glass-panel rounded p-1.5 text-center">
                    <div className="text-[8px] text-[#4A5568] uppercase">{s.label}</div>
                    <div className="text-sm font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab 栏 */}
            <div className="flex border-b border-white/[0.06]">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => store.setPanelTab(tab.key)}
                  className={`flex-1 px-2 py-2 text-[11px] transition-colors ${
                    currentTab === tab.key
                      ? 'text-[#00F0FF] border-b-2 border-[#00F0FF]'
                      : 'text-[#4A5568] hover:text-[#8B95A5] border-b-2 border-transparent'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>{tab.label}
                </button>
              ))}
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto p-3">
              {currentTab === 'detail' && (
                <div className="space-y-3">
                  {node.description && (
                    <div>
                      <div className="text-[10px] text-[#4A5568] uppercase tracking-wider mb-1">描述</div>
                      <p className="text-xs text-[#E8ECF1] leading-relaxed">{node.description}</p>
                    </div>
                  )}
                  <RelatedNodes node={node} />
                </div>
              )}

              {currentTab === 'analysis' && <AnalysisPanel node={node} />}

              {currentTab === 'asset' && <AssetCard node={node} />}

              {currentTab === 'comments' && (
                <CommentSection nodeId={node.id} themeId={themeId} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function RelatedNodes({ node }) {
  const edges = useStore(s => s.edges);
  const nodes = useStore(s => s.nodes);
  const selectNode = useStore(s => s.selectNode);
  const flyToNode = useStore(s => s.flyToNode);

  const related = edges
    .filter(e => e.source === node.id || e.target === node.id)
    .map(e => {
      const otherId = e.source === node.id ? e.target : e.source;
      const other = nodes.find(n => n.id === otherId);
      return other ? { node: other, edge: e } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.edge.weight - a.edge.weight);

  if (related.length === 0) return null;

  return (
    <div>
      <div className="text-[10px] text-[#4A5568] uppercase tracking-wider mb-2">关联节点 ({related.length})</div>
      <div className="space-y-1">
        {related.map(({ node: n, edge }) => (
          <div key={n.id}
            className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer transition-colors"
            onClick={() => { selectNode(n.id); flyToNode(n.id); }}>
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: NODE_COLORS[n.type] || '#00F0FF' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#E8ECF1] truncate">{n.name}</div>
              <div className="text-[9px] text-[#4A5568]">{EDGE_LABELS[edge.type] || edge.type} · 强度 {edge.weight || 50}</div>
            </div>
            <div className="w-6 h-1 bg-white/5 rounded-full overflow-hidden shrink-0">
              <div className="h-full rounded-full" style={{ width: `${n.heat}%`, background: NODE_COLORS[n.type] || '#00F0FF' }} />
            </div>
            <span className="text-[10px] font-mono text-[#4A5568] w-6 text-right">{n.heat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
