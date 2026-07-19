import { NODE_TYPES, EDGE_TYPES, scarcityColor, lifecycleLabel } from '../../types/constants';

export default function NodeDetail({ node, onClose, onTabChange, comments = [] }) {
  if (!node) return null;

  const typeInfo = NODE_TYPES[node.type] || NODE_TYPES[1];

  return (
    <div className="h-full flex flex-col bg-forge-card border-l border-forge-border">
      {/* Header */}
      <div className="p-4 border-b border-forge-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: scarcityColor(node.scarcity_score) }}
          >
            {typeInfo.icon}
          </span>
          <div>
            <h3 className="text-forge-text font-semibold text-base">{node.name}</h3>
            <span className="text-xs text-forge-muted">
              {typeInfo.label} · {lifecycleLabel(node.lifecycle_stage)}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-forge-muted hover:text-forge-text text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-forge-border">
        {['detail', 'comments'].map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'detail'
                ? 'text-forge-primary border-b-2 border-forge-primary'
                : 'text-forge-muted hover:text-forge-text'
            }`}
          >
            {tab === 'detail' ? '详情' : `评论 (${comments.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Description */}
        {node.description && (
          <div className="mb-4">
            <h4 className="text-xs text-forge-muted uppercase mb-1">描述</h4>
            <p className="text-sm text-forge-text leading-relaxed">{node.description}</p>
          </div>
        )}

        {/* Scores */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <ScoreCard label="稀缺度" score={node.scarcity_score} color={scarcityColor(node.scarcity_score)} />
          <ScoreCard label="影响力" score={node.influence_score} color="#3da0c1" />
          <ScoreCard label="置信度" score={node.confidence_score} color="#6366f1" />
          <ScoreCard label="生命周期" score={node.lifecycle_stage} color="#8b5cf6" suffix={lifecycleLabel(node.lifecycle_stage)} />
        </div>

        {/* Market Data */}
        {(node.market_size || node.growth_rate) && (
          <div className="mb-4 p-3 bg-forge-surface rounded-lg">
            <h4 className="text-xs text-forge-muted uppercase mb-2">市场数据</h4>
            {node.market_size && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-forge-muted">市场规模</span>
                <span className="text-forge-text">{node.market_size} 亿元</span>
              </div>
            )}
            {node.growth_rate && (
              <div className="flex justify-between text-sm">
                <span className="text-forge-muted">增长率</span>
                <span className="text-success">{node.growth_rate}%</span>
              </div>
            )}
          </div>
        )}

        {/* Evidence placeholder */}
        <div className="mb-4">
          <h4 className="text-xs text-forge-muted uppercase mb-2">证据来源</h4>
          <div className="text-sm text-forge-muted">
            {node.evidence && node.evidence.length > 0 ? (
              node.evidence.map((ev) => (
                <div key={ev.id} className="mb-2 p-2 bg-forge-surface rounded text-xs">
                  <div className="text-forge-text">{ev.title}</div>
                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-forge-primary hover:underline"
                    >
                      查看原文
                    </a>
                  )}
                </div>
              ))
            ) : (
              <span className="text-xs">暂无证据记录</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, color, suffix }) {
  return (
    <div className="p-3 bg-forge-surface rounded-lg">
      <div className="text-xs text-forge-muted mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color }}>
          {typeof score === 'number' ? score.toFixed(0) : score}
        </span>
        {suffix && <span className="text-xs text-forge-muted">{suffix}</span>}
      </div>
      <div className="mt-2 h-1 bg-forge-bg rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
