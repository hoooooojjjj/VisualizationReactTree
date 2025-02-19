import React from "react";
import ReactDOM from "react-dom/client";
import FolderSelector from "./components/FolderSelector";

const App: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = React.useState<string[]>([]);

  const handleFolderSelected = async (folderPath: string) => {
    console.log("선택된 폴더 경로:", folderPath);
    // IPC를 통해 폴더 내 파일 목록을 읽어옵니다.
    const files: string[] = await window.electronAPI.readFolder(folderPath);
    console.log("업로드된 파일 목록:", files);
    setUploadedFiles(files);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>폴더 선택 및 업로드 기능 데모</h1>
      <FolderSelector onFolderSelected={handleFolderSelected} />
      {uploadedFiles.length > 0 && (
        <div>
          <h2>업로드된 파일 목록:</h2>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index}>{file}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById("root");
if (!container) throw new Error("루트 요소가 존재하지 않습니다.");
const root = ReactDOM.createRoot(container);

root.render(<App />);
