import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

/**
 * 相机控制器
 * 
 * 自由模式：OrbitControls 接管
 * 飞行模式：点击节点触发，完成后交还控制权
 */
export default function CameraRig({ controlsRef }) {
  const { camera } = useThree();
  const flyTarget = useRef(null);
  const flyLookAt = useRef(null);
  const isFlying = useRef(false);
  const flyProgress = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());
  const store = useStore();

  useEffect(() => {
    if (!store.cameraTarget || !controlsRef.current) return;

    const [tx, ty, tz] = store.cameraTarget;

    startPos.current.copy(camera.position);
    if (controlsRef.current.target) {
      startLookAt.current.copy(controlsRef.current.target);
    }

    flyTarget.current = new THREE.Vector3(tx, ty, tz);
    flyLookAt.current = new THREE.Vector3(tx, ty, tz - 15);
    flyProgress.current = 0;
    isFlying.current = true;
    controlsRef.current.enabled = false;
  }, [store.cameraTarget, camera, controlsRef]);

  useFrame((_, delta) => {
    if (isFlying.current && flyTarget.current && controlsRef.current) {
      flyProgress.current = Math.min(flyProgress.current + delta * 1.2, 1);
      const t = easeInOutCubic(flyProgress.current);

      camera.position.lerpVectors(startPos.current, flyTarget.current, t);
      const lookAt = new THREE.Vector3().lerpVectors(startLookAt.current, flyLookAt.current, t);
      camera.lookAt(lookAt);
      controlsRef.current.target.copy(lookAt);

      if (flyProgress.current >= 1) {
        isFlying.current = false;
        controlsRef.current.enabled = true;
        if (store.cameraTarget) {
          useStore.setState({ cameraTarget: null });
        }
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      panSpeed={0.6}
      minDistance={8}
      maxDistance={300}
      maxPolarAngle={Math.PI * 0.75}
      minPolarAngle={Math.PI * 0.25}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
