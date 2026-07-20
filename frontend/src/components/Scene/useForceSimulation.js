import { useEffect, useRef, useState } from 'react';
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceCollide } from 'd3-force';

/**
 * D3-Force 驱动的力导向布局 Hook
 * 
 * 2D 力导向算 X/Y，Z 轴用多维度混合生成真正的 3D 空间分布：
 * - 热度越高越靠近前景（用户侧）
 * - 类型分组在不同 Z 层
 * - 随机偏移避免共面
 * 
 * 这样旋转视角时能看到立体星云，不是扁平饼
 */
export function useForceSimulation(nodes, edges, options = {}) {
  const {
    charge = -400,
    linkDistance = 30,
    collideRadius = 6,
    depth = 80,
  } = options;

  const [simulatedNodes, setSimulatedNodes] = useState(nodes);
  const [simulatedEdges, setSimulatedEdges] = useState(edges);
  const [layoutStable, setLayoutStable] = useState(false);
  const simRef = useRef(null);

  // 类型 → Z 层偏移（让不同类型处于不同深度）
  const TYPE_Z_OFFSET = {
    technology: 25,
    person: -15,
    company: 10,
    resource: -25,
    concept: 0,
  };

  useEffect(() => {
    if (!nodes.length) return;

    setLayoutStable(false);
    const simNodes = nodes.map(n => ({ ...n }));
    const simLinks = edges.map(e => ({ ...e }));

    // 初始位置：从中心球面随机分布（大爆炸入场）
    simNodes.forEach(n => {
      if (n.x === undefined) {
        const r = Math.random() * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        n.x = r * Math.sin(phi) * Math.cos(theta);
        n.y = r * Math.sin(phi) * Math.sin(theta);
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
        const updated = simNodes.map(n => {
          // Z 轴 = 热度层 + 类型层 + 随机抖动，三重混合
          const heatZ = ((n.heat || 50) / 100) * depth - depth / 2;
          const typeZ = (TYPE_Z_OFFSET[n.type] || 0);
          // 基于节点 id 的稳定随机值（不会每次 tick 变化）
          const seed = n.id ? n.id.charCodeAt(0) + n.id.charCodeAt(n.id.length - 1) : 0;
          const jitterZ = Math.sin(seed * 1.7) * 15;
          
          return {
            ...n,
            x: n.x,
            y: n.y,
            z: heatZ + typeZ + jitterZ,
          };
        });
        setSimulatedNodes(updated);
        setSimulatedEdges([...simLinks]);
      })
      .on('end', () => {
        setLayoutStable(true);
      });

    simRef.current = sim;
    sim.alpha(1).restart();

    const safetyTimer = setTimeout(() => setLayoutStable(true), 3000);

    return () => {
      sim.stop();
      clearTimeout(safetyTimer);
    };
  }, [nodes.length, edges.length, charge, linkDistance, collideRadius, depth]);

  return { nodes: simulatedNodes, edges: simulatedEdges, layoutStable };
}
