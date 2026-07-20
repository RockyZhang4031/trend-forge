import { useEffect, useRef, useState } from 'react';
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceCollide } from 'd3-force';

/**
 * D3-Force 驱动的力导向布局 Hook
 * 2D 布局计算 + Z 轴深度映射
 * 
 * 改进：布局稳定后自动 fitView，确保所有节点都在视野内
 */
export function useForceSimulation(nodes, edges, options = {}) {
  const {
    charge = -400,
    linkDistance = 30,
    collideRadius = 6,
    depth = 50,
  } = options;

  const [simulatedNodes, setSimulatedNodes] = useState(nodes);
  const [simulatedEdges, setSimulatedEdges] = useState(edges);
  const [layoutStable, setLayoutStable] = useState(false);
  const simRef = useRef(null);

  useEffect(() => {
    if (!nodes.length) return;

    setLayoutStable(false);
    const simNodes = nodes.map(n => ({ ...n }));
    const simLinks = edges.map(e => ({ ...e }));

    // 初始位置：从中心附近开始（大爆炸入场）
    simNodes.forEach(n => {
      if (n.x === undefined) {
        n.x = (Math.random() - 0.5) * 5;
        n.y = (Math.random() - 0.5) * 5;
      }
    });

    const sim = forceSimulation(simNodes)
      .force('charge', forceManyBody().strength(charge))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide(collideRadius))
      .force('link', forceLink(simLinks)
        .id(d => d.id)
        .distance(linkDistance)
        .strength(d => d.strength || 0.5)
      )
      .on('tick', () => {
        const updated = simNodes.map(n => ({
          ...n,
          x: n.x,
          y: n.y,
          z: ((n.heat || 50) / 100) * depth - depth / 2,
        }));
        setSimulatedNodes(updated);
        setSimulatedEdges([...simLinks]);
      })
      .on('end', () => {
        // 布局稳定
        setLayoutStable(true);
      });

    simRef.current = sim;
    sim.alpha(1).restart();

    // 安全兜底：如果 3 秒后还没 end（alpha 没降到 0），强制标记稳定
    const safetyTimer = setTimeout(() => setLayoutStable(true), 3000);

    return () => {
      sim.stop();
      clearTimeout(safetyTimer);
    };
  }, [nodes.length, edges.length, charge, linkDistance, collideRadius, depth]);

  return { nodes: simulatedNodes, edges: simulatedEdges, layoutStable };
}
