import { useState } from 'react';
import { useStore } from '../../store/useStore';

const NODE_COLORS = {
  technology: '#00F0FF', person: '#FF6B35', company: '#6C5CE7', resource: '#FFD700', concept: '#00D9A5',
};

const STAGE_COLORS = {
  completed: '#00D9A5',
  upcoming: '#00F0FF',
  active: '#FFD700',
};

export default function AnalysisPanel({ node }) {
  const analysis = node?.analysis || {};
  const hasContent = analysis.thesis || analysis.key_points?.length || analysis.risk;
  const [expanded, setExpanded] = useState(false);

  if (!hasContent) {
    return (
      <div className="glass-panel rounded-lg p-4 text-center">
        <div className="text-[#4A5568] text-xs">该节点暂无分析内容</div>
      </div>
    );
  }

  const growthPhases = analysis.growth_phases || [];
  const milestones = analysis.milestones || [];
  const keyMetrics = analysis.key_metrics || [];

  return (
    <div className="space-y-3">
      {/* 当前阶段标签 */}
      {analysis.current_stage && (
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 rounded-lg text-[10px] font-medium" style={{ background: '#00F0FF15', color: '#00F0FF', border: '1px solid #00F0FF30' }}>
            ◐ {analysis.current_stage}
          </div>
        </div>
      )}

      {/* 核心论点 */}
      {analysis.thesis && (
        <div className="glass-panel rounded-lg p-3">
          <div className="text-[10px] text-[#00F0FF] uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span>◆</span> 核心论点
          </div>
          <p className="text-xs text-[#E8ECF1] leading-relaxed">{analysis.thesis}</p>
        </div>
      )}

      {/* 关键指标 */}
      {keyMetrics.length > 0 && (
        <div className="glass-panel rounded-lg p-3">
          <div className="text-[10px] text-[#FFD700] uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>📊</span> 关键指标
          </div>
          <div className="grid grid-cols-3 gap-2">
            {keyMetrics.map((m, i) => (
              <div key={i} className="text-center">
                <div className="text-[9px] text-[#4A5568] mb-0.5">{m.label}</div>
                <div className="text-sm font-mono font-bold" style={{ color: m.trend === 'up' ? '#00D9A5' : '#FF6B35' }}>
                  {m.trend === 'up' ? '↑ ' : '↓ '}{m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 增长阶段 */}
      {growthPhases.length > 0 && (
        <div className="glass-panel rounded-lg p-3">
          <div className="text-[10px] text-[#6C5CE7] uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>📈</span> 增长阶段
          </div>
          <div className="space-y-2">
            {growthPhases.map((p, i) => {
              const stage = typeof p === 'string' ? p : (p.stage || p.name || '');
              const period = typeof p === 'string' ? '' : (p.period || p.time || '');
              const status = typeof p === 'string' ? '' : (p.status || '');
              const progress = typeof p === 'string' ? 0 : (p.progress || 0);
              const desc = typeof p === 'string' ? '' : (p.description || p.detail || '');
              const color = STAGE_COLORS[status] || '#8B95A5';
              return (
                <div key={i} className="relative pl-4">
                  {/* 左侧时间线 */}
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
                  {progress > 0 && (
                    <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, background: color }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 关键发现 */}
      {analysis.key_points?.length > 0 && (
        <div className="glass-panel rounded-lg p-3">
          <div className="text-[10px] text-[#00D9A5] uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>💡</span> 关键发现
          </div>
          <ul className="space-y-1.5">
            {analysis.key_points.map((point, i) => (
              <li key={i} className="text-xs text-[#E8ECF1] flex gap-2 leading-relaxed">
                <span className="text-[#00D9A5] shrink-0 font-mono">{String(i + 1).padStart(2, '0')}</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 风险 */}
      {analysis.risk && (
        <div className="glass-panel rounded-lg p-3" style={{ borderLeft: '2px solid #FF2E63' }}>
          <div className="text-[10px] text-[#FF2E63] uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>⚠</span> 风险因素
          </div>
          <p className="text-xs text-[#8B95A5] leading-relaxed">{analysis.risk}</p>
        </div>
      )}
    </div>
  );
}
