import React, { useState, useMemo } from "react";
import { ParsedComponent } from "../utils/parseProject";

/*
  이 컴포넌트는 ParsedComponent 타입({ id, name, filePath, children })의 데이터를 받아,
  filePath에서 '/src' 접두어를 제거한 후 경로 기반 트리로 변환하여 네비게이션 폴더 트리로 렌더링합니다.
  
  [개선사항]
  1. 뒤로가기 버튼 없이 접기/펼침 아이콘으로만 하위 노드의 표시 여부를 제어합니다.
  2. 노드를 클릭하면 해당 노드(자체 포함)와 하위 노드가 올바르게 onSelect를 통해 전달됩니다.
*/

// 파일 경로에서 '/src' 이후의 부분만 취합니다.
const trimSrcPrefix = (filePath: string): string => {
  const srcIndex = filePath.indexOf("/src");
  if (srcIndex >= 0) {
    const trimmed = filePath.substring(srcIndex + 4);
    return trimmed === "" ? "/" : trimmed;
  }
  return filePath;
};

// 내부에서 사용할 ParsedRoute 타입
export interface ParsedRoute {
  id: string; // 변환된 filePath (예: "/components/Button.tsx")
  path: string;
  children: ParsedRoute[];
  original: ParsedComponent; // 원본 ParsedComponent (onSelect 시 전달)
}

// 사이클 방지를 위해 ancestors를 추적하면서 재귀적으로 변환
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

const convertToRoute = (component: ParsedComponent): ParsedRoute => {
  return convertToRouteHelper(component, new Set());
};

// Nested ParsedRoute들을 평탄화하여 모든 노드를 배열에 담습니다.
const flattenRoutes = (routes: ParsedRoute[]): ParsedRoute[] => {
  return routes.reduce((acc, route) => {
    acc.push(route);
    if (route.children && route.children.length > 0) {
      acc.push(...flattenRoutes(route.children));
    }
    return acc;
  }, [] as ParsedRoute[]);
};

// 평면(Flat) ParsedRoute 배열을 "/" 기준 경로 트리로 구성합니다.
const buildRouteTree = (flatRoutes: ParsedRoute[]): ParsedRoute[] => {
  // 전체 트리의 루트 노드는 "/"로 생성합니다.
  const root: ParsedRoute = {
    id: "/",
    path: "/",
    children: [],
    original: {} as ParsedComponent,
  };
  flatRoutes.forEach((route) => {
    if (route.path === "/") return;
    // 예: "/components/Button.tsx" → ["components", "Button.tsx"]
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

interface FolderTreeViewProps {
  tree: ParsedComponent[]; // 부모에서 ParsedComponent 배열 전달
  onSelect: (node: ParsedComponent) => void;
}

const FolderTreeView: React.FC<FolderTreeViewProps> = ({ tree, onSelect }) => {
  // ParsedComponent 배열을 ParsedRoute로 변환 후 평탄화
  const convertedRoutes = useMemo(() => tree.map(convertToRoute), [tree]);
  const flatRoutes = useMemo(
    () => flattenRoutes(convertedRoutes),
    [convertedRoutes]
  );
  const hierarchicalTree = useMemo(
    () => buildRouteTree(flatRoutes),
    [flatRoutes]
  );

  // 전체 트리의 루트 (buildRouteTree에서 생성한 루트는 항상 [root] 배열로 반환됨)
  const fullRoot = hierarchicalTree[0];

  // 접힘/펼침 상태: 어떤 노드들이 확장되어 있는지를 추적합니다.
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // 노드 클릭 시 onSelect 호출 (접힘/펼침 상태는 아이콘 클릭으로 제어)
  const handleNodeClick = (node: ParsedRoute) => {
    onSelect(node.original);
  };

  // 재귀적으로 트리 렌더링 (접힘/펼침 아이콘 포함)
  const renderTree = (nodes: ParsedRoute[]) => (
    <ul style={{ listStyleType: "none", paddingLeft: "20px", margin: 0 }}>
      {nodes.map((node, index) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        return (
          <li key={`${node.id}-${index}`}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {hasChildren && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedNodes((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has(node.id)) newSet.delete(node.id);
                      else newSet.add(node.id);
                      return newSet;
                    });
                  }}
                  style={{
                    cursor: "pointer",
                    width: "16px",
                    userSelect: "none",
                  }}
                >
                  {isExpanded ? "▼" : "▶"}
                </div>
              )}
              <div
                onClick={() => handleNodeClick(node)}
                style={{
                  marginLeft: hasChildren ? "4px" : "20px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                {node.id === "/" ? "/" : node.id.split("/").pop()}
              </div>
            </div>
            {hasChildren && isExpanded && renderTree(node.children)}
          </li>
        );
      })}
    </ul>
  );

  // 전체 트리에서 fullRoot의 children을 렌더링합니다.
  const treeToRender = fullRoot ? fullRoot.children : [];

  return (
    <div>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "8px",
          margin: "8px 0",
          width: "300px",
          height: "400px",
          overflow: "auto",
        }}
      >
        {renderTree(treeToRender)}
      </div>
    </div>
  );
};

export default FolderTreeView;
