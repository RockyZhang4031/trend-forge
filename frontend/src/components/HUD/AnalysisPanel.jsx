import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';

const NODE_COLORS = {
  technology: '#00F0FF', person: '#FF6B35', company: '#6C5CE7', resource: '#FFD700', concept: '#00D9A5',
};

function Typewriter({ text, speed = 20, onComplete }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    idxRef.current = 0;
    if (!text) return;

    const timer = setInterval(() => {
      if (idxRef.current < text.length) {
        setDisplayed(text.substring(0, idxRef.current + 1));
        idxRef.current++;
      } else {
        setDone(true);
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-1.5 h-3 bg-[#00F0FF] animate-pulse ml-0.5 align-middle" />}
    </span>
  );
}

function MetricChip({ label, value, color }) {
  return (
    <div className="glass-panel rounded px-2 py-1 text-center min-w-[60px]">
      <div className="text-[8px] text-[#4A5568] uppercase">{label}</div>
      <div className="text-xs font-mono font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

export default function AnalysisPanel({ node }) {
  const analyses = useStore(s => s.analyses);
  const analysis = node?.analysis || analyses[node?.id];
  const [expanded, setExpanded] = useState(false);

  if (!analysis) {
    return (
      <div className="glass-panel rounded-lg p-4 text-center">
        <div className="text-[#4A5568] text-xs">该节点暂无分析内容</div>
      </div>
    );
  }

  const color = NODE_COLORS[node.type] || '#00F0FF';

  // milestones 是数组，每个有 year + event
  const milestones = analysis.milestones || [];
  // growth_phases 是数组
  const growthPhases = analysis.growth_phases || [];
  // key_metrics 是对象
  const keyMetrics = analysis.key_metrics || {};

  return (
    <div className="space-y-3">
      {/* 核心论点 - 打字机 */}
      <div className="glass-panel rounded-lg p-3">
        <div className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color }}>
          <span>🎯</span> 核心论点
        </div>
        <p className="text-xs text-[#E8ECF1] leading-relaxed">
          <Typewriter text={analysis.thesis || ''} speed={15} />
        </p>
      </div>

      {/* 一句话结论 */}
      {analysis.conclusion && (
        <div className="glass-panel rounded-lg p-3" style={{ borderLeft: `2px solid ${color}` }}>
          <div className="text-[10px] text-[#4A5568] uppercase tracking-wider mb-1">结论</div>
          <p className="text-xs font-medium text-[#E8ECF1] leading-relaxed">{analysis.conclusion}</p>
        </div>
      )}

      {/* 关键指标 */}
      {Object.keys(keyMetrics).length > 0 && (
        <div className="glass-panel rounded-lg p-3">
          <div className="text-[10px] text-[#FFD700] uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>📊</span> 关键指标
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(keyMetrics).map(([k, v]) => (
              <MetricChip key={k} label={k} value={v} color="#FFD700" />
            ))}
          </div>
        </div>
      )}

      {/* 当前阶段 */}
      {analysis.current_stage && (
        <div className="glass-panel rounded-lg p-3">
          <div className="text-[10px] text-[#00F0FF] uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>📍</span> 当前阶段
          </div>
          <p className="text-xs text-[#E8ECF1]">{analysis.current_stage}</p>
        </div>
      )}

      {/* 关键发现 */}
      {analysis.key_points && analysis.key_points.length > 0 && (
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

      {/* 里程碑 */}
      {milestones.length > 0 && (
        <div className="glass-panel rounded-lg p-3">
          <div className="text-[10px] text-[#00F0FF] uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>⏱</span> 里程碑
          </div>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-[10px] font-mono text-[#00F0FF] shrink-0 mt-0.5">{m.year || m.date || `T+${i}`}</span>
                <span className="text-xs text-[#E8ECF1] leading-relaxed">{m.event || m.description || m.title || ''}</span>
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
          <div className="space-y-1.5">
            {growthPhases.map((p, i) => (
              <div key={i} className="text-xs text-[#E8ECF1] flex gap-2">
                <span className="text-[#6C5CE7] shrink-0">→</span>
                <span>{typeof p === 'string' ? p : (p.phase || p.name || '') + ': ' + (p.description || p.detail || '')}</span>
              </div>
            ))}
          </div>
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
