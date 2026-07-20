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
 * 玻璃材质 + 内部线框旋转 + 呼吸灯 + 标签跟随
 * 
 * 交互改进：
 * - hover 标签有 400ms 延迟消失，让用户来得及看清信息
 * - hover 时节点放大但不影响拖拽体验
 */
export default function HolographicNode({ node, onClick }) {
  const meshRef = useRef(null);
  const ringRef = useRef(null);
  const groupRef = useRef(null);
  const store = useStore();
  
  // 本地 hover 状态，带延迟消失
  const [localHovered, setLocalHovered] = useState(false);
  const hoverTimer = useRef(null);

  const isSelected = store.selectedNodeId === node.id;
  const isDimmed = store.selectedNodeId && store.selectedNodeId !== node.id;

  const baseColor = NODE_COLORS[node.type] || '#00F0FF';
  const scale = 1 + (node.heat / 100) * 0.8;
  const icon = NODE_ICONS[node.type] || '●';

  const wireframeGeo = useMemo(() => new THREE.IcosahedronGeometry(1.2, 1), []);

  // hover 进入：立即显示
  const handlePointerOver = (e) => {
    e.stopPropagation();
    store.hoverNode(node.id);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setLocalHovered(true);
  };

  // hover 离开：延迟 400ms 消失，让用户看清信息
  const handlePointerOut = () => {
    store.hoverNode(null);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setLocalHovered(false), 400);
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); };
  }, []);

  // 选中时也保持显示
  const showLabel = localHovered || isSelected;

  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;

    // 呼吸动画
    const breathe = 1 + Math.sin(t * 2 + node.heat * 0.1) * 0.05;
    const targetScale = scale * breathe * (showLabel ? 1.15 : 1);
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
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      {/* 外发光环 */}
      {showLabel && (
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
          emissiveIntensity={showLabel ? 0.8 : 0.3}
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

      {/* 标签 — 带延迟消失 */}
      <Billboard>
        <Html
          center
          style={{
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: isDimmed ? 0.15 : (showLabel ? 1 : 0.7),
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
                热度 {node.heat} · 稀缺 {node.scarcity}
              </div>
            )}
          </div>
        </Html>
      </Billboard>
    </group>
  );
}
