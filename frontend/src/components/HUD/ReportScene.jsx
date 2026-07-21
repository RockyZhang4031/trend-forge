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
  const size = 280;
  const center = size / 2;
  const maxR = 95;
  const angleStep = (Math.PI * 2) / data.length;

  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (d.value / 100) * maxR;
    return { x: center + Math.cos(angle) * r, y: center + Math.sin(angle) * r, label: d.label };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join('') + 'Z';
  const labelPositions = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return { x: center + Math.cos(angle) * (maxR + 28), y: center + Math.sin(angle) * (maxR + 28) };
  });

  return (
    <svg width={size} height={size} className="mx-auto">
      {[0.25, 0.5, 0.75, 1].map(scale => (
        <circle key={scale} cx={center} cy={center} r={maxR * scale} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return <line key={i} x1={center} y1={center} x2={center + Math.cos(angle) * maxR} y2={center + Math.sin(angle) * maxR} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
      })}
      <motion.path
        d={pathData}
        fill={`${color}15`}
        stroke={color}
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      {points.map((p, i) => (
        <motion.circle
          key={i} cx={p.x} cy={p.y} r="4" fill={color}
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
        />
      ))}
      {labelPositions.map((pos, i) => (
        <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fill="#8B95A5" fontSize="12" fontWeight="500">
          {data[i].label}
          <tspan x={pos.x} y={pos.y + 14} fill={color} fontSize="11" fontFamily="monospace">{data[i].value}</tspan>
        </text>
      ))}
    </svg>
  );
}

// 从所有节点的 milestones 聚合完整时间线
function aggregateTimeline(analyses) {
  const all = [];
  for (const [nodeId, data] of Object.entries(analyses)) {
    const ms = data.milestones || data.analysis?.milestones || [];
    ms.forEach(m => {
      if (typeof m === 'object' && m.year) {
        all.push({ year: m.year, event: m.event, node: data.node_name || nodeId, impact: m.impact, quarter: m.quarter });
      }
    });
  }
  // 按年份排序
  all.sort((a, b) => a.year.localeCompare(b.year));
  return all;
}

