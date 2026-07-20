import { useRef, useMemo, useState, useEffect } from 'react';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';

const NODE_COLORS = {
  technology: '#00F0FF',
  person: '#FF6B35',
  company: '#6C5CE7',
  resource: '#FFD700',
  concept: '#00D9A5',
};

const NODE_ICONS = {
  technology: '⚙️', person: '👤', company: '🏢', resource: '💎', concept: '🚀',
};

// 共享几何体
const SHARED_GEO = {
  technology: new THREE.IcosahedronGeometry(1, 0),
  person: new THREE.OctahedronGeometry(1, 0),
  company: new THREE.BoxGeometry(1.4, 1.4, 1.4),
  resource: new THREE.DodecahedronGeometry(1, 0),
  concept: new THREE.TetrahedronGeometry(1.2, 0),
};
const SHARED_WIRE_GEO = {};
for (const [k, g] of Object.entries(SHARED_GEO)) {
  SHARED_WIRE_GEO[k] = g.clone();
  SHARED_WIRE_GEO[k].scale(1.15, 1.15, 1.15);
}

// 三级分类：恒星(major) / 行星(medium) / 卫星(minor)
function getTier(node) {
  if (node.heat >= 88) return 'major';    // 恒星：heat ≥ 88
  if (node.heat >= 72) return 'medium';   // 行星：heat 72-87
  return 'minor';                          // 卫星：heat < 72
}

const TIER_SIZES = { major: 2.0, medium: 1.2, minor: 0.6 };
const TIER_EMISSIVE = { major: 1.0, medium: 0.4, minor: 0.12 };
const TIER_OPACITY = { major: 0.95, medium: 0.8, minor: 0.45 };

/**
 * 3D 节点 — 恒星/行星/卫星三级 + 焦点衰减
 * 由 NodeAnimator 统一驱动旋转/呼吸
 */
export default function HolographicNode({ node, groupRef, onClick, onHover, onLeave, selectedNodeId, hoveredNodeId, relatedIds }) {
  const tier = getTier(node);
  const baseColor = NODE_COLORS[node.type] || '#00F0FF';
  const icon = NODE_ICONS[node.type] || '●';
  const heat = node.heat || 50;

  const isSelected = selectedNodeId === node.id;
  const isHovered = hoveredNodeId === node.id;
  const isCenter = tier === 'major';

  // 焦点衰减
  const getFocusOpacity = () => {
    if (!selectedNodeId) return TIER_OPACITY[tier];
    if (isSelected) return 1.0;
    if (relatedIds && relatedIds.has(node.id)) return 0.7;
    return 0.1;
  };

  const focusOpacity = getFocusOpacity();
  const size = TIER_SIZES[tier];
  const emissiveInt = isSelected ? TIER_EMISSIVE[tier] * 2.5
    : isHovered ? TIER_EMISSIVE[tier] * 1.8
    : (!selectedNodeId && isCenter) ? TIER_EMISSIVE[tier] * 1.3
    : TIER_EMISSIVE[tier];

  const geometry = SHARED_GEO[node.type] || SHARED_GEO.concept;
  const wireGeometry = SHARED_WIRE_GEO[node.type] || SHARED_WIRE_GEO.concept;

  // 标签显示策略
  const showLabel = isCenter || isSelected || isHovered || (!selectedNodeId && tier === 'medium');

  return (
    <group
      ref={groupRef}
      position={[node.x || 0, node.y || 0, node.z || 0]}
      onPointerOver={(e) => { e.stopPropagation(); onHover(node.id); }}
      onPointerOut={() => onLeave()}
      onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
    >
      {/* 中心节点光环 */}
      {(isCenter && !selectedNodeId) || isSelected ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.5, size * 1.7, 32]} />
          <meshBasicMaterial color={baseColor} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ) : null}

      {/* 主几何体 */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={baseColor}
          transparent
          opacity={focusOpacity}
          roughness={0.3}
          metalness={0.6}
          flatShading
          emissive={baseColor}
          emissiveIntensity={emissiveInt}
        />
      </mesh>

      {/* 外层线框 */}
      <mesh geometry={wireGeometry}>
        <meshBasicMaterial
          color={baseColor}
          wireframe
          transparent
          opacity={focusOpacity * 0.3}
        />
      </mesh>

      {/* 标签 — 放在节点下方，间距加大 */}
      {showLabel && (
        <Billboard position={[0, -size - 1.5, 0]}>
          <Html center style={{ pointerEvents: 'none', opacity: focusOpacity }}>
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
                  fontSize: isCenter ? '14px' : '11px',
                }}
              >
                {icon} {node.name}
                {isCenter && <span style={{ fontSize: '9px', color: '#8B95A5', marginLeft: '4px' }}>🔥{heat}</span>}
              </div>
              {(isHovered || isSelected) && (
                <div className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#8B95A5' }}>
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
