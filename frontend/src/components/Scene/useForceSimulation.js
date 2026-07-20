import { useEffect, useRef, useState } from 'react';
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceCollide } from 'd3-force';

/**
 * D3-Force 布局 — 性能优先版
 * 
 * 核心优化：不在每次 tick 调 setState，用 ref 存位置
 * 只在布局稳定后做一次 React state 更新
 * 
 * 期间通过 positionsRef 让 3D 组件直接读取最新位置
 * 避免 23 个组件 × 300+ tick = 6900+ 次 re-render
 */

function weightToStrength(weight) {
  const w = Math.max(0, Math.min(100, weight || 50));
  return 1 / (1 + Math.exp(-4 * (w - 50) / 50));
}

function weightToDistance(weight, base) {
  return base * (2.0 - weightToStrength(weight) * 1.7);
}

const TYPE_Z_OFFSET = {
  technology: 25, person: -15, company: 10, resource: -25, concept: 0,
};

export function useForceSimulation(nodes, edges, options = {}) {
  const {
    charge = -400,
    linkDistance = 25,
    collideRadius = 6,
    depth = 80,
  } = options;

  const [simulatedNodes, setSimulatedNodes] = useState(nodes);
  const [simulatedEdges, setSimulatedEdges] = useState(edges);
  const [layoutStable, setLayoutStable] = useState(false);
  
  // ref 存实时位置，3D 组件直接读取，跳过 React
  const positionsRef = useRef(new Map());
  const simRef = useRef(null);

  useEffect(() => {
    if (!nodes.length) return;

    setLayoutStable(false);
    const simNodes = nodes.map(n => ({ ...n }));
    const simLinks = edges.map(e => ({ ...e }));

    // 初始位置：球面分布
    simNodes.forEach(n => {
      if (n.x === undefined) {
        const r = Math.random() * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        n.x = r * Math.sin(phi) * Math.cos(theta);
        n.y = r * Math.sin(phi) * Math.sin(theta);
      }
    });

    let tickCount = 0;

    const sim = forceSimulation(simNodes)
      .velocityDecay(0.4)
      .alphaDecay(0.05)   // 快速收敛，约 50 tick 稳定
      .force('charge', forceManyBody().strength(d => -300 - (d.heat || 50) / 100 * 400))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide(collideRadius))
      .force('link', forceLink(simLinks)
        .id(d => d.id)
        .distance(d => weightToDistance(d.weight || 50, linkDistance))
        .strength(d => weightToStrength(d.weight || 50))
      )
      .on('tick', () => {
        tickCount++;
        // 只更新 ref，不触发 React re-render
        simNodes.forEach(n => {
          const heatZ = ((n.heat || 50) / 100) * depth - depth / 2;
          const typeZ = TYPE_Z_OFFSET[n.type] || 0;
          const seed = n.id ? n.id.charCodeAt(0) + n.id.charCodeAt(n.id.length - 1) : 0;
          positionsRef.current.set(n.id, {
            x: n.x,
            y: n.y,
            z: heatZ + typeZ + Math.sin(seed * 1.7) * 15,
          });
        });
      })
      .on('end', () => {
        // 稳定后做一次 React state 更新
        const finalNodes = simNodes.map(n => {
          const pos = positionsRef.current.get(n.id) || { x: n.x, y: n.y, z: 0 };
          return { ...n, x: pos.x, y: pos.y, z: pos.z };
        });
        setSimulatedNodes(finalNodes);
        setSimulatedEdges([...simLinks]);
        setLayoutStable(true);
      });

    simRef.current = sim;

    // 安全兜底：800ms 后强制稳定
    const safetyTimer = setTimeout(() => {
      if (!positionsRef.current.size) return;
      const finalNodes = simNodes.map(n => {
        const pos = positionsRef.current.get(n.id) || { x: n.x, y: n.y, z: 0 };
        return { ...n, x: pos.x, y: pos.y, z: pos.z };
      });
      setSimulatedNodes(finalNodes);
      setLayoutStable(true);
    }, 800);

    return () => {
      sim.stop();
      clearTimeout(safetyTimer);
    };
  }, [nodes.length, edges.length, charge, linkDistance, collideRadius, depth]);

  return { nodes: simulatedNodes, edges: simulatedEdges, layoutStable, positionsRef };
}
