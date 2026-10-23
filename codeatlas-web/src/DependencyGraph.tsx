import { useMemo } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

interface DependencyGraphProps {
  data: Record<string, string[]>;
  onNodeClick?: (nodeId: string) => void;
}

// 1. Build a Premium Custom Node
const CustomNode = ({ data }: { data: any }) => {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #1e1e1e 0%, #171717 100%)',
      border: data.isExternal ? '1px solid #3f3f46' : '1px solid #3b82f6',
      boxShadow: data.isExternal ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.2)',
      borderRadius: '10px',
      padding: '24px 20px',
      minWidth: '360px',
      color: data.isExternal ? '#a1a1aa' : '#60a5fa',
      fontFamily: '"Fira Code", monospace',
      fontSize: '18px', // Increased from 13px
      fontWeight: 700,  // Made bolder
      textAlign: 'center',
      letterSpacing: '0.5px'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555', border: 'none', width: '10px', height: '10px' }} />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
          {data.isExternal ? 'NPM Package' : 'Source File'}
        </span>
        <span style={{ wordBreak: 'break-all' }}>{data.label}</span>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#555', border: 'none', width: '10px', height: '10px' }} />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// 2. Expand the layout spacing drastically
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction, ranksep: 140, nodesep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 380, height: 130 }); // Updated dimensions
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;
    
    node.position = {
      x: nodeWithPosition.x - 380 / 2,
      y: nodeWithPosition.y - 130 / 2,
    };
    return node;
  });

  return { nodes, edges };
};

export default function DependencyGraph({ data, onNodeClick }: DependencyGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];
    const uniqueNodes = new Set<string>();

    Object.entries(data).forEach(([source, imports]) => {
      uniqueNodes.add(source);
      imports.forEach(target => uniqueNodes.add(target));
    });

    Array.from(uniqueNodes).forEach((nodeId) => {
      const isExternal = !nodeId.includes('/') && !nodeId.includes('\\') && !nodeId.startsWith('.');

      generatedNodes.push({
        id: nodeId,
        type: 'custom', 
        position: { x: 0, y: 0 },
        data: { label: nodeId, isExternal }
      });
    });

    Object.entries(data).forEach(([source, imports]) => {
      imports.forEach(target => {
        generatedEdges.push({
          id: `edge-${source}-${target}`,
          source: source,
          target: target,
          type: 'smoothstep', // Gives the edges clean 90-degree curves
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2, opacity: 0.7 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' } 
        });
      });
    });

    return getLayoutedElements(generatedNodes, generatedEdges);
  }, [data]);

  return (
    // Replaced the 85vh height and heavy borders with a simple 100% fill
    <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick ? (_, node) => onNodeClick(node.id) : undefined}
        fitView 
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background color="#0d1117" gap={24} size={2} />
        <Controls style={{ backgroundColor: '#161b22', fill: '#c9d1d9', border: '1px solid #30363d' }} />
      </ReactFlow>
    </div>
  );
}