function FullTimeline({ milestones }) {
  if (!milestones.length) return null;
  const years = [...new Set(milestones.map(m => m.year))].sort();

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* 水平时间轴 */}
      <div className="relative mb-8">
        <div className="relative h-0.5 bg-white/5 rounded-full">
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #00F0FF, #00D9A5)' }}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
          {years.map((year, i) => {
            const pct = years.length === 1 ? 50 : (i / (years.length - 1)) * 100;
            return (
              <motion.div
                key={year}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${pct}%` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.2 }}
              >
                <div className="w-3 h-3 rounded-full -translate-x-1/2" style={{ background: '#00F0FF', boxShadow: '0 0 8px #00F0FF' }} />
                <div className="absolute top-5 left-0 -translate-x-1/2 text-[12px] font-mono text-[#00F0FF] whitespace-nowrap">{year}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 事件列表 - 按年份分组 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {years.map((year, yi) => {
          const yearEvents = milestones.filter(m => m.year === year);
          return (
            <motion.div
              key={year}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 + yi * 0.3 }}
              className="glass-panel rounded-lg p-3"
            >
              <div className="text-[14px] font-mono font-bold text-[#00F0FF] mb-2">{year}</div>
              <div className="space-y-1.5">
                {yearEvents.map((e, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: e.impact === 'high' ? '#FF6B35' : '#00F0FF' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#E8ECF1] leading-relaxed">{e.event}</p>
                      <span className="text-[9px] text-[#4A5568]">{e.node}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Scene({ sceneIdx, report, assets, nodes, analyses }) {
  const selectNode = useStore(s => s.selectNode);
  const flyToNode = useStore(s => s.flyToNode);
  const closeReport = useStore(s => s.closeReport);

  if (!report) return null;

  const scores = report.scores || {};
  const scarcity = report.scarcity_map || {};
  const findings = report.key_findings || [];
  const targets = report.investment_targets || [];
  const timeline = report.timeline || [];
  const sections = report.report_sections || [];

  // 聚合所有节点的 milestones
  const allMilestones = useMemo(() => {
    const ms = [];
    for (const data of Object.values(analyses)) {
      const m = data.milestones || [];
      m.forEach(item => {
        if (typeof item === 'object' && item.year) {
          ms.push({ year: item.year, event: item.event, node: data.node_name, impact: item.impact });
        }
      });
    }
    ms.sort((a, b) => a.year.localeCompare(b.year));
    return ms;
  }, [analyses]);

  switch (sceneIdx) {
    // 第1幕: 趋势评分 + 五维分数条
    case 0:
      return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] w-full max-w-3xl mx-auto">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }} className="relative">
            <div className="text-8xl font-mono font-bold" style={{ color: '#00F0FF', textShadow: '0 0 60px #00F0FF60' }}>
              <CountUp target={report.overall_score || 85} />
            </div>
            <div className="absolute -inset-8 rounded-full" style={{ boxShadow: '0 0 80px #00F0FF20' }} />
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 text-center">
            <div className="text-base text-[#E8ECF1] font-medium">{report.title}</div>
            <div className="text-[11px] text-[#4A5568] mt-1 uppercase tracking-wider">趋势确定指数</div>
          </motion.div>

          {/* 五维分数条 - 不只是数字，还有可视化条 */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 w-full max-w-lg space-y-3">
            {[
              { label: '技术成熟度', value: scores.technology || 80, color: '#00F0FF' },
              { label: '资源充裕度', value: scores.resource || 75, color: '#FFD700' },
              { label: '资本投入', value: scores.capital || 85, color: '#6C5CE7' },
              { label: '确定性', value: scores.certainty || 90, color: '#00D9A5' },
              { label: '政策支持', value: scores.policy || 65, color: '#FF6B35' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1 + i * 0.15 }} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                <span className="text-[11px] text-[#8B95A5] shrink-0 w-20">{s.label}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: s.color, boxShadow: `0 0 8px ${s.color}80` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.value}%` }}
                    transition={{ delay: 1.2 + i * 0.15, duration: 0.8 }}
                  />
                </div>
                <span className="text-sm font-mono font-bold w-8 text-right" style={{ color: s.color }}>{s.value}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      );

    // 第2幕: 稀缺雷达 + 解读
    case 1:
      return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] w-full max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-[#00F0FF] uppercase tracking-wider mb-6">稀缺地图</motion.div>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}>
            <RadarChart data={[
              { label: '技术', value: scarcity.technology || 80 },
              { label: '资源', value: scarcity.resource || 75 },
              { label: '人才', value: scarcity.talent || 70 },
              { label: '资本', value: scarcity.capital || 85 },
              { label: '政策', value: scarcity.policy || 65 },
            ]} />
          </motion.div>
          {/* 五维解读 */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 max-w-2xl">
            {[
              { label: '技术', value: scarcity.technology || 80, color: '#00F0FF' },
              { label: '资源', value: scarcity.resource || 75, color: '#FFD700' },
              { label: '人才', value: scarcity.talent || 70, color: '#FF6B35' },
              { label: '资本', value: scarcity.capital || 85, color: '#6C5CE7' },
              { label: '政策', value: scarcity.policy || 65, color: '#00D9A5' },
            ].sort((a, b) => b.value - a.value).map((s, i) => (
              <motion.div key={s.label} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2 + i * 0.1 }}
                className="glass-panel rounded p-2 text-center" style={{ borderTop: `2px solid ${s.color}` }}>
                <div className="text-[9px] text-[#4A5568]">{s.label}</div>
                <div className="text-base font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
                {i === 0 && <div className="text-[8px] text-[#FF6B35] mt-0.5">最稀缺</div>}
              </motion.div>
            ))}
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="mt-4 text-[11px] text-[#8B95A5] text-center max-w-md">
            稀缺度越高，该维度的瓶颈越严重，也意味着突破后价值越大
          </motion.p>
        </div>
      );

    // 第3幕: 关键发现 - 带图标分类
    case 2:
      const categories = [
        { keyword: ['技术', '算法', '模型', '智能'], color: '#00F0FF' },
        { keyword: ['市场', '规模', '增长', '需求'], color: '#00D9A5' },
        { keyword: ['稀缺', '资源', '材料', '芯片'], color: '#FFD700' },
        { keyword: ['公司', '企业', '特斯拉', '投资'], color: '#6C5CE7' },
        { keyword: ['风险', '挑战', '不确定'], color: '#FF2E63' },
      ];
      const categorize = (text) => {
        for (const cat of categories) {
          if (cat.keyword.some(k => text.includes(k))) return cat;
        }
        return { color: '#8B95A5' };
      };

      return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] max-w-2xl mx-auto w-full">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-[#00D9A5] uppercase tracking-wider mb-6">关键发现</motion.div>
          <div className="space-y-2 w-full">
            {findings.map((finding, i) => {
              const cat = categorize(finding);
              return (
                <motion.div
                  key={i}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="glass-panel rounded-lg p-3 flex items-start gap-3"
                  style={{ borderLeft: `2px solid ${cat.color}` }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: cat.color, boxShadow: `0 0 6px ${cat.color}` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#E8ECF1] leading-relaxed">{finding}</p>
                  </div>
                  <span className="text-[10px] font-mono text-[#4A5568] shrink-0">{String(i + 1).padStart(2, '0')}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      );

    // 第4幕: 投资标的 - 带对比表
    case 3:
      return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] w-full">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-[#6C5CE7] uppercase tracking-wider mb-6">投资标的</motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl w-full px-4 mb-6">
            {targets.map((t, i) => {
              const assetData = assets.find(a => a.node_name === t.name);
              const isListed = assetData?.is_listed ?? true;
              const color = isListed ? '#00D9A5' : '#FF6B35';
              const tags = (t.tag || '').split('|').filter(Boolean);
              const node = nodes.find(n => n.name === t.name);

              return (
                <motion.div
                  key={i}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="glass-panel rounded-lg p-4 cursor-pointer hover:bg-white/5 transition-all hover:scale-[1.02]"
                  onClick={() => { if (node) { selectNode(node.id); flyToNode(node.id); closeReport(); } }}
                  style={{ borderLeft: `2px solid ${color}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-[#E8ECF1]">{t.name}</div>
                    <div className="text-2xl font-mono font-bold" style={{ color }}>{t.score}</div>
                  </div>
                  <div className="text-[10px] text-[#4A5568] mb-2">
                    {isListed ? '上市' : '未上市'}
                    {assetData?.ticker && assetData.ticker !== 'null' && ` · ${assetData.ticker}`}
                    {assetData?.exchange && assetData.exchange !== 'null' && ` · ${assetData.exchange}`}
                  </div>
                  {/* 敞口/确定性条 */}
                  {assetData && (
                    <div className="space-y-1 mb-2">
                      {[
                        { label: '敞口', val: assetData.exposure_score, c: '#00F0FF' },
                        { label: '上行', val: assetData.upside_score, c: '#00D9A5' },
                        { label: '确定', val: assetData.certainty_score, c: '#FFD700' },
                      ].map(s => (
                        <div key={s.label} className="flex items-center gap-1.5">
                          <span className="text-[8px] text-[#4A5568] w-6">{s.label}</span>
                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.val}%`, background: s.c }} />
                          </div>
                          <span className="text-[8px] font-mono w-5 text-right" style={{ color: s.c }}>{s.val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tags.map((tag, j) => (
                      <span key={j} className="text-[9px] px-1.5 py-0.5 rounded" style={{
                        background: tag === '稀缺垄断' ? '#FFD70015' : tag === '高风险' ? '#FF2E6315' : '#6C5CE715',
                        color: tag === '稀缺垄断' ? '#FFD700' : tag === '高风险' ? '#FF2E63' : '#6C5CE7',
                      }}>{tag}</span>
                    ))}
                  </div>
                  {assetData?.investment_thesis && (
                    <p className="text-[10px] text-[#8B95A5] leading-relaxed line-clamp-2">{assetData.investment_thesis}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
          {/* 风险提示 */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="max-w-2xl px-4">
            <div className="glass-panel rounded-lg p-3 flex items-start gap-2" style={{ borderLeft: '2px solid #FF2E63' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#FF2E63', boxShadow: '0 0 6px #FF2E63' }} />
              <p className="text-[10px] text-[#8B95A5] leading-relaxed">以上标的仅供参考分析，不构成投资建议。未上市公司存在流动性风险，投资前请做好独立判断。</p>
            </div>
          </motion.div>
        </div>
      );

    // 第5幕: 完整时间线 (聚合所有节点 milestones)
    case 4:
      return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] w-full">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-[#00F0FF] uppercase tracking-wider mb-2">发展时间线</motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-[11px] text-[#4A5568] mb-8">基于 {Object.keys(analyses).length} 个节点的里程碑事件聚合</motion.p>

          {allMilestones.length > 0 ? (
            <FullTimeline milestones={allMilestones} />
          ) : timeline.length > 0 ? (
            <>
              {/* fallback: 用主题报告的 timeline */}
              <div className="relative px-8 py-6 w-full max-w-2xl">
                <div className="relative h-1 bg-white/5 rounded-full">
                  <motion.div className="absolute top-0 left-0 h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #00F0FF, #00D9A5)' }}
                    initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2 }} />
                  {timeline.map((m, i) => {
                    const pct = timeline.length === 1 ? 50 : (i / (timeline.length - 1)) * 100;
                    return (
                      <motion.div key={i} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${pct}%` }}
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.3 }}>
                        <div className="w-3 h-3 rounded-full -translate-x-1/2" style={{ background: '#00F0FF', boxShadow: '0 0 8px #00F0FF' }} />
                        <div className="absolute top-5 left-0 -translate-x-1/2 text-[12px] font-mono text-[#00F0FF] whitespace-nowrap">{m.year}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full px-4">
                {timeline.map((t, i) => (
                  <div key={i} className="glass-panel rounded-lg p-4">
                    <div className="text-[14px] font-mono text-[#00F0FF] mb-1">{t.year}</div>
                    <div className="text-xs text-[#E8ECF1] leading-relaxed">{t.event}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-[#4A5568] text-xs">暂无时间线数据</div>
          )}

          {/* 报告章节 */}
          {sections.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="mt-8 max-w-2xl w-full px-4 space-y-2">
              <div className="text-[10px] text-[#4A5568] uppercase tracking-wider mb-2">完整分析</div>
              {sections.map((s, i) => (
                <div key={i} className="glass-panel rounded-lg p-3">
                  <div className="text-xs font-medium text-[#00F0FF] mb-1">{s.title || s.heading || `第${i+1}章`}</div>
                  <p className="text-[10px] text-[#8B95A5] leading-relaxed">{s.content || s.body || ''}</p>
                </div>
              ))}
            </motion.div>
          )}
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
    const timer = setTimeout(() => setSceneIdx(i => i + 1), 7000);
    return () => clearTimeout(timer);
  }, [sceneIdx, reportOpen, autoPlay]);

  if (!reportOpen || !parsed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex flex-col"
        style={{ background: '#05070A' }}
      >
        {/* 顶部进度条 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#4A5568] uppercase tracking-wider">TREND REPORT</span>
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
            assets={assets}
            nodes={nodes}
            analyses={analyses}
          />
        </div>

        {/* 底部控制 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] shrink-0">
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
