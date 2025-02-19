import React, { useMemo } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
} from "react-flow-renderer";
import { ParsedComponent } from "../utils/parseProject";

interface ComponentFlowProps {
  tree: ParsedComponent[];
}

interface FlowNode {
  id: string;
  data: { label: string };
  position: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

const generateFlowElements = (
  components: ParsedComponent[]
): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const visited = new Set<string>();

  let yOffset = 0;

  const traverse = (comp: ParsedComponent, depth: number, posY: number) => {
    if (visited.has(comp.id)) return;
    visited.add(comp.id);

    nodes.push({
      id: comp.id,
      data: { label: comp.name },
      position: { x: depth * 200, y: posY },
    });
    let childPosY = posY + 100;
    comp.children.forEach((child, childIdx) => {
      const edgeId = `${comp.id}-${child.id}-${childIdx}`;
      edges.push({
        id: edgeId,
        source: comp.id,
        target: child.id,
      });
      traverse(child, depth + 1, childPosY);
      childPosY += 100;
    });
  };

  components.forEach((comp) => {
    traverse(comp, 0, yOffset);
    yOffset += 200;
  });

  return { nodes, edges };
};

const ComponentFlow: React.FC<ComponentFlowProps> = ({ tree }) => {
  const { nodes, edges } = useMemo(() => generateFlowElements(tree), [tree]);

  return (
    <div
      style={{ height: "600px", border: "1px solid #ddd", marginTop: "20px" }}
    >
      <ReactFlowProvider>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default ComponentFlow;
