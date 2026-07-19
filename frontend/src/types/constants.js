// 类型映射表 — 深空算力终端配色
export const NODE_TYPES = {
  1: { label: '趋势', icon: '🚀', color: '#00F0FF', glow: 'rgba(0, 240, 255, 0.6)' },
  2: { label: '技术', icon: '⚙️', color: '#6C5CE7', glow: 'rgba(108, 92, 231, 0.6)' },
  3: { label: '资源', icon: '💎', color: '#FF6B35', glow: 'rgba(255, 107, 53, 0.6)' },
  4: { label: '公司', icon: '🏢', color: '#00D9A5', glow: 'rgba(0, 217, 165, 0.6)' },
  5: { label: '人物', icon: '👤', color: '#FF2E63', glow: 'rgba(255, 46, 99, 0.6)' },
  6: { label: '产业', icon: '🏭', color: '#6C5CE7', glow: 'rgba(108, 92, 231, 0.6)' },
  7: { label: '事件', icon: '📢', color: '#FF2E63', glow: 'rgba(255, 46, 99, 0.6)' },
};

export const EDGE_TYPES = {
  1: { label: '依赖', color: '#FF6B35' },
  2: { label: '推动', color: '#00D9A5' },
  3: { label: '掌控', color: '#6C5CE7' },
  4: { label: '属于', color: '#4A5568' },
  5: { label: '引发', color: '#FF2E63' },
};

// 稀缺度颜色映射 (0-100)
export function scarcityColor(score) {
  if (score < 30) return '#00D9A5';   // 充裕 - 青绿
  if (score < 50) return '#00F0FF';   // 一般 - 电青
  if (score < 75) return '#FF6B35';   // 偏紧 - 暖橙
  return '#FF2E63';                    // 稀缺 - 警示红
}

// 影响力 → 节点大小 (28-72px)
export function influenceSize(score) {
  return 28 + (score / 100) * 44;
}

// 权重 → 线宽 (1-5px)
export function weightLineWidth(weight) {
  return 1 + (weight / 100) * 4;
}

// 生命周期阶段标签
export function lifecycleLabel(stage) {
  if (stage < 20) return '萌芽期';
  if (stage < 40) return '成长期';
  if (stage < 60) return '爆发期';
  if (stage < 80) return '成熟期';
  return '衰退期';
}

// 生命周期阶段颜色
export function lifecycleColor(stage) {
  if (stage < 20) return '#6C5CE7';
  if (stage < 40) return '#00F0FF';
  if (stage < 60) return '#00D9A5';
  if (stage < 80) return '#FF6B35';
  return '#FF2E63';
}
