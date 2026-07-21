import { useStore } from '../../store/useStore';

const NODE_COLORS = {
  technology: '#00F0FF', person: '#FF6B35', company: '#6C5CE7', resource: '#FFD700', concept: '#00D9A5',
};

const STAGE_COLORS = {
  completed: '#00D9A5',
  upcoming: '#00F0FF',
  active: '#FFD700',
};

export default function TimelinePanel({ node }) {
  const analysis = node?.analysis || {};
  const milestones = analysis.milestones || [];
  const growthPhases = analysis.growth_phases || [];
  const keyMetrics = analysis.key_metrics || [];

  if (!milestones.length && !growthPhases.length && !keyMetrics.length) {
    return (
      <div className="glass-panel rounded-lg p-4 text-center">
        <div className="text-[#4A5568] text-xs">该节点暂无时间线数据</div>
      </div>
    );
  }

  // 按 year 排序 milestones
  const sortedMs = [...milestones].sort((a, b) => {
    const ya = typeof a === 'object' ? (a.year || '9999') : '9999';
    const yb = typeof b === 'object' ? (b.year || '9999') : '9999';
    return ya.localeCompare(yb);
  });

  return (
    <div className="space-y-3">
      {/* 关键指标 */}
      {keyMetrics.length > 0 && (
        <div className="glass-panel rounded-lg p-3">
          <div className="text-[10px] text-[#FFD700] uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>📊</span> 关键指标
          </div>
          <div className="grid grid-cols-3 gap-2">
            {keyMetrics.map((m, i) => (
              <div key={i} className="text-center glass-panel rounded p-2">
                <div className="text-[9px] text-[#4A5568] mb-0.5">{m.label}</div>
                <div className="text-sm font-mono font-bold" style={{ color: m.trend === 'up' ? '#00D9A5' : '#FF6B35' }}>
                  {m.trend === 'up' ? '↑' : '↓'} {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 增长阶段进度条 */}
      {growthPhases.length > 0 && (
        <div className="glass-panel rounded-lg p-3">
          <div className="text-[10px] text-[#6C5CE7] uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>📈</span> 增长阶段
          </div>
          {/* 整体进度条 */}
          <div className="flex items-center gap-1 mb-3">
            {growthPhases.map((p, i) => {
              const status = typeof p === 'object' ? (p.status || '') : '';
              const progress = typeof p === 'object' ? (p.progress || 0) : 0;
              const color = STAGE_COLORS[status] || '#8B95A5';
              return (
                <div key={i} className="flex-1">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: `${color}20` }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: color, boxShadow: `0 0 4px ${color}` }} />
                  </div>
                  <div className="text-[8px] text-center mt-0.5" style={{ color }}>{typeof p === 'object' ? (p.stage || '') : ''}</div>
                </div>
              );
            })}
          </div>
          {/* 详细列表 */}
          <div className="space-y-2">
            {growthPhases.map((p, i) => {
              const stage = typeof p === 'object' ? (p.stage || p.name || '') : p;
              const period = typeof p === 'object' ? (p.period || p.time || '') : '';
              const status = typeof p === 'object' ? (p.status || '') : '';
              const progress = typeof p === 'object' ? (p.progress || 0) : 0;
              const desc = typeof p === 'object' ? (p.description || p.detail || '') : '';
              const color = STAGE_COLORS[status] || '#8B95A5';
              return (
                <div key={i} className="relative pl-4">
                  <div className="absolute left-0 top-1 w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                  {i < growthPhases.length - 1 && (
                    <div className="absolute left-[3px] top-3 bottom-0 w-px" style={{ background: `${color}30` }} />
                  )}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-[#E8ECF1]">{stage}</span>
                    {period && <span className="text-[9px] text-[#4A5568] font-mono">{period}</span>}
                    {status && (
                      <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: `${color}15`, color }}>
                        {status === 'completed' ? '✓ 完成' : status === 'upcoming' ? '○ 待来' : '● 进行中'}
                      </span>
                    )}
                  </div>
                  {desc && <p className="text-[10px] text-[#8B95A5] leading-relaxed">{desc}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 里程碑时间线 */}
      {sortedMs.length > 0 && (
        <div className="glass-panel rounded-lg p-3">
          <div className="text-[10px] text-[#00F0FF] uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>⏱</span> 里程碑
          </div>
          <div className="space-y-2">
            {sortedMs.map((m, i) => {
              const year = typeof m === 'object' ? (m.year || '') : '';
              const event = typeof m === 'object' ? (m.event || m.description || '') : (typeof m === 'string' ? m : '');
              const impact = typeof m === 'object' ? (m.impact || '') : '';
              const quarter = typeof m === 'object' ? (m.quarter || '') : '';
              const impactColor = impact === 'high' ? '#FF2E63' : impact === 'medium' ? '#FFD700' : '#8B95A5';
              return (
                <div key={i} className="relative pl-8">
                  {/* 年份标签 */}
                  <div className="absolute left-0 top-0 text-[10px] font-mono font-bold text-[#00F0FF] w-7">
                    {year}
                  </div>
                  {/* 竖线 */}
                  {i < sortedMs.length - 1 && (
                    <div className="absolute left-[14px] top-4 bottom-0 w-px" style={{ background: '#00F0FF20' }} />
                  )}
                  {/* 圆点 */}
                  <div className="absolute left-[12px] top-1.5 w-1.5 h-1.5 rounded-full" style={{ background: '#00F0FF', boxShadow: '0 0 4px #00F0FF' }} />
                  {/* 内容 */}
                  <div className="flex items-start gap-2">
                    <p className="text-xs text-[#E8ECF1] leading-relaxed flex-1">{event}</p>
                    {quarter && <span className="text-[8px] text-[#4A5568] font-mono shrink-0">{quarter}</span>}
                    {impact && <span className="text-[8px] px-1 py-0.5 rounded shrink-0" style={{ background: `${impactColor}15`, color: impactColor }}>{impact}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
