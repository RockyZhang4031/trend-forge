import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, Billboard } from '@react-three/drei';
import { useStore } from '../../store/useStore';
import { useForceSimulation } from './useForceSimulation';
import ParticleBackground from './ParticleBackground';
import HolographicNode from './HolographicNode';
import QuantumEdge from './QuantumEdge';
import CameraRig from './CameraRig';

/**
 * 单一动画驱动器 — 替代 23+24 个 useFrame
 * 每帧遍历 node refs 更新旋转/呼吸，性能从 47 回调降到 1
 */
function NodeAnimator({ nodeRefs, nodes }) {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < nodes.length; i++) {
      const ref = nodeRefs.current[nodes[i].id];
      if (!ref) continue;
      const heat = nodes[i].heat || 50;
      // 呼吸
      const breathe = 1 + Math.sin(t * 1.5 + heat * 0.1) * 0.04;
      ref.scale.setScalar(breathe);
      // 旋转
      ref.rotation.x = t * 0.15;
      ref.rotation.y = t * 0.25;
      // 悬浮
      ref.position.y = (nodes[i].y || 0) + Math.sin(t * 0.5 + heat) * 0.2;
    }
  });
  return null;
}

/**
 * 主题标识
 */
function ThemeCenter({ theme }) {
  if (!theme) return null;
  return (
    <Billboard position={[0, 0, 0]}>
      <Html center style={{ pointerEvents: 'none' }}>
        <div className="px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap"
          style={{
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            color: 'rgba(0, 240, 255, 0.4)',
            backdropFilter: 'blur(8px)',
            letterSpacing: '0.1em',
          }}>
          {theme.name}
        </div>
      </Html>
    </Billboard>
  );
}

/**
 * fitView
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
        if (n.x !== undefined) box.expandByPoint(new THREE.Vector3(n.x, n.y, n.z || 0));
      });
      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const radius = Math.max(1, box.getBoundingSphere(new THREE.Sphere()).radius);
      const fov = camera.fov * Math.PI / 180;
      const aspect = size.width / Math.max(1, size.height);
      const dist = Math.max(radius / Math.tan(fov / 2), radius / (Math.tan(fov / 2) * aspect)) * 1.6 + 20;

      const dir = new THREE.Vector3(0.5, 0.7, 1).normalize();
      camera.position.copy(center).add(dir.multiplyScalar(dist));
      camera.lookAt(center);
      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    }, 100);
  }, [layoutStable, nodes, camera, size, controlsRef]);

  return null;
}

/**
 * 主场景
 */
export default function ForceGraphScene({ nodes, edges }) {
  const controlsRef = useRef(null);
  const nodeRefs = useRef({});
  const currentTheme = useStore(s => s.currentTheme);
  const selectNode = useStore(s => s.selectNode);
  const hoverNode = useStore(s => s.hoverNode);

  const { nodes: simNodes, edges: simEdges, layoutStable } = useForceSimulation(nodes, edges);

  // 构建 source/target 位置索引，避免每个 edge 做 find
  const nodePosMap = useMemo(() => {
    const map = new Map();
    simNodes.forEach(n => map.set(n.id, { x: n.x, y: n.y, z: n.z }));
    return map;
  }, [simNodes]);

  return (
    <Canvas
      camera={{ position: [0, 20, 50], fov: 55, near: 0.1, far: 1000 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <CameraRig controlsRef={controlsRef} />
      <AutoFitView nodes={simNodes} layoutStable={layoutStable} controlsRef={controlsRef} />
      <NodeAnimator nodeRefs={nodeRefs} nodes={simNodes} />

      <ambientLight intensity={0.4} />
      <pointLight position={[10, 20, 10]} intensity={0.6} color="#00F0FF" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#6C5CE7" />
      <directionalLight position={[5, 10, 5]} intensity={0.4} color="#ffffff" />

      <ParticleBackground count={300} />
      <ThemeCenter theme={currentTheme} />
      <gridHelper args={[200, 50, '#1a2030', '#1a2030']} position={[0, -30, 0]} />

      {simNodes.map(node => (
        <HolographicNode
          key={node.id}
          node={node}
          groupRef={(el) => { if (el) nodeRefs.current[node.id] = el; }}
          onClick={selectNode}
          onHover={hoverNode}
          onLeave={() => hoverNode(null)}
        />
      ))}

      {simEdges.map(edge => {
        const sid = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const tid = typeof edge.target === 'string' ? edge.target : edge.target.id;
        return (
          <QuantumEdge
            key={edge.id}
            edge={edge}
            sourcePos={nodePosMap.get(sid)}
            targetPos={nodePosMap.get(tid)}
          />
        );
      })}
    </Canvas>
  );
}
