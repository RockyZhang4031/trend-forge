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

/**
 * 量子纠缠连线
 * 渐变光带 + 流动光点 + Hover 高亮
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

  const color = EDGE_COLORS[edge.type] || '#8B95A5';
  const isDimmed = store.selectedNodeId &&
    store.selectedNodeId !== sourceNode.id &&
    store.selectedNodeId !== targetNode.id;

  useFrame((state) => {
    if (!particleRef.current) return;
    const t = (state.clock.elapsedTime * 0.5 * (edge.strength || 0.5)) % 1;
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
        lineWidth={1}
        transparent
        opacity={isDimmed ? 0.05 : 0.4}
      />
      {/* 流动光点 */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={isDimmed ? 0 : 0.8} />
      </mesh>
    </group>
  );
}
