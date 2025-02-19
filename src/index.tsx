import React from "react";
import ReactDOM from "react-dom/client";
import FolderSelector from "./components/FolderSelector";
import FolderTreeView from "./components/FolderTreeView";
import ComponentFlow from "./components/ComponentFlow";
import { ParsedComponent } from "./utils/parseProject";

const App: React.FC = () => {
  // 전체 파싱된 트리와 선택된 노드를 상태로 관리합니다.
  const [projectTree, setProjectTree] = React.useState<ParsedComponent[]>([]);
  const [selectedNode, setSelectedNode] =
    React.useState<ParsedComponent | null>(null);

  // 폴더 선택 후 IPC를 통해 파일 목록 읽기와 파싱을 진행합니다.
  const handleFolderSelected = async (folderPath: string) => {
    console.log("선택된 폴더 경로:", folderPath);
    // IPC를 통해 폴더 내 파일 목록을 가져옵니다.
    const files: string[] = await window.electronAPI.readFolder(folderPath);
    console.log("업로드된 파일 목록:", files);
    // 파일 목록을 기반으로 컴포넌트 트리를 파싱합니다.
    const tree: ParsedComponent[] = await window.electronAPI.parseProject(
      files
    );
    console.log("파싱된 컴포넌트 트리:", tree);
    setProjectTree(tree);
    setSelectedNode(null);
  };

  // 폴더 트리(네비게이션)에서 노드를 클릭하면 해당 노드를 선택합니다.
  const handleNodeSelect = (node: ParsedComponent) => {
    // 선택된 노드와 그 하위 노드들을 포함하는 서브트리를 생성
    const selectedSubtree: ParsedComponent = {
      ...node,
      children: node.children || [],
    };
    setSelectedNode(selectedSubtree);
  };

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "'Segoe UI', 'Roboto', sans-serif",
        color: "#333",
      }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          marginBottom: "2rem",
          color: "#2563eb",
          borderBottom: "2px solid #e5e7eb",
          paddingBottom: "1rem",
        }}
      >
        Visualization React Tree
      </h1>

      <div
        style={{
          background: "#f8fafc",
          padding: "2rem",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "2rem",
        }}
      >
        <FolderSelector onFolderSelected={handleFolderSelected} />
      </div>

      {projectTree.length > 0 && (
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "2rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              marginBottom: "1rem",
              color: "#4b5563",
            }}
          >
            폴더 트리
          </h3>
          <FolderTreeView tree={projectTree} onSelect={handleNodeSelect} />
        </div>
      )}

      <h2
        style={{
          fontSize: "2rem",
          marginBottom: "1.5rem",
          color: "#1f2937",
        }}
      >
        {selectedNode
          ? `${selectedNode.name} 컴포넌트 트리`
          : "전체 컴포넌트 트리"}
      </h2>

      {projectTree.length > 0 && (
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <ComponentFlow
            tree={selectedNode ? [selectedNode] : projectTree}
            verticalLayout
          />
        </div>
      )}
    </div>
  );
};

const container = document.getElementById("root");
if (!container) throw new Error("루트 요소가 존재하지 않습니다.");
const root = ReactDOM.createRoot(container);
root.render(<App />);
