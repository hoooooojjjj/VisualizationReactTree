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
  verticalLayout?: boolean;
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

const generateVerticalFlowElements = (
  components: ParsedComponent[]
): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let currentX = 0;
  const horizontalSpacing = 150;
  const verticalSpacing = 150;
  const positions: Record<string, { x: number; y: number }> = {};
  const nodeMap: Record<string, ParsedComponent> = {};

  // 첫번째 순회: 사이클 방지를 위한 visitedNodes를 사용하여 모든 노드를 수집합니다.
  const visitedNodes = new Set<string>();
  const collectNodes = (node: ParsedComponent) => {
    if (visitedNodes.has(node.id)) return;
    visitedNodes.add(node.id);
    nodeMap[node.id] = node;
    node.children.forEach((child) => collectNodes(child));
  };
  components.forEach((root) => {
    collectNodes(root);
  });

  const visitedForLayout = new Set<string>();
  function layoutNode(node: ParsedComponent, depth: number): number {
    if (visitedForLayout.has(node.id)) {
      return positions[node.id]?.x || currentX * horizontalSpacing;
    }
    visitedForLayout.add(node.id);
    if (!node.children || node.children.length === 0) {
      const x = currentX * horizontalSpacing;
      currentX++;
      positions[node.id] = { x, y: depth * verticalSpacing };
      return x;
    } else {
      const childXs = node.children.map((child) =>
        layoutNode(child, depth + 1)
      );
      const x = (Math.min(...childXs) + Math.max(...childXs)) / 2;
      positions[node.id] = { x, y: depth * verticalSpacing };
      return x;
    }
  }
  components.forEach((root) => {
    layoutNode(root, 0);
  });

  Object.entries(positions).forEach(([id, pos]) => {
    nodes.push({
      id,
      position: pos,
      data: { label: nodeMap[id].name },
    });
  });

  // 엣지 생성시에도 사이클을 방지하기 위해 visitedNodes 집합을 활용합니다.
  const visitedEdges = new Set<string>();
  const traverseEdges = (node: ParsedComponent, visited: Set<string>) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    node.children.forEach((child) => {
      const edgeId = `${node.id}-${child.id}`;
      if (!visitedEdges.has(edgeId)) {
        visitedEdges.add(edgeId);
        edges.push({
          id: edgeId,
          source: node.id,
          target: child.id,
        });
      }
      traverseEdges(child, visited);
    });
  };
  components.forEach((root) => traverseEdges(root, new Set()));

  return { nodes, edges };
};

const generateHorizontalFlowElements = (
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
      edges.push({
        id: `${comp.id}-${child.id}-${childIdx}`,
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

const ComponentFlow: React.FC<ComponentFlowProps> = ({
  tree,
  verticalLayout = false,
}) => {
  const { nodes, edges } = useMemo(() => {
    return verticalLayout
      ? generateVerticalFlowElements(tree)
      : generateHorizontalFlowElements(tree);
  }, [tree, verticalLayout]);

  return (
    <div
      style={{ height: "600px", border: "1px solid #ddd", marginTop: "20px" }}
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          minZoom={0.05}
          maxZoom={10}
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default ComponentFlow;
