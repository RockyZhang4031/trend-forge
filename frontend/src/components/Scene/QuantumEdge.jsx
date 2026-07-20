import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const EDGE_COLORS = {
  drives: '#00F0FF',    // 驱动：电青
  depends: '#8B95A5',   // 依赖：灰
  competes: '#FF2E63',  // 竞争：红
  belongs: '#4A5568',   // 属于：暗灰
};

function weightToVisual(weight) {
  const x = (Math.max(0, Math.min(100, weight || 50)) - 50) / 50;
  return 1 / (1 + Math.exp(-4 * x));
}

/**
 * 语义化连线 — 焦点衰减 + 类型颜色
 */
export default function QuantumEdge({ edge, sourcePos, targetPos, selectedNodeId, relatedIds }) {
  const points = useMemo(() => {
    if (!sourcePos || !targetPos) return [];
    return [
      new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z),
      new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z),
    ];
  }, [sourcePos?.x, sourcePos?.y, sourcePos?.z, targetPos?.x, targetPos?.y, targetPos?.z]);

  if (!points.length) return null;

  const weight = edge.weight || 50;
  const s = weightToVisual(weight);
  const color = EDGE_COLORS[edge.type] || '#8B95A5';
  const isStrong = weight >= 80;

  // 焦点衰减
  const sid = typeof edge.source === 'string' ? edge.source : edge.source.id;
  const tid = typeof edge.target === 'string' ? edge.target : edge.target.id;
  const isRelated = selectedNodeId && (sid === selectedNodeId || tid === selectedNodeId);
  const isDimmed = selectedNodeId && !isRelated;

  const lineWidth = isStrong ? 0.8 + s * 0.8 : 0.3;
  const lineOpacity = isDimmed ? 0.03
    : isRelated ? 0.8 + s * 0.2
    : isStrong ? 0.5 + s * 0.3
    : 0.08 + s * 0.08;

  // 竞争关系闪烁
  const isCompetes = edge.type === 'competes';

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={lineOpacity}
      dashed={isCompetes}
      dashSize={isCompetes ? 0.8 : 1}
      gapSize={isCompetes ? 0.4 : 0}
    />
  );
}
