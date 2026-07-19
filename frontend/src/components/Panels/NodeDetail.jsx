import { motion } from 'framer-motion';
import { NODE_TYPES, EDGE_TYPES, scarcityColor, lifecycleLabel, lifecycleColor } from '../../types/constants';

export default function NodeDetail({ node, onClose, onTabChange, comments = [] }) {
  if (!node) return null;

  const typeInfo = NODE_TYPES[node.type] || NODE_TYPES[1];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
              style={{
                background: `${typeInfo.color}15`,
                border: `1px solid ${typeInfo.color}40`,
                boxShadow: `0 0 16px ${typeInfo.glow}`,
              }}
            >
              {typeInfo.icon}
            </div>
          </div>
          <div>
            <h3 className="text-forge-text font-semibold text-base leading-tight">{node.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium tracking-wider uppercase"
                style={{
                  color: typeInfo.color,
                  background: `${typeInfo.color}10`,
                  border: `1px solid ${typeInfo.color}30`,
                }}
              >
                {typeInfo.label}
              </span>
              <span className="text-[10px] text-forge-text-secondary">
                {lifecycleLabel(node.lifecycle_stage)}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-forge-text-secondary hover:text-forge-text hover:bg-white/5 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b relative" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {['detail', 'comments'].map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 py-2.5 text-xs font-medium tab-pill ${tab === 'detail' ? 'active' : 'text-forge-text-secondary'}`}
          >
            {tab === 'detail' ? '详情' : `评论 (${comments.length})`}
            {tab === 'detail' && (
              <motion.div layoutId="rightTabIndicator" className="pill-indicator" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Description */}
        {node.description && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-[10px] text-forge-text-tertiary uppercase tracking-wider mb-1.5">描述</h4>
            <p className="text-sm text-forge-text leading-relaxed">{node.description}</p>
          </motion.div>
        )}

        {/* Scores */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-2"
        >
          <ScoreCard label="稀缺度" score={node.scarcity_score} color={scarcityColor(node.scarcity_score)} />
          <ScoreCard label="影响力" score={node.influence_score} color="#00F0FF" />
          <ScoreCard label="置信度" score={node.confidence_score} color="#6C5CE7" />
          <ScoreCard
            label="生命周期"
            score={node.lifecycle_stage}
            color={lifecycleColor(node.lifecycle_stage)}
            suffix={lifecycleLabel(node.lifecycle_stage)}
          />
        </motion.div>

        {/* Market Data */}
        {(node.market_size || node.growth_rate) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-lg p-3"
          >
            <h4 className="text-[10px] text-forge-text-tertiary uppercase tracking-wider mb-2">市场数据</h4>
            {node.market_size && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-forge-text-secondary">市场规模</span>
                <span className="tnum text-forge-text">{node.market_size} 亿</span>
              </div>
            )}
            {node.growth_rate && (
              <div className="flex justify-between text-sm">
                <span className="text-forge-text-secondary">增长率</span>
                <span className="tnum text-forge-accent-growth">+{node.growth_rate}%</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Evidence */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h4 className="text-[10px] text-forge-text-tertiary uppercase tracking-wider mb-2">证据来源</h4>
          {node.evidence && node.evidence.length > 0 ? (
            <div className="space-y-2">
              {node.evidence.map((ev) => (
                <div key={ev.id} className="glass-card rounded-lg p-2.5">
                  <div className="text-xs text-forge-text">{ev.title}</div>
                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-forge-primary hover:underline mt-1 inline-block"
                    >
                      查看原文 →
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-forge-text-tertiary">暂无证据记录</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, color, suffix }) {
  return (
    <div className="glass-card rounded-lg p-2.5 relative overflow-hidden">
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <div className="text-[10px] text-forge-text-tertiary uppercase tracking-wider mb-1 ml-1.5">{label}</div>
      <div className="flex items-baseline gap-1.5 ml-1.5">
        <span className="text-2xl font-bold tnum" style={{ color }}>
          {typeof score === 'number' ? score.toFixed(0) : score}
        </span>
        {suffix && <span className="text-[10px] text-forge-text-secondary">{suffix}</span>}
      </div>
      <div className="mt-1.5 ml-1.5 h-0.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score || 0}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 4px ${color}` }}
        />
      </div>
    </div>
  );
}
