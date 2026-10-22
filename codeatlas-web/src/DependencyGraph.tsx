import { useMemo } from 'react';
import { ReactFlow, Background, Controls } from 'reactflow';
import type { Node, Edge } from 'reactflow';import 'reactflow/dist/style.css';

interface DependencyGraphProps {
  data: Record<string, string[]>;
}

export default function DependencyGraph({ data }: DependencyGraphProps) {
  // useMemo ensures we only recalculate the math when the data actually changes
  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];
    const uniqueNodes = new Set<string>();

    // 1. Identify every unique file and imported package
    Object.entries(data).forEach(([source, imports]) => {
      uniqueNodes.add(source);
      imports.forEach(target => uniqueNodes.add(target));
    });

    // 2. Create the Nodes and arrange them in a basic grid
    Array.from(uniqueNodes).forEach((nodeId, index) => {
      generatedNodes.push({
        id: nodeId,
        // Math for a simple grid: 4 items per row, spaced 250px apart horizontally and 150px vertically
        position: { x: (index % 4) * 250, y: Math.floor(index / 4) * 150 },
        data: { label: nodeId },
        style: { 
          background: '#1e1e1e', 
          color: '#4ade80', 
          border: '1px solid #333',
          borderRadius: '6px',
          padding: '10px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }
      });
    });

    // 3. Create the Edges (connecting lines)
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

    return { nodes: generatedNodes, edges: generatedEdges };
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