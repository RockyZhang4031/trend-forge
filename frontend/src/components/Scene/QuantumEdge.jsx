import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

const EDGE_COLORS = {
  drives: '#00F0FF',
  depends: '#6C5CE7',
  competes: '#FF2E63',
  belongs: '#8B95A5',
};

// 非线性映射：和 useForceSimulation 里的 weightToStrength 一致
function weightToVisual(weight) {
  const w = Math.max(0, Math.min(100, weight || 50));
  const x = (w - 50) / 50;
  const s = 1 / (1 + Math.exp(-4 * x));
  return s;
}

/**
 * 量子纠缠连线
 * 
 * weight 驱动全部视觉属性：
 * - 粗细：0.5px(弱) ~ 4px(强)
 * - 亮度：0.15(弱) ~ 0.9(强)
 * - 流速：0.2(弱) ~ 2.0(强)
 * - 光点大小：0.15(弱) ~ 0.5(强)
 */
export default function QuantumEdge({ edge, nodes }) {
  const lineRef = useRef(null);
  const particleRef = useRef(null);
  const store = useStore();

  const sourceNode = nodes.find(n => n.id === (typeof edge.source === 'string' ? edge.source : edge.source.id));
  const targetNode = nodes.find(n => n.id === (typeof edge.target === 'string' ? edge.target : edge.target.id));

  const points = useMemo(() => {
    if (!sourceNode || !targetNode) return [];
    return [
      new THREE.Vector3(sourceNode.x || 0, sourceNode.y || 0, sourceNode.z || 0),
      new THREE.Vector3(targetNode.x || 0, targetNode.y || 0, targetNode.z || 0),
    ];
  }, [sourceNode?.x, sourceNode?.y, sourceNode?.z, targetNode?.x, targetNode?.y, targetNode?.z]);

  if (!sourceNode || !targetNode || points.length === 0) return null;

  // 从 edge 上取 weight（优先 weight 字段，回退到 strength*100）
  const weight = edge.weight || (edge.strength ? edge.strength * 100 : 50);
  const s = weightToVisual(weight);

  const color = EDGE_COLORS[edge.type] || '#8B95A5';
  const isDimmed = store.selectedNodeId &&
    store.selectedNodeId !== sourceNode.id &&
    store.selectedNodeId !== targetNode.id;

  // weight 驱动的视觉属性
  const lineWidth = 0.5 + s * 3.5;          // 0.5 ~ 4.0
  const lineOpacity = isDimmed ? 0.03 : (0.15 + s * 0.75);  // 0.15 ~ 0.9
  const particleSize = 0.15 + s * 0.35;     // 0.15 ~ 0.5
  const particleOpacity = isDimmed ? 0 : (0.3 + s * 0.6);   // 0.3 ~ 0.9
  const flowSpeed = 0.2 + s * 1.8;          // 0.2 ~ 2.0

  useFrame((state) => {
    if (!particleRef.current) return;
    const t = (state.clock.elapsedTime * flowSpeed) % 1;
    if (points.length === 2) {
      particleRef.current.position.lerpVectors(points[0], points[1], t);
    }
  });

  return (
    <group>
      <Line
        ref={lineRef}
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={lineOpacity}
      />
      {/* 流动光点 */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[particleSize, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={particleOpacity} />
      </mesh>
    </group>
  );
}
