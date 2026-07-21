import { useStore } from '../../store/useStore';

const NODE_COLORS = {
  technology: '#00F0FF', person: '#FF6B35', company: '#6C5CE7', resource: '#FFD700', concept: '#00D9A5',
};

function ScoreBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#4A5568] w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <span className="text-[10px] font-mono w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

export default function AssetCard({ node }) {
  const asset = node?.asset;
  if (!asset) {
    return (
      <div className="glass-panel rounded-lg p-4 text-center">
        <div className="text-[#4A5568] text-xs">该节点暂无投资标的信息</div>
      </div>
    );
  }

  const color = NODE_COLORS[node.type] || '#00F0FF';
  const isListed = asset.is_listed !== false;

  return (
    <div className="space-y-3">
      {/* 标的头部 */}
      <div className="glass-panel rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{isListed ? '📈' : '🔒'}</span>
            <div>
              <div className="text-sm font-bold text-[#E8ECF1]">{asset.node_name || node.name}</div>
              <div className="text-[10px] text-[#4A5568]">
                {isListed ? '上市公司' : '未上市公司'}
                {asset.ticker && asset.ticker !== 'null' && ` · ${asset.ticker}`}
                {asset.exchange && asset.exchange !== 'null' && ` · ${asset.exchange}`}
              </div>
            </div>
          </div>
          {asset.market_cap && (
            <div className="text-right">
              <div className="text-[9px] text-[#4A5568] uppercase">市值</div>
              <div className="text-sm font-mono font-bold text-[#FFD700]">{asset.market_cap}亿</div>
            </div>
          )}
        </div>

        {/* 评分条 */}
        <div className="space-y-1.5 mt-2">
          <ScoreBar label="敞口" value={asset.exposure_score || 50} color="#00F0FF" />
          <ScoreBar label="上行" value={asset.upside_score || 50} color="#00D9A5" />
          <ScoreBar label="确定性" value={asset.certainty_score || 50} color="#6C5CE7" />
        </div>
      </div>

      {/* 入场点 + 目标回报 */}
      {(asset.entry_point || asset.target_return) && (
        <div className="glass-panel rounded-lg p-3 flex gap-4">
          {asset.entry_point && (
            <div className="flex-1">
              <div className="text-[9px] text-[#4A5568] uppercase">入场点</div>
              <div className="text-xs font-mono text-[#00F0FF]">{asset.entry_point}</div>
            </div>
          )}
          {asset.target_return && (
            <div className="flex-1">
              <div className="text-[9px] text-[#4A5568] uppercase">目标回报</div>
              <div className="text-xs font-mono text-[#00D9A5]">{asset.target_return}</div>
            </div>
          )}
        </div>
      )}

      {/* 投资逻辑 */}
      {asset.investment_thesis && (
        <div className="glass-panel rounded-lg p-3">
          <div className="text-[10px] text-[#00D9A5] uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span>📈</span> 投资逻辑
          </div>
          <p className="text-xs text-[#E8ECF1] leading-relaxed">{asset.investment_thesis}</p>
        </div>
      )}

      {/* 风险因素 */}
      {asset.risk_factors && (
        <div className="glass-panel rounded-lg p-3" style={{ borderLeft: '2px solid #FF2E63' }}>
          <div className="text-[10px] text-[#FF2E63] uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span>⚠</span> 风险因素
          </div>
          <p className="text-xs text-[#8B95A5] leading-relaxed">{asset.risk_factors}</p>
        </div>
      )}
    </div>
  );
}
