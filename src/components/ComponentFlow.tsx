import React, { useMemo, useState, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node as RFNode,
  Edge as RFEdge,
  applyNodeChanges,
  NodeChange,
} from "react-flow-renderer";
import { ParsedComponent } from "../utils/parseProject";

/*
  이 컴포넌트는 ParsedComponent 배열(full tree)을 받아, filePath에서 '/src' 접두어를 제거한 후
  계층 트리(ParsedRoute)를 구성합니다.
  prop으로 activeNode가 전달되면, 해당 노드(filePath가 일치하는)의 서브트리만 표시합니다.
  onBack 콜백이 제공되면 Back 버튼을 표시하여 전체 트리(또는 상위 노드)로 복귀하도록 합니다.
*/

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

// 재귀적으로 ParsedComponent를 ParsedRoute로 변환 (사이클 방지 포함)
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

// 평면화: 중첩된 모든 ParsedRoute를 하나의 배열로 모읍니다.
const flattenRoutes = (routes: ParsedRoute[]): ParsedRoute[] => {
  return routes.reduce((acc, route) => {
    acc.push(route);
    if (route.children && route.children.length > 0) {
      acc.push(...flattenRoutes(route.children));
    }
    return acc;
  }, [] as ParsedRoute[]);
};

// 평면 배열을 "/" 기준 경로 트리로 구성합니다.
const buildRouteTree = (flatRoutes: ParsedRoute[]): ParsedRoute[] => {
  const root: ParsedRoute = {
    id: "/",
    path: "/",
    children: [],
    original: {} as ParsedComponent,
  };
  flatRoutes.forEach((route) => {
    if (route.path === "/") return;
    // 예: "/components/Button.tsx" → [ "components", "Button.tsx" ]
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

// ReactFlow에서 사용할 Node와 Edge 타입
interface FlowNode extends RFNode {
  data: { label: string };
  position: { x: number; y: number };
}

interface FlowEdge extends RFEdge {}

// vertical layout: 깊이에 따라 y좌표, DFS 순회 기준으로 x좌표를 배치합니다.
const generateVerticalFlowElementsFromTree = (
  nodesTree: ParsedRoute[]
): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let yCounter = 0;
  const xSpacing = 200;
  const ySpacing = 100;

  const traverse = (node: ParsedRoute, depth: number) => {
    nodes.push({
      id: node.id,
      data: {
        label: node.id === "/" ? "/" : node.id.split("/").pop() || node.path,
      },
      position: { x: depth * xSpacing, y: yCounter * ySpacing },
    });
    yCounter++;
    node.children.forEach((child) => {
      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
      });
      traverse(child, depth + 1);
    });
  };

  nodesTree.forEach((root) => traverse(root, 0));
  return { nodes, edges };
};

// horizontal layout: x좌표, y좌표 배치를 다르게 처리합니다.
const generateHorizontalFlowElementsFromTree = (
  nodesTree: ParsedRoute[]
): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let xCounter = 0;
  const xSpacing = 200;
  const ySpacing = 150;

  const traverse = (node: ParsedRoute, depth: number) => {
    nodes.push({
      id: node.id,
      data: {
        label: node.id === "/" ? "/" : node.id.split("/").pop() || node.path,
      },
      position: { x: xCounter * xSpacing, y: depth * ySpacing },
    });
    xCounter++;
    node.children.forEach((child) => {
      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
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
  tree: ParsedComponent[]; // 전체 ParsedComponent 배열
  activeNode?: ParsedComponent | null; // 선택한 노드 (없으면 전체 트리 표시)
  onBack?: () => void; // Back 버튼 클릭 시 호출
  verticalLayout?: boolean;
}

const ComponentFlow: React.FC<ComponentFlowProps> = ({
  tree,
  activeNode,
  onBack,
  verticalLayout = false,
}) => {
  // ParsedComponent 배열을 ParsedRoute 배열로 변환
  const convertedRoutes = useMemo(() => tree.map(convertToRoute), [tree]);
  const flatRoutes = useMemo(
    () => flattenRoutes(convertedRoutes),
    [convertedRoutes]
  );
  const hierarchicalTree = useMemo(
    () => buildRouteTree(flatRoutes),
    [flatRoutes]
  );

  // 계층 트리(전체 트리)는 항상 [root] 배열로 반환됨
  const fullHierarchy = hierarchicalTree[0];

  // activeNode가 있을 경우, hierarchicalTree 내에서 해당 노드를 찾고 그 서브트리를 루트로 반환합니다.
  const displayedTree: ParsedRoute[] = useMemo(() => {
    if (activeNode) {
      // activeNode의 filePath를 기반으로 한 id (trimSrcPrefix 적용)
      const targetId = trimSrcPrefix(activeNode.filePath);
      const target = findRouteById(fullHierarchy, targetId);
      return target ? [target] : hierarchicalTree;
    }
    return hierarchicalTree;
  }, [activeNode, hierarchicalTree, fullHierarchy]);

  // 선택된 트리(또는 전체 트리)를 기반으로 Flow의 노드/엣지를 생성
  const { nodes, edges } = useMemo(() => {
    return verticalLayout
      ? generateVerticalFlowElementsFromTree(displayedTree)
      : generateHorizontalFlowElementsFromTree(displayedTree);
  }, [displayedTree, verticalLayout]);

  // ReactFlow의 제어형(nodes controlled) 방식 사용:
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>(nodes);

  // nodesWithPositions가 변경되면 flowNodes도 업데이트합니다.
  useEffect(() => {
    setFlowNodes(nodes);
  }, [nodes]);

  return (
    <div>
      {activeNode && onBack && (
        <button onClick={onBack} style={{ marginBottom: "8px" }}>
          ← 뒤로가기
        </button>
      )}
      <div
        style={{ height: "600px", border: "1px solid #ddd", marginTop: "20px" }}
      >
        <ReactFlowProvider>
          <ReactFlow
            nodes={flowNodes}
            edges={edges}
            onNodesChange={(changes: NodeChange[]) =>
              setFlowNodes((nds) => applyNodeChanges(changes, nds))
            }
            fitView
            minZoom={0.05}
            maxZoom={10}
            zoomOnScroll
            zoomOnPinch
            zoomOnDoubleClick
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            multiSelectionKeyCode="Shift"
            selectionKeyCode="Shift"
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default ComponentFlow;
