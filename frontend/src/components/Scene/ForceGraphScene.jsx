import { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { useForceSimulation } from './useForceSimulation';
import ParticleBackground from './ParticleBackground';
import HolographicNode from './HolographicNode';
import QuantumEdge from './QuantumEdge';
import CameraRig from './CameraRig';

/**
 * 布局稳定后自动 fitView
 * 使用 3/4 俯视角（从右上方往下看），不是正前方平视
 */
function AutoFitView({ nodes, layoutStable }) {
  const { camera } = useThree();
  const fitted = useRef(false);

  useEffect(() => {
    if (!layoutStable || fitted.current || !nodes.length) return;
    fitted.current = true;

    const box = new THREE.Box3();
    nodes.forEach(n => {
      if (n.x !== undefined && n.y !== undefined) {
        box.expandByPoint(new THREE.Vector3(n.x, n.y, n.z || 0));
      }
    });

    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const fov = camera.fov * (Math.PI / 180);
    const distance = Math.max(maxDim / (2 * Math.tan(fov / 2)) + 15, 30);

    // 3/4 俯视角：从右上方往下看，偏移 x 和 y
    const angle = Math.PI / 5; // 36° 俯视角
    const targetPos = new THREE.Vector3(
      center.x + distance * 0.25,           // 右偏
      center.y + distance * Math.sin(angle), // 上偏（俯视）
      center.z + distance * Math.cos(angle)  // 前方
    );

    camera.position.copy(targetPos);
    camera.lookAt(center);
  }, [layoutStable, nodes, camera]);

  return null;
}

/**
 * 主图谱场景
 */
export default function ForceGraphScene({ nodes, edges }) {
  const { nodes: simNodes, edges: simEdges, layoutStable } = useForceSimulation(nodes, edges, {
    charge: -400,
    linkDistance: 25,
    collideRadius: 6,
    depth: 80,
  });

  const selectNode = useStore(s => s.selectNode);

  return (
    <Canvas
      camera={{ position: [10, 15, 35], fov: 55, near: 0.1, far: 1000 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <CameraRig />
      <AutoFitView nodes={simNodes} layoutStable={layoutStable} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 20, 10]} intensity={0.6} color="#00F0FF" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#6C5CE7" />

      <ParticleBackground count={1200} />

      <gridHelper args={[200, 50, 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.03)']} position={[0, -30, 0]} />

      {simNodes.map(node => (
        <HolographicNode
          key={node.id}
          node={node}
          onClick={() => selectNode(node.id)}
        />
      ))}

      {simEdges.map(edge => (
        <QuantumEdge key={edge.id} edge={edge} nodes={simNodes} />
      ))}
    </Canvas>
  );
}
