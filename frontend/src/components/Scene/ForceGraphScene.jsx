import { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, Billboard } from '@react-three/drei';
import { useStore } from '../../store/useStore';
import { useForceSimulation } from './useForceSimulation';
import ParticleBackground from './ParticleBackground';
import HolographicNode from './HolographicNode';
import QuantumEdge from './QuantumEdge';
import CameraRig from './CameraRig';

/**
 * 主题标识 — 在 3D 空间中央显示主题名
 */
function ThemeCenter({ theme }) {
  if (!theme) return null;
  return (
    <Billboard position={[0, 0, 0]}>
      <Html center style={{ pointerEvents: 'none' }}>
        <div
          className="px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap"
          style={{
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            color: 'rgba(0, 240, 255, 0.4)',
            backdropFilter: 'blur(8px)',
            letterSpacing: '0.1em',
          }}
        >
          {theme.name}
        </div>
      </Html>
    </Billboard>
  );
}

/**
 * 布局稳定后自动 fitView
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
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const radius = Math.max(1, sphere.radius);

      const fov = camera.fov * Math.PI / 180;
      const aspect = size.width / Math.max(1, size.height);

      const hDist = radius / Math.tan(fov / 2);
      const vDist = radius / (Math.tan(fov / 2) * aspect);
      let distance = Math.max(hDist, vDist) * 1.6 + 20;

      // 3/4 俯视角
      const dir = new THREE.Vector3(0.5, 0.7, 1).normalize();
      camera.position.copy(center).add(dir.multiplyScalar(distance));
      camera.lookAt(center);

      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    }, 150);
  }, [layoutStable, nodes, camera, size, controlsRef]);

  return null;
}

/**
 * 主图谱场景
 */
export default function ForceGraphScene({ nodes, edges }) {
  const controlsRef = useRef(null);
  const currentTheme = useStore(s => s.currentTheme);
  const { nodes: simNodes, edges: simEdges, layoutStable } = useForceSimulation(nodes, edges, {
    charge: -400,
    linkDistance: 25,
    collideRadius: 6,
    depth: 80,
  });

  const selectNode = useStore(s => s.selectNode);

  return (
    <Canvas
      camera={{ position: [0, 20, 50], fov: 55, near: 0.1, far: 1000 }}
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
      <directionalLight position={[5, 10, 5]} intensity={0.4} color="#ffffff" />

      <ParticleBackground count={1000} />

      {/* 主题标识 */}
      <ThemeCenter theme={currentTheme} />

      <gridHelper args={[200, 50, '#1a2030', '#1a2030']} position={[0, -30, 0]} />

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
