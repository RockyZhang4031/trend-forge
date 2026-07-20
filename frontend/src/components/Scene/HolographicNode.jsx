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

/**
 * 全息数据球体节点
 * 
 * 视觉降噪策略：
 * - 只有热度 ≥70 的节点常显标签（Top 重要节点）
 * - 热度 <70 的节点标签默认隐藏，hover 才显示
 * - 低热度节点缩小 + 降低亮度，视觉上退到背景
 */
export default function HolographicNode({ node, onClick }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const store = useStore();

  const [localHovered, setLocalHovered] = useState(false);
  const hoverTimer = useRef(null);

  const isSelected = store.selectedNodeId === node.id;
  const isDimmed = store.selectedNodeId && store.selectedNodeId !== node.id;

  const baseColor = NODE_COLORS[node.type] || '#00F0FF';
  const heat = node.heat || 50;

  // 是否为重要节点（热度 ≥70）— 只有重要节点常显标签
  const isImportant = heat >= 70;

  // 节点大小差距更大：低热度很小，高热度很大
  const scale = 0.4 + (heat / 100) * 1.8;  // 0.4 ~ 2.2

  const icon = NODE_ICONS[node.type] || '●';
  const wireframeGeo = useMemo(() => new THREE.IcosahedronGeometry(1.2, 1), []);

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

  // 标签可见性：重要节点常显（半透明），非重要节点只有 hover/选中才显示
  const labelOpacity = isDimmed ? 0.1 : (showLabel ? 1 : (isImportant ? 0.5 : 0));

  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;

    const breathe = 1 + Math.sin(t * 2 + heat * 0.1) * 0.05;
    const targetScale = scale * breathe * (showLabel ? 1.15 : 1);
    meshRef.current.scale.setScalar(targetScale);

    const wire = meshRef.current.children[0];
    if (wire) {
      wire.rotation.x = t * 0.3;
      wire.rotation.y = t * 0.5;
    }

    groupRef.current.position.y = (node.y || 0) + Math.sin(t * 0.5 + heat) * 0.3;
  });

  return (
    <group
      ref={groupRef}
      position={[node.x || 0, node.y || 0, node.z || 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      {/* 主球体 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshPhysicalMaterial
          color={baseColor}
          transparent
          opacity={isDimmed ? 0.15 : (isImportant ? 0.85 : 0.5)}
          roughness={0.1}
          metalness={0.1}
          transmission={0.6}
          thickness={1}
          emissive={baseColor}
          emissiveIntensity={showLabel ? 1.0 : (isImportant ? 0.4 + (heat - 70) / 30 * 0.4 : 0.15)}
        />
        <mesh geometry={wireframeGeo}>
          <meshBasicMaterial
            color={baseColor}
            wireframe
            transparent
            opacity={isDimmed ? 0.05 : (isImportant ? 0.4 : 0.15)}
          />
        </mesh>
      </mesh>

      {/* 标签 — 只有重要节点或 hover 时才显示 */}
      {labelOpacity > 0 && (
        <Billboard>
          <Html
            center
            style={{
              pointerEvents: 'none',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              opacity: labelOpacity,
              transform: `scale(${showLabel ? 1.15 : 1})`,
            }}
          >
            <div style={{ width: 120 }} className="flex flex-col items-center">
              <div
                className="px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap"
                style={{
                  background: 'rgba(0,0,0,0.7)',
                  color: baseColor,
                  border: `1px solid ${baseColor}40`,
                  backdropFilter: 'blur(4px)',
                  textShadow: `0 0 8px ${baseColor}`,
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
