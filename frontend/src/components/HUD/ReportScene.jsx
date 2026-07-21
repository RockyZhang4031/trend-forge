import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';

function CountUp({ target, duration = 1500, suffix = '' }) {
  const [val, setVal] = useState(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    let raf;
    const animate = (ts) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const progress = Math.min((ts - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return <span>{val}{suffix}</span>;
}

function RadarChart({ data, color = '#00F0FF' }) {
  const size = 200;
  const center = size / 2;
  const maxR = 70;
  const angleStep = (Math.PI * 2) / data.length;

  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (d.value / 100) * maxR;
    return { x: center + Math.cos(angle) * r, y: center + Math.sin(angle) * r, label: d.label };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join('') + 'Z';
  const labelPositions = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return { x: center + Math.cos(angle) * (maxR + 20), y: center + Math.sin(angle) * (maxR + 20) };
  });

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* 网格 */}
      {[0.3, 0.6, 1].map(scale => (
        <circle key={scale} cx={center} cy={center} r={maxR * scale} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* 轴线 */}
      {data.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return <line key={i} x1={center} y1={center} x2={center + Math.cos(angle) * maxR} y2={center + Math.sin(angle) * maxR} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
      })}
      {/* 数据 */}
      <motion.path
        d={pathData}
        fill={`${color}20`}
        stroke={color}
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      {/* 数据点 */}
      {points.map((p, i) => (
        <motion.circle
          key={i} cx={p.x} cy={p.y} r="3" fill={color}
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
        />
      ))}
      {/* 标签 */}
      {labelPositions.map((pos, i) => (
        <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fill="#8B95A5" fontSize="10" fontWeight="500">
          {data[i].label}
        </text>
      ))}
    </svg>
  );
}

