// 类型映射表
export const NODE_TYPES = {
  1: { label: '趋势', icon: '🚀', color: '#3da0c1' },
  2: { label: '技术', icon: '⚙️', color: '#6366f1' },
  3: { label: '资源', icon: '💎', color: '#f59e0b' },
  4: { label: '公司', icon: '🏢', color: '#10b981' },
  5: { label: '人物', icon: '👤', color: '#ec4899' },
  6: { label: '产业', icon: '🏭', color: '#8b5cf6' },
  7: { label: '事件', icon: '📢', color: '#ef4444' },
};

export const EDGE_TYPES = {
  1: { label: '依赖', color: '#f59e0b' },
  2: { label: '推动', color: '#10b981' },
  3: { label: '掌控', color: '#8b5cf6' },
  4: { label: '属于', color: '#6b7280' },
  5: { label: '引发', color: '#ef4444' },
};

// 稀缺度颜色映射 (0-100 → 绿→黄→红)
export function scarcityColor(score) {
  if (score < 30) return '#448d5c';   // 充裕 - 绿
  if (score < 50) return '#9e834e';   // 一般 - 黄
  if (score < 75) return '#d97706';   // 偏紧 - 橙
  return '#dc2626';                    // 稀缺 - 红
}

// 影响力 → 节点大小 (30-80px)
export function influenceSize(score) {
  return 30 + (score / 100) * 50;
}

// 权重 → 线宽 (1-6px)
export function weightLineWidth(weight) {
  return 1 + (weight / 100) * 5;
}

// 生命周期阶段标签
export function lifecycleLabel(stage) {
  if (stage < 20) return '萌芽期';
  if (stage < 40) return '成长期';
  if (stage < 60) return '爆发期';
  if (stage < 80) return '成熟期';
  return '衰退期';
}
