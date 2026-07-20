import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

/**
 * 相机控制器
 * 
 * 两种模式：
 * 1. 自由模式（默认）— OrbitControls 完全接管，用户自由拖拽/旋转/缩放
 * 2. 飞行模式 — 点击节点时触发，相机平滑飞到目标位置，完成后交还控制权
 * 
 * 关键：useFrame 不在自由模式下干涉相机，避免跟 OrbitControls 打架
 */
export default function CameraRig() {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);
  const flyTarget = useRef(null);       // 飞行目标位置
  const flyLookAt = useRef(null);       // 飞行目标注视点
  const isFlying = useRef(false);       // 是否正在飞行
  const flyProgress = useRef(0);        // 飞行进度 0→1
  const startPos = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());
  const store = useStore();

  // 监听 cameraTarget 变化，触发飞行
  useEffect(() => {
    if (!store.cameraTarget || !controlsRef.current) return;

    const [tx, ty, tz] = store.cameraTarget;
    flyTarget.current = new THREE.Vector3(tx, ty, tz);
    flyLookAt.current = new THREE.Vector3(tx, ty, tz - 15); // 注视节点位置

    // 记录起点
    startPos.current.copy(camera.position);
    if (controlsRef.current.target) {
      startLookAt.current.copy(controlsRef.current.target);
    } else {
      startLookAt.current.set(0, 0, 0);
    }

    isFlying.current = true;
    flyProgress.current = 0;

    // 飞行期间禁用 OrbitControls
    controlsRef.current.enabled = false;
  }, [store.cameraTarget]);

  useFrame((_, delta) => {
    if (!isFlying.current || !flyTarget.current || !controlsRef.current) return;

    // 飞行进度推进（约 1 秒到达）
    flyProgress.current = Math.min(flyProgress.current + delta * 1.2, 1);

    // easeInOutCubic 缓动
    const t = flyProgress.current;
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // 插值相机位置
    camera.position.lerpVectors(startPos.current, flyTarget.current, eased);

    // 插值注视点
    const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt.current, flyLookAt.current, eased);
    controlsRef.current.target.copy(currentLookAt);
    camera.lookAt(currentLookAt);

    // 飞行完成
    if (flyProgress.current >= 1) {
      isFlying.current = false;
      controlsRef.current.enabled = true;
      // 清除 cameraTarget，避免重复触发
      if (store.cameraTarget) {
        useStore.setState({ cameraTarget: null });
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      enableDamping          // 开启阻尼，拖拽后有惯性减速
      dampingFactor={0.08}   // 阻尼系数，越小停得越慢越平滑
      rotateSpeed={0.6}      // 旋转速度稍慢，更可控
      zoomSpeed={0.8}        // 缩放速度
      panSpeed={0.6}         // 平移速度
      minDistance={8}        // 最近距离
      maxDistance={120}      // 最远距离
      // 限制垂直旋转角度，避免完全翻转
      maxPolarAngle={Math.PI * 0.85}
      minPolarAngle={Math.PI * 0.15}
      // 鼠标按钮映射
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      // 触摸手势
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
}
