import { useRef, useEffect, useMemo, useState } from 'react';
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
 * 单一动画驱动器
 */
function NodeAnimator({ nodeRefs, nodes }) {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < nodes.length; i++) {
      const ref = nodeRefs.current[nodes[i].id];
      if (!ref) continue;
      const heat = nodes[i].heat || 50;
      const breathe = 1 + Math.sin(t * 1.5 + heat * 0.1) * 0.04;
      ref.scale.setScalar(breathe);
      ref.rotation.x = t * 0.15;
      ref.rotation.y = t * 0.2;
    }
  });
}

/**
 * 主题锚点 — 中央全息标题
 */
function ThemeAnchor({ theme, introPhase }) {
  const [visible, setVisible] = useState(true);
  const [shrunk, setShrunk] = useState(false);

  useEffect(() => {
    if (introPhase >= 4) {
      const t1 = setTimeout(() => setShrunk(true), 2000);
      const t2 = setTimeout(() => setVisible(false), 3500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [introPhase]);

  if (!visible || !theme) return null;

  return (
    <Billboard position={[0, 0, 0]}>
      <Html center style={{ pointerEvents: 'none' }}>
        <div style={{
          padding: shrunk ? '6px 16px' : '16px 28px',
          borderRadius: '12px',
          background: 'rgba(8, 12, 20, 0.85)',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          backdropFilter: 'blur(16px)',
          textAlign: 'center',
          transition: 'all 0.8s ease',
          opacity: introPhase >= 1 ? 1 : 0,
        }}>
          <div style={{
            fontSize: shrunk ? '12px' : '18px',
            fontWeight: 700,
            color: '#00F0FF',
            textShadow: '0 0 12px rgba(0,240,255,0.5)',
            transition: 'font-size 0.8s ease',
          }}>
            {theme.name}
          </div>
          {!shrunk && (
            <>
              <div style={{ width: '60%', height: '1px', margin: '8px auto', background: 'linear-gradient(90deg, transparent, #00F0FF, transparent)' }} />
              <div style={{ fontSize: '11px', color: '#8B95A5', maxWidth: '280px', lineHeight: 1.5 }}>
                {theme.description}
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '12px', justifyContent: 'center', fontSize: '10px', fontFamily: 'monospace' }}>
                <span style={{ color: '#FF6B35' }}>热度 {Math.round(theme.heat_score || 0)}</span>
                <span style={{ color: '#00F0FF' }}>节点 {useStore.getState().nodes.length}</span>
                <span style={{ color: '#6C5CE7' }}>关系 {useStore.getState().edges.length}</span>
              </div>
            </>
          )}
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
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const fov = camera.fov * Math.PI / 180;
      const aspect = size.width / size.height;

      // 水平方向需要的距离
      const hFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
      const hDist = sphere.radius / Math.tan(hFov / 2);
      // 垂直方向需要的距离
      const vDist = sphere.radius / Math.tan(fov / 2);
      // 取较大值确保两个方向都能装下，再留 2.2 倍余量给标签和 HUD
      const dist = Math.max(hDist, vDist, 40) * 2.2;

      camera.position.set(center.x + dist * 0.35, center.y + dist * 0.45, center.z + dist);
      camera.lookAt(center);
      camera.updateProjectionMatrix();
      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    }, 150);
  }, [layoutStable]);

  return null;
}

/**
 * 主图谱场景
 */
export default function ForceGraphScene({ nodes, edges, introPhase }) {
  const { nodes: simNodes, edges: simEdges, layoutStable, positionsRef } = useForceSimulation(nodes, edges, {
    charge: -800, linkDistance: 50, collideRadius: 14, depth: 80,
  });

  const selectNode = useStore(s => s.selectNode);
  const hoverNode = useStore(s => s.hoverNode);
  const selectedNodeId = useStore(s => s.selectedNodeId);
  const hoveredNodeId = useStore(s => s.hoveredNodeId);
  const currentTheme = useStore(s => s.currentTheme);
  const controlsRef = useRef(null);
  const nodeRefs = useRef({});

  // 构建 node 位置索引
  const nodePosMap = useMemo(() => {
    const m = new Map();
    simNodes.forEach(n => m.set(n.id, { x: n.x || 0, y: n.y || 0, z: n.z || 0 }));
    return m;
  }, [simNodes]);

  // 计算选中节点的关联节点集合
  const relatedIds = useMemo(() => {
    if (!selectedNodeId) return null;
    const set = new Set([selectedNodeId]);
    simEdges.forEach(e => {
      const sid = typeof e.source === 'string' ? e.source : e.source.id;
      const tid = typeof e.target === 'string' ? e.target : e.target.id;
      if (sid === selectedNodeId) set.add(tid);
      if (tid === selectedNodeId) set.add(sid);
    });
    return set;
  }, [selectedNodeId, simEdges]);

  return (
    <Canvas
      camera={{ position: [0, 10, 50], fov: 55, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <CameraRig controlsRef={controlsRef} />
      <AutoFitView nodes={simNodes} layoutStable={layoutStable} controlsRef={controlsRef} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 20, 10]} intensity={0.6} color="#00F0FF" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#6C5CE7" />
      <directionalLight position={[5, 10, 5]} intensity={0.4} color="#ffffff" />

      <ParticleBackground count={300} />

      {/* 主题锚点 */}
      <ThemeAnchor theme={currentTheme} introPhase={introPhase} />

      <gridHelper args={[200, 50, '#1a2030', '#1a2030']} position={[0, -30, 0]} />

      <NodeAnimator nodeRefs={nodeRefs} nodes={simNodes} />

      {simNodes.map(node => (
        <HolographicNode
          key={node.id}
          node={node}
          groupRef={(el) => { if (el) nodeRefs.current[node.id] = el; }}
          onClick={selectNode}
          onHover={hoverNode}
          onLeave={() => hoverNode(null)}
          selectedNodeId={selectedNodeId}
          hoveredNodeId={hoveredNodeId}
          relatedIds={relatedIds}
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
            selectedNodeId={selectedNodeId}
            relatedIds={relatedIds}
          />
        );
      })}
    </Canvas>
  );
}
