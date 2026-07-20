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
 * 关键：必须同步 OrbitControls 的 target，否则下一帧被覆盖
 * 必须考虑画布宽高比，竖屏时用垂直 FOV 算距离
 */
function AutoFitView({ nodes, layoutStable, controlsRef }) {
  const { camera, size } = useThree();
  const fitted = useRef(false);

  useEffect(() => {
    if (!layoutStable || fitted.current || !nodes.length) return;
    fitted.current = true;

    setTimeout(() => {
      const box = new THREE.Box3();
      nodes.forEach(n => {
        if (n.x !== undefined && n.y !== undefined) {
          box.expandByPoint(new THREE.Vector3(n.x, n.y, n.z || 0));
        }
      });

      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const sizeBox = box.getSize(new THREE.Vector3());
      const radius = box.getBoundingSphere(new THREE.Sphere()).radius;

      const fov = camera.fov * (Math.PI / 180);
      const aspect = size.width / size.height;

      // 水平和垂直方向各自需要的距离，取较大值
      const hDist = radius / Math.tan(fov / 2) / aspect;
      const vDist = radius / Math.tan(fov / 2);
      let distance = Math.max(hDist, vDist);

      // padding：节点越大需要越多边距
      const padding = 1.6;
      distance *= padding;
      distance = Math.max(distance, 30);

      // 3/4 俯视角
      const angle = Math.PI / 5;
      const targetPos = new THREE.Vector3(
        center.x + distance * 0.15,
        center.y + distance * Math.sin(angle),
        center.z + distance * Math.cos(angle)
      );

      camera.position.copy(targetPos);
      camera.lookAt(center);
      camera.updateProjectionMatrix();

      // 关键：同步 OrbitControls target，否则下一帧被覆盖
      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    }, 200);
  }, [layoutStable, nodes, camera, size, controlsRef]);

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
  const controlsRef = useRef(null);

  return (
    <Canvas
      camera={{ position: [10, 25, 50], fov: 55, near: 0.1, far: 1000 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <CameraRig controlsRef={controlsRef} />
      <AutoFitView nodes={simNodes} layoutStable={layoutStable} controlsRef={controlsRef} />
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
