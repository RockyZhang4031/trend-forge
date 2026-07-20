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

function weightToVisual(weight) {
  const w = Math.max(0, Math.min(100, weight || 50));
  const x = (w - 50) / 50;
  return 1 / (1 + Math.exp(-4 * x));
}

/**
 * 连线 — 细线条 + 降噪
 * 
 * 强关系(≥85): 1.2px, 亮度 0.7, 有流动光点
 * 中等(70-85): 0.6px, 亮度 0.25
 * 弱关系(<70): 0.3px, 亮度 0.08, 几乎不可见
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

  const weight = edge.weight || (edge.strength ? edge.strength * 100 : 50);
  const s = weightToVisual(weight);
  const isStrong = weight >= 85;

  const color = EDGE_COLORS[edge.type] || '#8B95A5';
  const isDimmed = store.selectedNodeId &&
    store.selectedNodeId !== sourceNode.id &&
    store.selectedNodeId !== targetNode.id;

  // 细线条
  const lineWidth = isStrong ? 0.8 + s * 0.6 : 0.3;
  const lineOpacity = isDimmed ? 0.02 : (isStrong ? 0.6 + s * 0.3 : 0.06 + s * 0.1);

  // 只有强关系才有流动光点
  const showParticle = isStrong && !isDimmed;
  const particleSize = 0.12 + s * 0.15;
  const particleOpacity = isDimmed ? 0 : 0.5 + s * 0.3;
  const flowSpeed = 0.4 + s * 1.0;

  useFrame((state) => {
    if (!particleRef.current || !showParticle) return;
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
      {showParticle && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[particleSize, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={particleOpacity} />
        </mesh>
      )}
    </group>
  );
}