function TimelineBar({ milestones }) {
  return (
    <div className="relative px-4 py-6">
      <div className="relative h-1 bg-white/5 rounded-full">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #00F0FF, #00D9A5)' }}
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
        {milestones.map((m, i) => {
          const pct = (i / (milestones.length - 1)) * 100;
          return (
            <motion.div
              key={i}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${pct}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.3 }}
            >
              <div className="w-3 h-3 rounded-full -translate-x-1/2" style={{ background: '#00F0FF', boxShadow: '0 0 8px #00F0FF' }} />
              <div className="absolute top-5 left-0 -translate-x-1/2 text-center whitespace-nowrap">
                <div className="text-[11px] font-mono text-[#00F0FF]">{m.year}</div>
                <div className="text-[10px] text-[#8B95A5]">{m.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Scene({ sceneIdx, report, analyses, assets, nodes, onClose }) {
  const selectNode = useStore(s => s.selectNode);
  const flyToNode = useStore(s => s.flyToNode);
  const closeReport = useStore(s => s.closeReport);

  if (!report) return null;
  const parsed = typeof report === 'string' ? JSON.parse(report) : report;

  switch (sceneIdx) {
    case 0:
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}>
            <div className="relative">
              <div className="text-7xl font-mono font-bold" style={{ color: '#00F0FF', textShadow: '0 0 40px #00F0FF80' }}>
                <CountUp target={parsed.overall_score || 85} />
              </div>
              <div className="absolute -inset-4 rounded-full" style={{ boxShadow: '0 0 60px #00F0FF30' }} />
            </div>
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 text-center">
            <div className="text-sm text-[#E8ECF1] font-medium">{parsed.title}</div>
            <div className="text-[10px] text-[#4A5568] mt-1">趋势确定指数</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-6 flex gap-3">
            {[
              { label: '技术', value: parsed.dimension_scores?.technology || 80, color: '#00F0FF' },
              { label: '资源', value: parsed.dimension_scores?.resource || 75, color: '#FFD700' },
              { label: '资本', value: parsed.dimension_scores?.capital || 85, color: '#6C5CE7' },
              { label: '确定性', value: parsed.dimension_scores?.certainty || 90, color: '#00D9A5' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 + i * 0.15 }} className="glass-panel rounded-lg px-4 py-2 text-center">
                <div className="text-[9px] text-[#4A5568] uppercase">{s.label}</div>
                <div className="text-lg font-mono font-bold" style={{ color: s.color }}><CountUp target={s.value} delay={300} /></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      );

    case 1:
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-[#00F0FF] uppercase tracking-wider mb-4">稀缺地图</motion.div>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}>
            <RadarChart data={[
              { label: '技术', value: parsed.dimension_scores?.technology || 80 },
              { label: '资源', value: parsed.dimension_scores?.resource || 75 },
              { label: '人才', value: parsed.dimension_scores?.talent || 70 },
              { label: '资本', value: parsed.dimension_scores?.capital || 85 },
              { label: '政策', value: parsed.dimension_scores?.policy || 65 },
            ]} />
          </motion.div>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="mt-4 text-xs text-[#8B95A5] text-center max-w-md">
            {parsed.scarcity_analysis || '技术成熟度和资源稀缺度是决定趋势节奏的关键维度'}
          </motion.p>
        </div>
      );

    case 2:
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-[#00D9A5] uppercase tracking-wider mb-6">关键发现</motion.div>
          <div className="space-y-3 w-full">
            {(parsed.key_findings || []).map((finding, i) => (
              <motion.div
                key={i}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.4 }}
                className="glass-panel rounded-lg p-3 flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#00D9A515', border: '1px solid #00D9A540' }}>
                  <span className="text-[10px] font-mono text-[#00D9A5]">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <p className="text-xs text-[#E8ECF1] leading-relaxed">{finding}</p>
              </motion.div>
            ))}
          </div>
        </div>
      );

    case 3:
      const targetAssets = assets || [];
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-[#6C5CE7] uppercase tracking-wider mb-6">投资标的</motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl">
            {targetAssets.map((a, i) => {
              const node = nodes.find(n => n.id === a.node_id);
              const color = a.is_listed ? '#00D9A5' : '#FF6B35';
              return (
                <motion.div
                  key={i}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.3 }}
                  className="glass-panel rounded-lg p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => { selectNode(a.node_id); flyToNode(a.node_id); closeReport(); }}
                  style={{ borderLeft: `2px solid ${color}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-[#E8ECF1]">{a.node_name}</div>
                      <div className="text-[10px] text-[#4A5568]">{a.is_listed ? '📈 上市' : '🔒 未上市'}{a.ticker && ` · ${a.ticker}`}{a.exchange && ` · ${a.exchange}`}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1 text-center">
                      <div className="text-[8px] text-[#4A5568]">敞口</div>
                      <div className="text-sm font-mono font-bold" style={{ color }}>{a.exposure_score || 50}</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-[8px] text-[#4A5568]">上行</div>
                      <div className="text-sm font-mono font-bold" style={{ color: '#00D9A5' }}>{a.upside_score || 50}</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-[8px] text-[#4A5568]">确定性</div>
                      <div className="text-sm font-mono font-bold" style={{ color: '#00F0FF' }}>{a.certainty_score || 50}</div>
                    </div>
                  </div>
                  {a.investment_thesis && (
                    <p className="text-[10px] text-[#8B95A5] leading-relaxed line-clamp-2">{a.investment_thesis}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      );

    case 4:
      const timeline = parsed.timeline || [];
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-[#00F0FF] uppercase tracking-wider mb-8">时间窗口</motion.div>
          {timeline.length > 0 && <TimelineBar milestones={timeline.map(t => ({ year: t.year, label: t.label }))} />}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 2 }} className="mt-12 grid grid-cols-2 gap-4 max-w-lg">
            {timeline.map((t, i) => (
              <div key={i} className="glass-panel rounded-lg p-3">
                <div className="text-[10px] font-mono text-[#00F0FF] mb-1">{t.year}</div>
                <div className="text-xs text-[#E8ECF1] font-medium mb-1">{t.label}</div>
                {t.description && <div className="text-[10px] text-[#8B95A5]">{t.description}</div>}
              </div>
            ))}
          </motion.div>
        </div>
      );

    default:
      return null;
  }
}

export default function ReportScene() {
  const reportOpen = useStore(s => s.reportOpen);
  const closeReport = useStore(s => s.closeReport);
  const themeReport = useStore(s => s.themeReport);
  const assets = useStore(s => s.assets);
  const nodes = useStore(s => s.nodes);
  const analyses = useStore(s => s.analyses);
  const currentTheme = useStore(s => s.currentTheme);

  const [sceneIdx, setSceneIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const totalScenes = 5;

  // 解析报告
  const parsed = useMemo(() => {
    if (!themeReport) return null;
    try {
      const raw = themeReport.raw_content || themeReport.result_summary || '';
      if (typeof raw === 'string') return JSON.parse(raw);
      return raw;
    } catch {
      return null;
    }
  }, [themeReport]);

  useEffect(() => {
    if (reportOpen) { setSceneIdx(0); setAutoPlay(true); }
  }, [reportOpen]);

  useEffect(() => {
    if (!reportOpen || !autoPlay) return;
    if (sceneIdx >= totalScenes - 1) { setAutoPlay(false); return; }
    const timer = setTimeout(() => setSceneIdx(i => i + 1), 3500);
    return () => clearTimeout(timer);
  }, [sceneIdx, reportOpen, autoPlay]);

  if (!reportOpen || !parsed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[60] flex flex-col"
        style={{ background: 'rgba(5, 7, 10, 0.95)', backdropFilter: 'blur(20px)' }}
      >
        {/* 顶部进度条 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#4A5568]">TREND REPORT</span>
            <div className="flex gap-1">
              {Array.from({ length: totalScenes }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setSceneIdx(i); setAutoPlay(false); }}
                  className={`h-1 rounded-full transition-all ${i === sceneIdx ? 'w-8 bg-[#00F0FF]' : i < sceneIdx ? 'w-4 bg-[#00F0FF]/50' : 'w-4 bg-white/10'}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#4A5568]">{sceneIdx + 1} / {totalScenes}</span>
            <button onClick={closeReport} className="text-[#4A5568] hover:text-[#E8ECF1] text-lg leading-none">×</button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          <Scene
            sceneIdx={sceneIdx}
            report={parsed}
            analyses={analyses}
            assets={assets}
            nodes={nodes}
            onClose={closeReport}
          />
        </div>

        {/* 底部控制 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
          <button
            onClick={() => { setSceneIdx(i => Math.max(0, i - 1)); setAutoPlay(false); }}
            disabled={sceneIdx === 0}
            className="text-[11px] text-[#4A5568] hover:text-[#E8ECF1] disabled:opacity-30"
          >
            ◀ 上一幕
          </button>

          <div className="text-[10px] text-[#4A5568]">
            {currentTheme?.name} · 趋势简报
          </div>

          <div className="flex items-center gap-3">
            {sceneIdx < totalScenes - 1 ? (
              <button
                onClick={() => { setSceneIdx(i => i + 1); setAutoPlay(false); }}
                className="text-[11px] text-[#00F0FF] hover:text-[#00D9A5]"
              >
                下一幕 ▶
              </button>
            ) : (
              <button
                onClick={closeReport}
                className="text-[11px] px-3 py-1 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-colors"
              >
                完成 ✓
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
