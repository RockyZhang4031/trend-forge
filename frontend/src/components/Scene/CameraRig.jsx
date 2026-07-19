import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

/**
 * 相机控制器 — 平滑飞行聚焦 + OrbitControls
 */
export default function CameraRig() {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 40));
  const store = useStore();

  useFrame(() => {
    if (store.cameraTarget) {
      targetPos.current.set(store.cameraTarget[0], store.cameraTarget[1], store.cameraTarget[2]);
    } else {
      targetPos.current.set(0, 0, 40);
    }
    camera.position.lerp(targetPos.current, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return (
    <OrbitControls
      enablePan
      enableZoom
      enableRotate
      dampingFactor={0.05}
      minDistance={10}
      maxDistance={100}
    />
  );
}
