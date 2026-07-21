import { useEffect, useRef, useState } from 'react';
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceCollide, forceRadial } from 'd3-force';

/**
 * 径向力导向布局
 *
 * 数据是星型拓扑（1个hub连16条边），纯力导向无论怎么调参数
 * 节点都会挤在hub周围。改用 BFS分层 + forceRadial 约束：
 * - hub 在中心
 * - 直接连接 hub 的节点在第一层圆环
 * - 二级连接在第二层圆环
 * 每层半径保证节点间距 > 碰撞直径
 */

function weightToStrength(weight) {
  const w = Math.max(0, Math.min(100, weight || 50));
  return 1 / (1 + Math.exp(-4 * (w - 50) / 50));
}

function weightToDistance(weight, base) {
  return base * (2.0 - weightToStrength(weight) * 1.7);
}

// BFS 分层：找连接最多的节点做 hub，按距离分层
function computeLevels(nodes, edges) {
  const adj = new Map();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    const s = typeof e.source === 'object' ? e.source.id : e.source;
    const t = typeof e.target === 'object' ? e.target.id : e.target;
    adj.get(s)?.push(t);
    adj.get(t)?.push(s);
  });

  // 找 hub：连接数最多的节点
  const connCount = new Map();
  edges.forEach(e => {
    const s = typeof e.source === 'object' ? e.source.id : e.source;
    const t = typeof e.target === 'object' ? e.target.id : e.target;
    connCount.set(s, (connCount.get(s) || 0) + 1);
    connCount.set(t, (connCount.get(t) || 0) + 1);
  });
  let hubId = nodes[0]?.id;
  let maxConn = 0;
  for (const [id, count] of connCount) {
    if (count > maxConn) { maxConn = count; hubId = id; }
  }

  // BFS
  const level = new Map();
  const queue = [hubId];
  level.set(hubId, 0);
  while (queue.length) {
    const cur = queue.shift();
    const curLevel = level.get(cur);
    for (const next of adj.get(cur) || []) {
      if (!level.has(next)) {
        level.set(next, curLevel + 1);
        queue.push(next);
      }
    }
  }

  // 没有被 BFS 访问到的孤立节点，放在最外层
  nodes.forEach(n => {
    if (!level.has(n.id)) level.set(n.id, 3);
  });

  return { level, hubId };
}

// 每层圆环半径 — 保证相邻节点间距 > collideRadius
// 第1层16节点: 2*R*sin(π/16) > 14 → R > 36
const LAYER_RADIUS = [0, 40, 65, 88];
// 每层 Z 偏移 — 拉开深度层次
const LAYER_Z = [0, 8, -6, -20];

export function useForceSimulation(nodes, edges, options = {}) {
  const {
    charge = -600,
    linkDistance = 50,
    collideRadius = 14,
    depth = 80,
  } = options;

  const [simulatedNodes, setSimulatedNodes] = useState(nodes);
  const [simulatedEdges, setSimulatedEdges] = useState(edges);
  const [layoutStable, setLayoutStable] = useState(false);

  const positionsRef = useRef(new Map());
  const simRef = useRef(null);

  useEffect(() => {
    if (!nodes.length) return;

    setLayoutStable(false);
    const simNodes = nodes.map(n => ({ ...n }));
    const simLinks = edges.map(e => ({ ...e }));

    // 计算分层
    const { level, hubId } = computeLevels(simNodes, simLinks);

    // 初始位置：按层放在圆环上，避免力导向冷启动挤在一起
    simNodes.forEach(n => {
      const lv = level.get(n.id) || 0;
      const r = LAYER_RADIUS[lv] || 88;
      const sameLayer = simNodes.filter(m => level.get(m.id) === lv);
      const idx = sameLayer.indexOf(n);
      const angle = (idx / sameLayer.length) * Math.PI * 2;
      n.x = Math.cos(angle) * r + (Math.random() - 0.5) * 2;
      n.y = Math.sin(angle) * r + (Math.random() - 0.5) * 2;
    });

    const sim = forceSimulation(simNodes)
      .velocityDecay(0.4)
      .alphaDecay(0.05)
      .force('charge', forceManyBody().strength(d => -400 - (d.heat || 50) / 100 * 400))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide(collideRadius))
      .force('link', forceLink(simLinks)
        .id(d => d.id)
        .distance(d => weightToDistance(d.weight || 50, linkDistance))
        .strength(d => weightToStrength(d.weight || 50))
      )
      // 径向约束：把每层节点拉到对应半径的圆环上
      .force('radial', forceRadial(
        d => LAYER_RADIUS[level.get(d.id)] || 88,
        0, 0
      ).strength(0.5))
      .on('tick', () => {
        simNodes.forEach(n => {
          const lv = level.get(n.id) || 0;
          const layerZ = LAYER_Z[lv] || 0;
          const heatZ = ((n.heat || 50) / 100) * depth - depth / 2;
          positionsRef.current.set(n.id, {
            x: n.x,
            y: n.y,
            z: layerZ + heatZ * 0.3,
          });
        });
      })
      .on('end', () => {
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
