import { useEffect, useRef, useState } from 'react';
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceCollide } from 'd3-force';

/**
 * D3-Force 驱动的力导向布局 Hook
 * 2D 布局计算 + Z 轴深度映射
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
  const simRef = useRef(null);

  useEffect(() => {
    if (!nodes.length) return;

    // 深拷贝，避免修改原数据
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
      });

    simRef.current = sim;
    sim.alpha(1).restart();

    return () => sim.stop();
  }, [nodes.length, edges.length, charge, linkDistance, collideRadius, depth]);

  return { nodes: simulatedNodes, edges: simulatedEdges };
}
