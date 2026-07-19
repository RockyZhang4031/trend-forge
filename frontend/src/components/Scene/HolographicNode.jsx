import { useRef, useMemo, useState } from 'react';
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
 * 玻璃材质 + 内部线框旋转 + 呼吸灯 + 标签跟随
 */
export default function HolographicNode({ node, onClick }) {
  const meshRef = useRef(null);
  const ringRef = useRef(null);
  const groupRef = useRef(null);
  const store = useStore();

  const isSelected = store.selectedNodeId === node.id;
  const isHovered = store.hoveredNodeId === node.id;
  const isDimmed = store.selectedNodeId && store.selectedNodeId !== node.id;

  const baseColor = NODE_COLORS[node.type] || '#00F0FF';
  const scale = 1 + (node.heat / 100) * 0.8;
  const icon = NODE_ICONS[node.type] || '●';

  const wireframeGeo = useMemo(() => new THREE.IcosahedronGeometry(1.2, 1), []);

  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;

    // 呼吸动画
    const breathe = 1 + Math.sin(t * 2 + node.heat * 0.1) * 0.05;
    const targetScale = scale * breathe * (isHovered ? 1.2 : 1);
    meshRef.current.scale.setScalar(targetScale);

    // 线框旋转
    const wire = meshRef.current.children[0];
    if (wire) {
      wire.rotation.x = t * 0.3;
      wire.rotation.y = t * 0.5;
    }

    // 量子悬浮
    groupRef.current.position.y = (node.y || 0) + Math.sin(t * 0.5 + node.heat) * 0.3;

    // 光环脉冲
    if (ringRef.current) {
      const ringScale = 1 + Math.sin(t * 3) * 0.1;
      ringRef.current.scale.setScalar(ringScale);
      ringRef.current.rotation.z = t * 0.2;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[node.x || 0, node.y || 0, node.z || 0]}
      onPointerOver={(e) => { e.stopPropagation(); store.hoverNode(node.id); }}
      onPointerOut={() => store.hoverNode(null)}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      {/* 外发光环 */}
      {(isHovered || isSelected) && (
        <mesh ref={ringRef}>
          <torusGeometry args={[2.2, 0.02, 16, 100]} />
          <meshBasicMaterial color={baseColor} transparent opacity={0.5} />
        </mesh>
      )}

      {/* 主球体 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshPhysicalMaterial
          color={baseColor}
          transparent
          opacity={isDimmed ? 0.2 : 0.85}
          roughness={0.1}
          metalness={0.1}
          transmission={0.6}
          thickness={1}
          emissive={baseColor}
          emissiveIntensity={isHovered ? 0.8 : 0.3}
        />
        {/* 内部线框 */}
        <mesh geometry={wireframeGeo}>
          <meshBasicMaterial
            color={baseColor}
            wireframe
            transparent
            opacity={isDimmed ? 0.1 : 0.4}
          />
        </mesh>
      </mesh>

      {/* 标签 */}
      <Billboard>
        <Html
          center
          style={{
            pointerEvents: 'none',
            transition: 'all 0.3s ease',
            opacity: isDimmed ? 0.2 : 1,
            transform: `scale(${isHovered ? 1.15 : 1})`,
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
            {isHovered && (
              <div
                className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#8B95A5' }}
              >
                热度 {node.heat} · 稀缺 {node.scarcity}
              </div>
            )}
          </div>
        </Html>
      </Billboard>
    </group>
  );
}
