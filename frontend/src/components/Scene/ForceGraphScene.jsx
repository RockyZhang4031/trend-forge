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
 * 
 * 根据节点包围盒大小自适应相机距离，确保所有节点都在视野内。
 * 3/4 俯视角（从右上方往下看）。
 * 考虑侧边栏遮挡，画面中心偏右。
 */
function AutoFitView({ nodes, layoutStable }) {
  const { camera } = useThree();
  const fitted = useRef(false);

  useEffect(() => {
    if (!layoutStable || fitted.current || !nodes.length) return;
    fitted.current = true;

    // 等一帧让节点位置最终更新
    setTimeout(() => {
      const box = new THREE.Box3();
      nodes.forEach(n => {
        if (n.x !== undefined && n.y !== undefined) {
          box.expandByPoint(new THREE.Vector3(n.x, n.y, n.z || 0));
        }
      });

      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      // 包围球半径，考虑 XYZ 三轴
      const radius = Math.max(size.x, size.y, size.z) / 2;

      const fov = camera.fov * (Math.PI / 180);
      // 自适应距离 = 包围球半径 / sin(半FOV) + padding
      // padding 根据节点数量调整：节点越多 padding 越大
      const padding = 20 + nodes.length * 0.8;
      const distance = Math.max(radius / Math.sin(fov / 2) + padding, 35);

      // 3/4 俯视角
      const angle = Math.PI / 5; // 36°
      const targetPos = new THREE.Vector3(
        center.x + distance * 0.2,
        center.y + distance * Math.sin(angle),
        center.z + distance * Math.cos(angle)
      );

      camera.position.copy(targetPos);
      camera.lookAt(center);

      // 同步 OrbitControls target
      if (camera.userData.controls) {
        camera.userData.controls.target.copy(center);
        camera.userData.controls.update();
      }
    }, 100);
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
      camera={{ position: [10, 20, 40], fov: 55, near: 0.1, far: 1000 }}
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
