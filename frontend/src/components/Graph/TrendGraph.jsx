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
        nodesep: 50,
        ranksep: 100,
      },
      node: {
        type: 'circle',
        style: {
          size: (d) => influenceSize(d.data?.influence_score || 50),
          fill: (d) => scarcityColor(d.data?.scarcity_score || 50),
          fillOpacity: 0.85,
          stroke: (d) => {
            // 用类型色做描边
            const typeInfo = NODE_TYPES[d.data?.type || 1];
            return typeInfo?.color || '#2a3a52';
          },
          lineWidth: 3,
          shadowColor: 'rgba(0,0,0,0.5)',
          shadowBlur: 8,
          cursor: 'pointer',
          labelText: (d) => d.data?.label || '',
          labelFontSize: 13,
          labelFontWeight: 600,
          labelFill: '#e2e8f0',
          labelStroke: '#0a0e1a',
          labelLineWidth: 3,
          labelPosition: 'bottom',
          labelOffsetY: 8,
          labelLineHeight: 16,
        },
      },
      edge: {
        type: 'quadratic',
        style: {
          stroke: (d) => d.data?.color || '#666',
          strokeOpacity: 0.7,
          lineWidth: (d) => weightLineWidth(d.data?.weight || 50),
          endArrow: true,
          endArrowType: 'triangle',
          endArrowSize: 8,
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

  // 数据更新
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
  }, [nodes, edges]);

  return (
    <div
      id="trend-graph-container"
      ref={containerRef}
      className="w-full h-full"
      style={{ background: 'radial-gradient(ellipse at center, #111827 0%, #0a0e1a 100%)' }}
    />
  );
}
