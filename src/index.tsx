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

  // 폴더 트리 네비게이션에서 노드를 클릭하면 해당 노드를 선택합니다.
  const handleNodeSelect = (node: ParsedComponent) => {
    setSelectedNode(node);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>컴포넌트 트리 파싱 및 인터랙티브 시각화</h1>
      <FolderSelector onFolderSelected={handleFolderSelected} />
      {/* 파싱된 트리가 있다면 상단에 폴더 트리 네비게이션 표시 */}
      {projectTree.length > 0 && (
        <div>
          <h3>폴더 트리 (네비게이션)</h3>
          <FolderTreeView tree={projectTree} onSelect={handleNodeSelect} />
        </div>
      )}
      <h2>
        {selectedNode ? `${selectedNode.name}의 하위 컴포넌트` : "전체 트리"}
      </h2>
      {/* 전체 트리 또는 선택된 노드의 하위 트리만 ComponentFlow로 렌더링 */}
      {projectTree.length > 0 && (
        <ComponentFlow
          tree={selectedNode ? [selectedNode] : projectTree}
          verticalLayout
        />
      )}
    </div>
  );
};

const container = document.getElementById("root");
if (!container) throw new Error("루트 요소가 존재하지 않습니다.");
const root = ReactDOM.createRoot(container);
root.render(<App />);
