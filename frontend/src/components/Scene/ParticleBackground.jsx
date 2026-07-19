import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 粒子星云背景 — Three.js Points
 * 2000 个粒子，布朗运动 + 鼠标排斥场
 */
export default function ParticleBackground({ count = 2000 }) {
  const meshRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100 - 50;
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return [pos, vel];
  }, [count]);

  useFrame(() => {
    if (!meshRef.current) return;
    const posAttr = meshRef.current.geometry.attributes.position;
    const array = posAttr.array;
    for (let i = 0; i < count; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      array[ix] += velocities[ix];
      array[iy] += velocities[iy];
      array[iz] += velocities[iz];
      // 鼠标排斥
      const dx = array[ix] - mouseRef.current.x * 50;
      const dy = array[iy] - mouseRef.current.y * 50;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30 && dist > 0.01) {
        const force = (30 - dist) / 30 * 0.1;
        array[ix] += (dx / dist) * force;
        array[iy] += (dy / dist) * force;
      }
      if (Math.abs(array[ix]) > 100) array[ix] *= -0.9;
      if (Math.abs(array[iy]) > 100) array[iy] *= -0.9;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.4}
        color="#00F0FF"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
