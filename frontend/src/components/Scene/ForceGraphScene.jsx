import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { useForceSimulation } from './useForceSimulation';
import ParticleBackground from './ParticleBackground';
import HolographicNode from './HolographicNode';
import QuantumEdge from './QuantumEdge';
import CameraRig from './CameraRig';

/**
 * 主图谱场景 — 整合所有 3D 元素
 */
export default function ForceGraphScene({ nodes, edges }) {
  const { nodes: simNodes, edges: simEdges } = useForceSimulation(nodes, edges, {
    charge: -400,
    linkDistance: 25,
    collideRadius: 6,
    depth: 60,
  });

  const selectNode = useStore(s => s.selectNode);

  return (
    <Canvas
      camera={{ position: [0, 0, 40], fov: 60, near: 0.1, far: 1000 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      // 确保容器尺寸变化时 Canvas 正确 resize
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <CameraRig />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00F0FF" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#6C5CE7" />

      {/* 粒子背景 */}
      <ParticleBackground count={1500} />

      {/* 网格地面 */}
      <gridHelper args={[200, 50, 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.03)']} position={[0, -50, 0]} />

      {/* 节点层 */}
      {simNodes.map(node => (
        <HolographicNode
          key={node.id}
          node={node}
          onClick={() => selectNode(node.id)}
        />
      ))}

      {/* 连线层 */}
      {simEdges.map(edge => (
        <QuantumEdge key={edge.id} edge={edge} nodes={simNodes} />
      ))}
    </Canvas>
  );
}
