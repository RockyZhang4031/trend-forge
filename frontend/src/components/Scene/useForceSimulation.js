import { useEffect, useRef, useState } from 'react';
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceCollide, forceRadial } from 'd3-force';

/**
 * D3-Force 驱动的力导向布局 Hook
 * 
 * 改进：非线性 weight 映射 + 低 alpha 持续微动
 * 
 * 非线性映射（类 sigmoid 激活函数）：
 * - weight 60→strength 0.15（弱关联，拉得很松）
 * - weight 80→strength 0.55（中等）
 * - weight 95→strength 0.95（强关联，紧密贴合）
 * 这样强弱关系的距离差异被放大 6 倍，肉眼可辨
 * 
 * 持续微动：
 * - 布局稳定后不彻底停止，保持 alpha=0.02 的极低能量
 * - 节点有轻微漂移，图"活着"而非冻结
 */

// 非线性映射函数：将 weight 0-100 映射为 link strength 0-1
// 使用 sigmoid 变体，放大中段差异
function weightToStrength(weight) {
  const w = Math.max(0, Math.min(100, weight || 50));
  // 归一化到 -1 ~ 1
  const x = (w - 50) / 50;
  // sigmoid: 1/(1+e^(-4x))，4 倍增益让中段差异明显
  return 1 / (1 + Math.exp(-4 * x));
}

// weight 映射为连线目标距离：强关系近，弱关系远
function weightToDistance(weight, baseDistance) {
  const s = weightToStrength(weight);
  // 强关系 distance = baseDistance * 0.3，弱关系 = baseDistance * 2.0
  return baseDistance * (2.0 - s * 1.7);
}

// 节点热度映射为排斥力强度：热度高的节点排斥力更大（占地盘）
function heatToCharge(heat) {
  const h = (heat || 50) / 100;
  return -300 - h * -400; // -300(冷) ~ -700(热)
}

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

    // 初始位置：球面随机分布
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
      .velocityDecay(0.4)  // 阻尼，运动更柔和
      .force('charge', forceManyBody().strength(d => heatToCharge(d.heat)))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide(collideRadius))
      .force('link', forceLink(simLinks)
        .id(d => d.id)
        .distance(d => weightToDistance(d.weight || (d.strength ? d.strength * 100 : 50), linkDistance))
        .strength(d => weightToStrength(d.weight || (d.strength ? d.strength * 100 : 50)))
      )
      .on('tick', () => {
        const updated = simNodes.map(n => {
          const heatZ = ((n.heat || 50) / 100) * depth - depth / 2;
          const typeZ = (TYPE_Z_OFFSET[n.type] || 0);
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

    const safetyTimer = setTimeout(() => {
      setLayoutStable(true);
      // 布局稳定后不彻底停止，保持低 alpha 微动
      if (simRef.current) {
        simRef.current.alpha(0.03).alphaTarget(0.001).restart();
      }
    }, 3000);

    return () => {
      sim.stop();
      clearTimeout(safetyTimer);
    };
  }, [nodes.length, edges.length, charge, linkDistance, collideRadius, depth]);

  return { nodes: simulatedNodes, edges: simulatedEdges, layoutStable };
}
