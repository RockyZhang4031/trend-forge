import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { useForceSimulation } from './useForceSimulation';
import ParticleBackground from './ParticleBackground';
import HolographicNode from './HolographicNode';
import QuantumEdge from './QuantumEdge';
import CameraRig from './CameraRig';

/**
 * 布局稳定后自动 fitView 的内部组件
 * 需要在 Canvas 内部才能访问 useThree
 */
function AutoFitView({ nodes, layoutStable }) {
  const { camera } = useThree();
  const fitted = useRef(false);

  useEffect(() => {
    if (!layoutStable || fitted.current || !nodes.length) return;
    fitted.current = true;

    // 计算所有节点的包围盒
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

    // 计算合适的相机距离：让所有节点刚好在视野内
    const fov = camera.fov * (Math.PI / 180);
    const distance = Math.max(maxDim / (2 * Math.tan(fov / 2)) + 10, 25);

    // 平滑移动相机到合适位置
    const targetPos = new THREE.Vector3(
      center.x,
      center.y,
      center.z + distance
    );

    // 简单直接设置（OrbitControls 会接管后续交互）
    camera.position.copy(targetPos);
    camera.lookAt(center);
  }, [layoutStable, nodes, camera]);

  return null;
}

/**
 * 主图谱场景 — 整合所有 3D 元素
 */
export default function ForceGraphScene({ nodes, edges }) {
  const { nodes: simNodes, edges: simEdges, layoutStable } = useForceSimulation(nodes, edges, {
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
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <CameraRig />
      <AutoFitView nodes={simNodes} layoutStable={layoutStable} />
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
