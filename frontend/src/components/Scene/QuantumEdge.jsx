import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

const EDGE_COLORS = {
  drives: '#00F0FF',
  depends: '#6C5CE7',
  competes: '#FF2E63',
  belongs: '#8B95A5',
};

function weightToVisual(weight) {
  const x = (Math.max(0, Math.min(100, weight || 50)) - 50) / 50;
  return 1 / (1 + Math.exp(-4 * x));
}

/**
 * 连线 — 纯静态渲染，无 useFrame
 * 流动光点由 EdgeAnimator 统一管理
 */
export default function QuantumEdge({ edge, sourcePos, targetPos }) {
  const selectedNodeId = useStore(s => s.selectedNodeId);

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
  const isStrong = weight >= 85;
  const color = EDGE_COLORS[edge.type] || '#8B95A5';
  const isDimmed = selectedNodeId &&
    selectedNodeId !== (typeof edge.source === 'string' ? edge.source : edge.source.id) &&
    selectedNodeId !== (typeof edge.target === 'string' ? edge.target : edge.target.id);

  const lineWidth = isStrong ? 0.8 + s * 0.6 : 0.3;
  const lineOpacity = isDimmed ? 0.02 : (isStrong ? 0.6 + s * 0.3 : 0.06 + s * 0.1);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={lineOpacity}
    />
  );
}
