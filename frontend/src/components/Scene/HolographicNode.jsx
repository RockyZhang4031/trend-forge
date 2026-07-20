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

// 共享几何体 — 全局单例，23 个节点共享 5 个几何体而非 46 个
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

/**
 * 3D 节点 — 去掉 useFrame，由 NodeAnimator 统一驱动
 */
export default function HolographicNode({ node, groupRef, onClick, onHover, onLeave }) {
  const [localHovered, setLocalHovered] = useState(false);
  const hoverTimer = useRef(null);

  const baseColor = NODE_COLORS[node.type] || '#00F0FF';
  const heat = node.heat || 50;
  const isImportant = heat >= 70;
  const isCenter = heat >= 90;
  const scale = isCenter ? 2.5 : (isImportant ? 1.2 + (heat - 70) / 20 * 0.5 : 0.5 + (heat / 70) * 0.3);
  const icon = NODE_ICONS[node.type] || '●';
  const geometry = SHARED_GEO[node.type] || SHARED_GEO.concept;
  const wireGeometry = SHARED_WIRE_GEO[node.type] || SHARED_WIRE_GEO.concept;

  const handleOver = (e) => {
    e.stopPropagation();
    onHover?.(node.id);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setLocalHovered(true);
  };
  const handleOut = () => {
    onLeave?.();
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setLocalHovered(false), 400);
  };

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);

  const showLabel = localHovered;
  const labelOpacity = (showLabel ? 1 : (isImportant ? 0.6 : 0));

  return (
    <group
      ref={groupRef}
      position={[node.x || 0, node.y || 0, node.z || 0]}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={(e) => { e.stopPropagation(); onClick?.(node.id); }}
    >
      {isCenter && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.2, 0.03, 8, 48]} />
          <meshBasicMaterial color={baseColor} transparent opacity={0.4} />
        </mesh>
      )}

      <mesh geometry={geometry} scale={scale}>
        <meshStandardMaterial
          color={baseColor}
          transparent
          opacity={isImportant ? 0.7 : 0.35}
          roughness={0.3}
          metalness={0.6}
          emissive={baseColor}
          emissiveIntensity={isCenter ? 0.6 : (isImportant ? 0.3 : 0.1)}
          flatShading={true}
        />
      </mesh>

      <mesh geometry={wireGeometry} scale={scale}>
        <meshBasicMaterial
          color={baseColor}
          wireframe
          transparent
          opacity={isImportant ? 0.5 : 0.2}
        />
      </mesh>

      {labelOpacity > 0 && (
        <Billboard>
          <Html center style={{
            pointerEvents: 'none',
            opacity: labelOpacity,
            transition: 'opacity 0.2s',
          }}>
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
