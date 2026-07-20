import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';

const NODE_COLORS = {
  technology: '#00F0FF',
  person: '#FF6B35',
  company: '#6C5CE7',
  resource: '#FFD700',
  concept: '#00D9A5',
};

const NODE_LABELS = {
  technology: '技术',
  person: '人物',
  company: '公司',
  resource: '资源',
  concept: '概念',
};

/**
 * 信息仪表盘 — 悬浮在 3D 图谱上方，用户不点也能看到关键信息
 * 
 * 包含：
 * - 关键指标卡（总节点/关系数、平均热度、平均稀缺度）
 * - 热度 Top 5 排行（横向条形图）
 * - 稀缺 Top 5 排行（横向条形图）
 * - 类型分布（环形比例条）
 * - 颜色图例
 */
export default function InsightsDashboard({ isMobile }) {
  const nodes = useStore(s => s.nodes);
  const selectNode = useStore(s => s.selectNode);
  const [collapsed, setCollapsed] = useState(false);

  const stats = useMemo(() => {
    if (!nodes.length) return null;

    // 热度 Top 5
    const byHeat = [...nodes].sort((a, b) => (b.heat || 0) - (a.heat || 0)).slice(0, 5);

    // 稀缺 Top 5
    const byScarcity = [...nodes].sort((a, b) => (b.scarcity || 0) - (a.scarcity || 0)).slice(0, 5);

    // 类型分布
    const typeCounts = {};
    nodes.forEach(n => {
      const t = n.type || 'concept';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });

    // 平均值
    const avgHeat = nodes.reduce((s, n) => s + (n.heat || 0), 0) / nodes.length;
    const avgScarcity = nodes.reduce((s, n) => s + (n.scarcity || 0), 0) / nodes.length;

    return { byHeat, byScarcity, typeCounts, avgHeat, avgScarcity };
  }, [nodes]);

  if (!stats) return null;

  const maxHeat = stats.byHeat[0]?.heat || 100;
  const maxScarcity = stats.byScarcity[0]?.scarcity || 100;

  // 移动端：底部紧凑横排
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed left-2 right-2 z-30 pointer-events-auto"
        style={{ bottom: 52 }}
      >
        {/* 关键指标 — 横排 */}
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          <MetricChip label="节点" value={nodes.length} color="#00F0FF" />
          <MetricChip label="关系" value={useStore(s => s.edges.length)} color="#6C5CE7" />
          <MetricChip label="均热度" value={Math.round(stats.avgHeat)} color="#FF6B35" />
          <MetricChip label="均稀缺" value={Math.round(stats.avgScarcity)} color="#FF2E63" />
        </div>

        {/* 热度 Top 3 — 紧凑 */}
        <div className="glass-panel rounded-lg p-2">
          <div className="text-[9px] uppercase tracking-wider text-[#4A5568] mb-1">🔥 热度 TOP 3</div>
          {stats.byHeat.slice(0, 3).map((n, i) => (
            <div key={n.id} className="flex items-center gap-1.5 py-0.5 cursor-pointer"
              onClick={() => selectNode(n.id)}
            >
              <span className="text-[10px] font-mono text-[#4A5568] w-3">{i + 1}</span>
              <span className="text-[10px] text-[#E8ECF1] flex-1 truncate">{n.name}</span>
              <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(n.heat / maxHeat) * 100}%`, background: NODE_COLORS[n.type] || '#00F0FF' }} />
              </div>
              <span className="text-[10px] font-mono w-6 text-right" style={{ color: NODE_COLORS[n.type] || '#00F0FF' }}>{n.heat}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // 桌面端：右侧浮动面板，可折叠
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
      className="fixed z-30 pointer-events-auto"
      style={{ top: 60, right: 16, width: collapsed ? 44 : 260 }}
    >
      {/* 折叠/展开按钮 */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full mb-2 flex items-center justify-between glass-panel rounded-lg p-2 hover:bg-white/5 transition-colors"
      >
        <span className="text-[10px] uppercase tracking-wider text-[#8B95A5] font-medium">
          {collapsed ? '📊' : '数据面板'}
        </span>
        {!collapsed && <span className="text-[10px] text-[#4A5568]">收起 ▸</span>}
      </button>

      {!collapsed && (
        <>
      {/* 关键指标卡 */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <MetricCard label="节点总数" value={nodes.length} color="#00F0FF" />
        <MetricCard label="关系总数" value={useStore(s => s.edges.length)} color="#6C5CE7" />
        <MetricCard label="平均热度" value={Math.round(stats.avgHeat)} color="#FF6B35" />
        <MetricCard label="平均稀缺" value={Math.round(stats.avgScarcity)} color="#FF2E63" />
      </div>

      {/* 热度 Top 5 */}
      <div className="glass-panel rounded-xl p-3 mb-2">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px]">🔥</span>
          <span className="text-[10px] uppercase tracking-wider text-[#8B95A5] font-medium">热度排行</span>
        </div>
        {stats.byHeat.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.05 }}
            className="flex items-center gap-2 py-1 cursor-pointer rounded px-1 hover:bg-white/5 transition-colors"
            onClick={() => selectNode(n.id)}
          >
            <span className="text-[10px] font-mono text-[#4A5568] w-4">{i + 1}</span>
            <span className="text-[11px] text-[#E8ECF1] flex-1 truncate">{n.name}</span>
            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden shrink-0">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(n.heat / maxHeat) * 100}%` }}
                transition={{ delay: 0.7 + i * 0.05, duration: 0.4 }}
                className="h-full rounded-full"
                style={{ background: NODE_COLORS[n.type] || '#00F0FF', boxShadow: `0 0 4px ${NODE_COLORS[n.type] || '#00F0FF'}` }}
              />
            </div>
            <span className="text-[10px] font-mono w-7 text-right" style={{ color: NODE_COLORS[n.type] || '#00F0FF' }}>{n.heat}</span>
          </motion.div>
        ))}
      </div>

      {/* 稀缺 Top 5 */}
      <div className="glass-panel rounded-xl p-3 mb-2">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px]">💎</span>
          <span className="text-[10px] uppercase tracking-wider text-[#8B95A5] font-medium">稀缺排行</span>
        </div>
        {stats.byScarcity.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.05 }}
            className="flex items-center gap-2 py-1 cursor-pointer rounded px-1 hover:bg-white/5 transition-colors"
            onClick={() => selectNode(n.id)}
          >
            <span className="text-[10px] font-mono text-[#4A5568] w-4">{i + 1}</span>
            <span className="text-[11px] text-[#E8ECF1] flex-1 truncate">{n.name}</span>
            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden shrink-0">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(n.scarcity / maxScarcity) * 100}%` }}
                transition={{ delay: 0.9 + i * 0.05, duration: 0.4 }}
                className="h-full rounded-full"
                style={{
                  background: n.scarcity > 75 ? '#FF2E63' : n.scarcity > 50 ? '#FF6B35' : n.scarcity > 30 ? '#00F0FF' : '#00D9A5',
                  boxShadow: `0 0 4px ${n.scarcity > 75 ? '#FF2E63' : n.scarcity > 50 ? '#FF6B35' : n.scarcity > 30 ? '#00F0FF' : '#00D9A5'}`,
                }}
              />
            </div>
            <span className="text-[10px] font-mono w-7 text-right" style={{
              color: n.scarcity > 75 ? '#FF2E63' : n.scarcity > 50 ? '#FF6B35' : n.scarcity > 30 ? '#00F0FF' : '#00D9A5',
            }}>{n.scarcity}</span>
          </motion.div>
        ))}
      </div>

      {/* 类型分布 + 图例 */}
      <div className="glass-panel rounded-xl p-3">
        <div className="text-[10px] uppercase tracking-wider text-[#8B95A5] font-medium mb-2">类型分布</div>
        {/* 比例条 */}
        <div className="flex h-2 rounded-full overflow-hidden mb-2">
          {Object.entries(stats.typeCounts).map(([type, count]) => (
            <div
              key={type}
              style={{
                width: `${(count / nodes.length) * 100}%`,
                background: NODE_COLORS[type] || '#8B95A5',
                boxShadow: `0 0 6px ${NODE_COLORS[type] || '#8B95A5'}80`,
              }}
              title={`${NODE_LABELS[type] || type}: ${count}`}
            />
          ))}
        </div>
        {/* 图例 */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(stats.typeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: NODE_COLORS[type] || '#8B95A5' }} />
              <span className="text-[9px] text-[#8B95A5]">{NODE_LABELS[type] || type}</span>
              <span className="text-[9px] font-mono text-[#4A5568]">{count}</span>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </motion.div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="glass-panel rounded-lg p-2 relative overflow-hidden">
      <div className="absolute left-0 top-0 w-0.5 h-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
      <div className="text-[9px] text-[#4A5568] uppercase tracking-wider ml-1.5">{label}</div>
      <div className="text-lg font-bold font-mono ml-1.5" style={{ color }}>{value}</div>
    </div>
  );
}

function MetricChip({ label, value, color }) {
  return (
    <div className="glass-panel rounded p-1 text-center">
      <div className="text-[8px] text-[#4A5568] uppercase">{label}</div>
      <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
    </div>
  );
}
