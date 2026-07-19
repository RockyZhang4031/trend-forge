import { useEffect, useRef } from 'react';
import { Graph as G6Graph } from '@antv/g6';
import { NODE_TYPES, EDGE_TYPES, scarcityColor, influenceSize, weightLineWidth } from '../../types/constants';

export default function TrendGraph({ nodes, edges, onSelectNode }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    if (graphRef.current) {
      graphRef.current.destroy();
    }

    const graph = new G6Graph({
      container,
      width,
      height,
      layout: {
        type: 'dagre',
        rankdir: 'LR',
        nodesep: 60,
        ranksep: 120,
      },
      node: {
        type: 'circle',
        style: {
          size: (d) => influenceSize(d.data?.influence_score || 50),
          fill: (d) => {
            const typeInfo = NODE_TYPES[d.data?.type || 1];
            return typeInfo?.color || '#00F0FF';
          },
          fillOpacity: 0.15,
          stroke: (d) => {
            const typeInfo = NODE_TYPES[d.data?.type || 1];
            return typeInfo?.color || '#00F0FF';
          },
          lineWidth: 2,
          shadowColor: (d) => {
            const typeInfo = NODE_TYPES[d.data?.type || 1];
            return typeInfo?.glow || 'rgba(0, 240, 255, 0.6)';
          },
          shadowBlur: 20,
          cursor: 'pointer',
          labelText: (d) => d.data?.label || '',
          labelFontSize: 12,
          labelFontWeight: 500,
          labelFill: '#E8ECF1',
          labelStroke: '#05070A',
          labelLineWidth: 4,
          labelPosition: 'bottom',
          labelOffsetY: 8,
          labelLineHeight: 16,
        },
      },
      edge: {
        type: 'quadratic',
        style: {
          stroke: (d) => d.data?.color || '#4A5568',
          strokeOpacity: 0.5,
          lineWidth: (d) => weightLineWidth(d.data?.weight || 50),
          endArrow: true,
          endArrowType: 'triangle',
          endArrowSize: 6,
          shadowColor: (d) => d.data?.color || '#4A5568',
          shadowBlur: 4,
        },
      },
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
    });

    graphRef.current = graph;

    graph.on('node:click', (evt) => {
      const nodeData = evt.target?.id;
      if (nodeData && onSelectNode) {
        const node = nodes.find((n) => n.id === nodeData);
        if (node) onSelectNode(node);
      }
    });

    // 节点 hover 效果
    graph.on('node:mouseenter', (evt) => {
      const id = evt.target?.id;
      if (!id) return;
      try {
        graph.setElementState(id, ['hover']);
      } catch (e) { /* v5 API guard */ }
    });

    graph.on('node:mouseleave', (evt) => {
      const id = evt.target?.id;
      if (!id) return;
      try {
        graph.setElementState(id, []);
      } catch (e) { /* v5 API guard */ }
    });

    // 自适应容器大小
    const handleResize = () => {
      if (graphRef.current && containerRef.current) {
        graphRef.current.setSize(
          containerRef.current.offsetWidth,
          containerRef.current.offsetHeight
        );
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      graph.destroy();
      graphRef.current = null;
    };
  }, []);

  // 数据更新 + 入场动画
  useEffect(() => {
    if (!graphRef.current || !nodes.length) return;

    const g6Nodes = nodes.map((n) => {
      const typeInfo = NODE_TYPES[n.type] || NODE_TYPES[1];
      return {
        id: n.id,
        data: {
          label: `${typeInfo.icon} ${n.name}`,
          scarcity_score: n.scarcity_score,
          influence_score: n.influence_score,
          type: n.type,
        },
      };
    });

    const g6Edges = edges.map((e) => {
      const edgeInfo = EDGE_TYPES[e.type] || EDGE_TYPES[1];
      return {
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        data: {
          color: edgeInfo.color,
          weight: e.weight,
          type: e.type,
        },
      };
    });

    graphRef.current.setData({ nodes: g6Nodes, edges: g6Edges });
    graphRef.current.render();

    // 入场动画：从中心 fit → 展开
    try {
      graphRef.current.fitView(40, { duration: 800 });
    } catch (e) {
      graphRef.current.fitView(40);
    }
  }, [nodes, edges]);

  return (
    <div
      id="trend-graph-container"
      ref={containerRef}
      className="w-full h-full grid-bg"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(10, 14, 23, 0.4) 0%, #05070A 100%)',
      }}
    />
  );
}
