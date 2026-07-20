import { useState, useEffect } from 'react';

/**
 * 响应式 hook — 检测屏幕尺寸，提供 mobile/desktop 模式
 */
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setWidth(w);
      setIsMobile(w < 768);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return { isMobile, width };
}
