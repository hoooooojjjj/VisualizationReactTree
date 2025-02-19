import React, { useMemo, useState, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Edge as RFEdge,
  applyNodeChanges,
  NodeChange,
} from "react-flow-renderer";
import { ParsedComponent } from "../utils/parseProject";

// '/src' 접두어 제거 (프로젝트 최상위 폴더 아래, src 하위부터 시작)
const trimSrcPrefix = (filePath: string): string => {
  const srcIndex = filePath.indexOf("/src");
  if (srcIndex >= 0) {
    const trimmed = filePath.substring(srcIndex + 4);
    return trimmed === "" ? "/" : trimmed;
  }
  return filePath;
};

export interface ParsedRoute {
  id: string; // 변환된 filePath (예: "/components/Button.tsx")
  path: string;
  children: ParsedRoute[];
  original: ParsedComponent;
}

const convertToRouteHelper = (
  component: ParsedComponent,
  ancestors: Set<string>
): ParsedRoute => {
  const trimmedPath = trimSrcPrefix(component.filePath);
  if (ancestors.has(trimmedPath)) {
    console.warn(`Cycle detected on ${trimmedPath}`);
    return {
      id: trimmedPath,
      path: trimmedPath,
      original: component,
      children: [],
    };
  }
  const newAncestors = new Set(ancestors);
  newAncestors.add(trimmedPath);
  return {
    id: trimmedPath,
    path: trimmedPath,
    original: component,
    children: component.children.map((child) =>
      convertToRouteHelper(child, newAncestors)
    ),
  };
};

const convertToRoute = (component: ParsedComponent): ParsedRoute =>
  convertToRouteHelper(component, new Set());

const flattenRoutes = (routes: ParsedRoute[]): ParsedRoute[] => {
  return routes.reduce((acc, route) => {
    acc.push(route);
    if (route.children && route.children.length > 0) {
      acc.push(...flattenRoutes(route.children));
    }
    return acc;
  }, [] as ParsedRoute[]);
};

const buildRouteTree = (flatRoutes: ParsedRoute[]): ParsedRoute[] => {
  const root: ParsedRoute = {
    id: "/",
    path: "/",
    children: [],
    original: {} as ParsedComponent,
  };
  flatRoutes.forEach((route) => {
    if (route.path === "/") return;
    const parts = route.path.split("/").filter(Boolean);
    let current = root;
    let accumulatedPath = "";
    parts.forEach((part) => {
      accumulatedPath += "/" + part;
      let child = current.children.find(
        (child) => child.id === accumulatedPath
      );
      if (!child) {
        child = {
          id: accumulatedPath,
          path: accumulatedPath,
          children: [],
          original: route.original,
        };
        current.children.push(child);
      }
      current = child;
    });
  });
  return [root];
};

interface FlowNode {
  id: string;
  data: { label: string };
  position: { x: number; y: number };
  style?: React.CSSProperties;
}

interface FlowEdge extends RFEdge {}

const generateHorizontalFlowElementsFromTree = (
  nodesTree: ParsedRoute[]
): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let xCounter = 0;
  const xSpacing = 300;
  const ySpacing = 150;

  const traverse = (node: ParsedRoute, depth: number) => {
    nodes.push({
      id: node.id,
      data: {
        label: node.id === "/" ? "/" : node.id.split("/").pop() || node.path,
      },
      position: { x: xCounter * xSpacing, y: depth * ySpacing },
      style: {
        padding: "6px 12px",
        background: "#ffffff",
        border: "2px solid #1976d2",
        borderRadius: "8px",
        color: "#1976d2",
        fontWeight: "bold",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      },
    });
    xCounter++;
    node.children.forEach((child) => {
      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        animated: true,
        style: { stroke: "#1976d2", strokeWidth: 2 },
      });
      traverse(child, depth + 1);
    });
  };

  nodesTree.forEach((root) => traverse(root, 0));
  return { nodes, edges };
};

const findRouteById = (
  route: ParsedRoute,
  targetId: string
): ParsedRoute | null => {
  if (route.id === targetId) return route;
  for (const child of route.children) {
    const found = findRouteById(child, targetId);
    if (found) return found;
  }
  return null;
};

interface ComponentFlowProps {
  tree: ParsedComponent[];
  activeNode?: ParsedComponent | null;
  onBack?: () => void;
  verticalLayout?: boolean;
}

const styles = {
  container: {
    height: "600px",
    width: "1200px",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    margin: "20px auto",
    backgroundColor: "#f9f9f9",
    boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
    overflow: "hidden" as "hidden",
  },
  backButton: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "16px",
    fontWeight: "bold" as "bold",
  },
  backButtonHover: {
    backgroundColor: "#1565c0",
  },
};

const ComponentFlow: React.FC<ComponentFlowProps> = ({
  tree,
  activeNode,
  onBack,
  verticalLayout = false,
}) => {
  const convertedRoutes = useMemo(() => tree.map(convertToRoute), [tree]);
  const flatRoutes = useMemo(
    () => flattenRoutes(convertedRoutes),
    [convertedRoutes]
  );
  const hierarchicalTree = useMemo(
    () => buildRouteTree(flatRoutes),
    [flatRoutes]
  );

  const fullHierarchy = hierarchicalTree[0];

  const displayedTree: ParsedRoute[] = useMemo(() => {
    if (activeNode) {
      const targetId = trimSrcPrefix(activeNode.filePath);
      const target = findRouteById(fullHierarchy, targetId);
      return target ? [target] : hierarchicalTree;
    }
    return hierarchicalTree;
  }, [activeNode, hierarchicalTree, fullHierarchy]);

  // Flow의 노드와 엣지 생성 (horizontal layout 사용)
  const { nodes: rawNodes, edges } = useMemo(() => {
    return generateHorizontalFlowElementsFromTree(displayedTree);
  }, [displayedTree]);

  // 중앙 정렬: 루트 노드(id === "/")의 x 좌표를 기준으로 오프셋 계산
  const containerWidth = 1200;
  const rootNode = rawNodes.find((node) => node.id === "/");
  const offsetX = rootNode ? containerWidth / 2 - rootNode.position.x : 0;

  // centeredNodes를 계산
  const centeredNodes = useMemo(
    () =>
      rawNodes.map((node) => ({
        ...node,
        position: { ...node.position, x: node.position.x + offsetX },
      })),
    [rawNodes, offsetX]
  );

  const [flowNodes, setFlowNodes] = useState<FlowNode[]>(centeredNodes);

  useEffect(() => {
    setFlowNodes(centeredNodes);
  }, [centeredNodes]);

  return (
    <div>
      {activeNode && onBack && (
        <button
          onClick={onBack}
          style={styles.backButton}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              styles.backButtonHover.backgroundColor)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              styles.backButton.backgroundColor)
          }
        >
          ← 뒤로가기
        </button>
      )}
      <div style={styles.container}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={flowNodes}
            edges={edges}
            onNodesChange={(changes: NodeChange[]) =>
              setFlowNodes((nds) => applyNodeChanges(changes, nds))
            }
            fitView
            minZoom={0.05}
            maxZoom={3}
            zoomOnScroll
            zoomOnPinch
            zoomOnDoubleClick
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            multiSelectionKeyCode="Shift"
            selectionKeyCode="Shift"
          >
            <Background color="#f0f0f0" gap={16} />
            <Controls />
            <MiniMap
              nodeStrokeColor={() => "#1976d2"}
              nodeColor={() => "#fff"}
              nodeBorderRadius={8}
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default ComponentFlow;
