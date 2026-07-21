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

export default function AnalysisPanel({ node }) {
  const analysis = node?.analysis || useStore(s => s.analyses[node?.id]);
  const [expanded, setExpanded] = useState(false);

  if (!analysis) {
    return (
      <div className="glass-panel rounded-lg p-4 text-center">
        <div className="text-[#4A5568] text-xs">该节点暂无分析内容</div>
      </div>
    );
  }

  const color = NODE_COLORS[node.type] || '#00F0FF';

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

      {/* 时间窗口 */}
      {analysis.timeline && (
        <div className="glass-panel rounded-lg p-3">
          <div className="text-[10px] text-[#00F0FF] uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>⏱</span> 时间窗口
          </div>
          <p className="text-xs text-[#E8ECF1]">{analysis.timeline}</p>
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
