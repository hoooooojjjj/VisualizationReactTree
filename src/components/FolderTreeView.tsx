import React, { useState } from "react";
import { ParsedComponent } from "../utils/parseProject";

interface FolderTreeViewProps {
  tree: ParsedComponent[];
  onSelect: (node: ParsedComponent) => void;
}

const FolderTreeView: React.FC<FolderTreeViewProps> = ({ tree, onSelect }) => {
  // 확장된 노드의 id를 저장합니다.
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // 재귀 렌더링 시 사이클을 방지하기 위한 visited 매개변수를 사용합니다.
  const renderTree = (
    nodes: ParsedComponent[],
    visited: Set<string> = new Set()
  ) => (
    <ul style={{ listStyleType: "none", paddingLeft: "20px", margin: 0 }}>
      {nodes.map((node, index) => {
        if (visited.has(node.id)) return null;
        const newVisited = new Set(visited);
        newVisited.add(node.id);

        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);

        return (
          <li key={`${node.id}-${index}`}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {hasChildren && (
                <div
                  onClick={() => toggleNode(node.id)}
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
                onClick={() => onSelect(node)}
                style={{
                  marginLeft: hasChildren ? "4px" : "20px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                {node.name}
              </div>
            </div>
            {hasChildren && isExpanded && renderTree(node.children, newVisited)}
          </li>
        );
      })}
    </ul>
  );

  return (
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
      {renderTree(tree)}
    </div>
  );
};

export default FolderTreeView;
