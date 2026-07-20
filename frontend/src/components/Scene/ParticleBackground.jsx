import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 粒子背景 — 轻量版
 * 300 粒子 + 无 sqrt + 每 3 帧更新一次
 */
export default function ParticleBackground({ count = 300 }) {
  const meshRef = useRef(null);
  const frameCount = useRef(0);

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
    frameCount.current++;
    // 每 3 帧更新一次，节省 CPU
    if (frameCount.current % 3 !== 0) return;

    const array = meshRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      array[ix] += velocities[ix];
      array[ix + 1] += velocities[ix + 1];
      array[ix + 2] += velocities[ix + 2];
      // 简化边界检查（无 sqrt）
      if (array[ix] > 100) array[ix] = -100;
      else if (array[ix] < -100) array[ix] = 100;
      if (array[ix + 1] > 100) array[ix + 1] = -100;
      else if (array[ix + 1] < -100) array[ix + 1] = 100;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
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
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
