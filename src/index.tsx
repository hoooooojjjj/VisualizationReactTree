import React from "react";
import ReactDOM from "react-dom/client";
import FolderSelector from "./components/FolderSelector";
import ComponentFlow from "./components/ComponentFlow";
import { ParsedComponent } from "./utils/parseProject";

const App: React.FC = () => {
  const [projectTree, setProjectTree] = React.useState<
    ParsedComponent[] | null
  >(null);

  const handleFolderSelected = async (folderPath: string) => {
    console.log("선택된 폴더 경로:", folderPath);
    // IPC를 통해 폴더 내 파일 목록을 가져옵니다.
    const files: string[] = await window.electronAPI.readFolder(folderPath);
    console.log("업로드된 파일 목록:", files);
    // 파일 목록을 기반으로 컴포넌트 트리 파싱 (메인 프로세스에서 실행)
    const tree: ParsedComponent[] = await window.electronAPI.parseProject(
      files
    );
    console.log("파싱된 컴포넌트 트리:", tree);
    setProjectTree(tree);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>컴포넌트 트리 파싱 및 인터랙티브 시각화</h1>
      <FolderSelector onFolderSelected={handleFolderSelected} />
      {projectTree && <ComponentFlow tree={projectTree} />}
    </div>
  );
};

const container = document.getElementById("root");
if (!container) throw new Error("루트 요소가 존재하지 않습니다.");
const root = ReactDOM.createRoot(container);

root.render(<App />);
