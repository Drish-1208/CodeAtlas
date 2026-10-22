import { useMemo } from 'react';
import { ReactFlow, Background, Controls } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

interface DependencyGraphProps {
  data: Record<string, string[]>;
}

// 1. Initialize the Dagre graph engine
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// 2. A utility function that calculates exactly where every node should go
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  // TB = Top to Bottom layout
  dagreGraph.setGraph({ rankdir: direction });

  // Tell Dagre how big our boxes are so it can space them correctly
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run the complex layout math
  dagre.layout(dagreGraph);

  // Apply the calculated X/Y coordinates back to our React Flow nodes
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = 'top' as any;
    node.sourcePosition = 'bottom' as any;
    
    // Dagre uses the center of the node, React Flow uses the top-left, so we offset it
    node.position = {
      x: nodeWithPosition.x - 250 / 2,
      y: nodeWithPosition.y - 50 / 2,
    };
    return node;
  });

  return { nodes, edges };
};

export default function DependencyGraph({ data }: DependencyGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];
    const uniqueNodes = new Set<string>();

    Object.entries(data).forEach(([source, imports]) => {
      uniqueNodes.add(source);
      imports.forEach(target => uniqueNodes.add(target));
    });

   Array.from(uniqueNodes).forEach((nodeId) => {
      // A simple check: if the name has slashes or dots, it's likely an internal file. 
      // If it's just a single word (like 'express' or 'react'), it's an external package.
      const isExternal = !nodeId.includes('/') && !nodeId.includes('\\') && !nodeId.startsWith('.');

      generatedNodes.push({
        id: nodeId,
        position: { x: 0, y: 0 },
        data: { label: nodeId },
        style: { 
          background: '#1e1e1e', 
          // Green text for internal files, gray text for external packages
          color: isExternal ? '#a1a1aa' : '#4ade80', 
          // Blue border for internal files, dark gray for external
          border: isExternal ? '1px solid #3f3f46' : '1px solid #3b82f6',
          borderRadius: '6px',
          padding: '10px',
          fontSize: '12px',
          fontFamily: 'monospace',
          width: 250
        }
      });
    });

    Object.entries(data).forEach(([source, imports]) => {
      imports.forEach(target => {
        generatedEdges.push({
          id: `edge-${source}-${target}`,
          source: source,
          target: target,
          animated: true,
          style: { stroke: '#555', strokeWidth: 2 }
        });
      });
    });

    // 3. Pass our raw nodes and edges into the Dagre engine before returning them
    return getLayoutedElements(generatedNodes, generatedEdges);
  }, [data]);

  return (
    <div style={{ width: '100%', height: '70vh', minHeight: '500px', border: '1px solid #333', borderRadius: '8px', marginTop: '20px' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background color="#333" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}