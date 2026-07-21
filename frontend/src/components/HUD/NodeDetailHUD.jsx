import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import CommentSection from '../Comments/CommentSection';
import AnalysisPanel from './AnalysisPanel';
import AssetCard from './AssetCard';
import TimelinePanel from './TimelinePanel';

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

  const isCompany = node?.type === 'company';
  const hasAsset = isCompany && (node?.asset || store.assets.some(a => a.node_id === node?.id));
  const hasAnalysis = node?.analysis || store.analyses[node?.id];
  const hasTimeline = hasAnalysis && (
    (hasAnalysis.analysis || store.analyses[node?.id])?.milestones?.length ||
    (hasAnalysis.analysis || store.analyses[node?.id])?.growth_phases?.length ||
    (hasAnalysis.analysis || store.analyses[node?.id])?.key_metrics?.length
  );

  // 构建 tabs
  const tabs = [
    { id: 'detail', label: '详情', show: true },
    { id: 'analysis', label: '分析', show: !!hasAnalysis },
    { id: 'timeline', label: '时间线', show: !!hasTimeline },
    { id: 'asset', label: '投资', show: hasAsset },
    { id: 'comment', label: '评论', show: true },
  ].filter(t => t.show);

  // 确保 rightPanelTab 在可见 tabs 中
  const activeTab = tabs.some(t => t.id === rightPanelTab) ? rightPanelTab : 'detail';

  return (
    <AnimatePresence>
      {store.detailPanelOpen && node && (
        <>
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]"
              onClick={() => store.closePanel()}
            />
          )}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full z-[70] flex flex-col"
            style={{
              width: isMobile ? '100%' : '360px',
              background: 'rgba(8, 12, 18, 0.96)',
              backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(0, 240, 255, 0.1)',
            }}
          >
            {/* 头部 */}
            <div className="shrink-0 p-4 border-b border-white/[0.06]">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: NODE_COLORS[node.type] || '#00F0FF', boxShadow: `0 0 8px ${NODE_COLORS[node.type] || '#00F0FF'}` }} />
                  <span className="text-[10px] text-[#4A5568] uppercase tracking-wider">{TYPE_LABELS[node.type] || '概念'}</span>
                </div>
                <button onClick={() => store.closePanel()} className="text-[#4A5568] hover:text-[#E8ECF1] text-lg leading-none">×</button>
              </div>
              <h2 className="text-lg font-bold text-[#E8ECF1] mb-1">{NODE_ICONS[node.type]} {node.name}</h2>
              {node.description && <p className="text-[11px] text-[#8B95A5] leading-relaxed">{node.description}</p>}
              {/* 热度/稀缺度 */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-[#4A5568]">热度</span>
                  <span className="text-xs font-mono font-bold" style={{ color: '#FF6B35' }}>{node.heat}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-[#4A5568]">稀缺</span>
                  <span className="text-xs font-mono font-bold" style={{ color: '#FFD700' }}>{node.scarcity}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-[#4A5568]">生命周期</span>
                  <span className="text-xs font-mono font-bold" style={{ color: '#00D9A5' }}>{node.lifecycle}%</span>
                </div>
              </div>
            </div>

            {/* Tabs — 移动端可横滚 */}
            <div className={`shrink-0 flex border-b border-white/[0.06] ${isMobile ? 'overflow-x-auto' : 'px-2'}`}
              style={isMobile ? { scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } : {}}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => store.setPanelTab(tab.id)}
                  className={`px-3 py-2 text-[11px] transition-colors border-b-2 whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? 'text-[#00F0FF] border-[#00F0FF]'
                      : 'text-[#4A5568] border-transparent hover:text-[#8B95A5]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeTab === 'detail' && <DetailTab node={node} store={store} />}
              {activeTab === 'analysis' && <AnalysisPanel node={node} />}
              {activeTab === 'timeline' && <TimelinePanel node={node} />}
              {activeTab === 'asset' && <AssetCard node={node} />}
              {activeTab === 'comment' && <CommentSection nodeId={node.id} themeId={themeId} />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DetailTab({ node, store }) {
  const relatedEdges = store.edges.filter(e => {
    const sid = typeof e.source === 'string' ? e.source : e.source?.id;
    const tid = typeof e.target === 'string' ? e.target : e.target?.id;
    return sid === node.id || tid === node.id;
  });

  return (
    <div className="space-y-3">
      {node.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {node.tags.map((tag, i) => (
            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-[#8B95A5]">{tag}</span>
          ))}
        </div>
      )}
      <div>
        <div className="text-[10px] text-[#4A5568] uppercase tracking-wider mb-2">关联节点</div>
        {relatedEdges.length === 0 ? (
          <div className="text-[11px] text-[#4A5568]">无关联节点</div>
        ) : (
          <div className="space-y-1">
            {relatedEdges.map(edge => {
              const sid = typeof edge.source === 'string' ? edge.source : edge.source?.id;
              const tid = typeof edge.target === 'string' ? edge.target : edge.target?.id;
              const otherId = sid === node.id ? tid : sid;
              const n = store.nodes.find(nn => nn.id === otherId);
              if (!n) return null;
              const selectNode = store.selectNode;
              const flyToNode = store.flyToNode;
              return (
                <div key={`${edge.id}-${otherId}`}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
