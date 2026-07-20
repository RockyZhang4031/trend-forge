import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

const NODE_COLORS = {
  technology: '#00F0FF',
  person: '#FF6B35',
  company: '#6C5CE7',
  resource: '#FFD700',
  concept: '#00D9A5',
};

const NODE_ICONS = {
  technology: '⚙️',
  person: '👤',
  company: '🏢',
  resource: '💎',
  concept: '🚀',
};

// 不同类型用不同几何体，不是全用球
const NODE_GEOMETRIES = {
  technology: () => new THREE.IcosahedronGeometry(1, 0),   // 二十面体
  person: () => new THREE.OctahedronGeometry(1, 0),        // 八面体
  company: () => new THREE.BoxGeometry(1.4, 1.4, 1.4),     // 立方体
  resource: () => new THREE.DodecahedronGeometry(1, 0),    // 十二面体
  concept: () => new THREE.TetrahedronGeometry(1.2, 0),    // 四面体
};

/**
 * 3D 节点 — 多面体几何 + 内部线框 + 外发光
 * 
 * 视觉层级：
 * - 中心主题节点（type=concept, heat≥90）: 最大最亮，带旋转光环
 * - 重要节点（heat≥70）: 中等大小，常显标签
 * - 普通节点（heat<70）: 小且暗，hover 才显示标签
 */
export default function HolographicNode({ node, onClick }) {
  const meshRef = useRef(null);
  const ringRef = useRef(null);
  const groupRef = useRef(null);
  const store = useStore();

  const [localHovered, setLocalHovered] = useState(false);
  const hoverTimer = useRef(null);

  const isSelected = store.selectedNodeId === node.id;
  const isDimmed = store.selectedNodeId && store.selectedNodeId !== node.id;

  const baseColor = NODE_COLORS[node.type] || '#00F0FF';
  const heat = node.heat || 50;

  const isImportant = heat >= 70;
  const isCenter = heat >= 90;  // 中心级节点

  // 节点大小：中心节点 2.5x，重要 1.5x，普通 0.6x
  const scale = isCenter ? 2.5 : (isImportant ? 1.2 + (heat - 70) / 20 * 0.5 : 0.5 + (heat / 70) * 0.3);

  const icon = NODE_ICONS[node.type] || '●';
  const geometry = useMemo(() => NODE_GEOMETRIES[node.type]?.() || NODE_GEOMETRIES.concept(), [node.type]);
  const wireGeometry = useMemo(() => {
    // 线框比本体略大
    const g = NODE_GEOMETRIES[node.type]?.() || NODE_GEOMETRIES.concept();
    g.scale(1.15, 1.15, 1.15);
    return g;
  }, [node.type]);

  const handlePointerOver = (e) => {
    e.stopPropagation();
    store.hoverNode(node.id);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setLocalHovered(true);
  };

  const handlePointerOut = () => {
    store.hoverNode(null);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setLocalHovered(false), 400);
  };

  useEffect(() => {
    return () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); };
  }, []);

  const showLabel = localHovered || isSelected;
  const labelOpacity = isDimmed ? 0.1 : (showLabel ? 1 : (isImportant ? 0.6 : 0));

  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;

    const breathe = 1 + Math.sin(t * 1.5 + heat * 0.1) * 0.04;
    const targetScale = scale * breathe * (showLabel ? 1.15 : 1);
    meshRef.current.scale.setScalar(targetScale);

    // 3D 旋转 — 让多面体真正转起来，展示立体感
    meshRef.current.rotation.x = t * 0.2;
    meshRef.current.rotation.y = t * 0.35;
    meshRef.current.rotation.z = t * 0.1;

    // 悬浮微动
    groupRef.current.position.y = (node.y || 0) + Math.sin(t * 0.5 + heat) * 0.2;

    // 中心节点光环旋转
    if (ringRef.current && isCenter) {
      ringRef.current.rotation.z = t * 0.3;
      const ringScale = 1 + Math.sin(t * 2) * 0.08;
      ringRef.current.scale.setScalar(ringScale);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[node.x || 0, node.y || 0, node.z || 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      {/* 中心节点光环 */}
      {isCenter && !isDimmed && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.2, 0.03, 8, 64]} />
          <meshBasicMaterial color={baseColor} transparent opacity={0.4} />
        </mesh>
      )}

      {/* 主多面体 */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          color={baseColor}
          transparent
          opacity={isDimmed ? 0.12 : (isImportant ? 0.7 : 0.35)}
          roughness={0.3}
          metalness={0.6}
          emissive={baseColor}
          emissiveIntensity={showLabel ? 0.8 : (isCenter ? 0.6 : (isImportant ? 0.3 : 0.1))}
          flatShading={true}
        />
      </mesh>

      {/* 外层线框 */}
      <mesh geometry={wireGeometry}>
        <meshBasicMaterial
          color={baseColor}
          wireframe
          transparent
          opacity={isDimmed ? 0.03 : (isImportant ? 0.5 : 0.2)}
        />
      </mesh>

      {/* 标签 */}
      {labelOpacity > 0 && (
        <Billboard>
          <Html
            center
            style={{
              pointerEvents: 'none',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              opacity: labelOpacity,
              transform: `scale(${showLabel ? 1.1 : 1})`,
            }}
          >
            <div style={{ width: 120 }} className="flex flex-col items-center">
              <div
                className="px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap"
                style={{
                  background: 'rgba(0,0,0,0.75)',
                  color: baseColor,
                  border: `1px solid ${baseColor}50`,
                  backdropFilter: 'blur(4px)',
                  textShadow: `0 0 8px ${baseColor}`,
                  fontWeight: isCenter ? 700 : 400,
                }}
              >
                {icon} {node.name}
              </div>
              {showLabel && (
                <div
                  className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    color: '#8B95A5',
                    border: `1px solid ${baseColor}20`,
                  }}
                >
                  热度 {heat} · 稀缺 {node.scarcity}
                </div>
              )}
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
}
