const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");

// 절대 경로를 사용하여 컴파일된 모듈을 불러옵니다.
const readFolderPath = path.join(__dirname, "dist", "utils", "readFolder.js");
const { readFolderRecursive } = require(readFolderPath);

const parseProjectPath = path.join(
  __dirname,
  "dist",
  "utils",
  "parseProject.js"
);
const { parseProject } = require(parseProjectPath);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Node.js와 React를 모두 사용하기 위해 활성화
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false, // Preload를 사용하므로 false로 설정합니다.
    },
  });

  // Webpack 번들링 후 생성된 index.html 로드
  win.loadURL(`file://${path.join(__dirname, "dist/index.html")}`);

  // 개발자 도구 열기 (개발 중에만 사용)
  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // macOS에서 모든 창이 닫혔을 때 다시 창을 생성
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// IPC 핸들러 추가
ipcMain.handle("dialog:openFolder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return !result.canceled && result.filePaths.length > 0
    ? result.filePaths[0]
    : null;
});

// 새로 추가: 폴더 내 파일 목록 읽기 IPC
ipcMain.handle("fs:readFolder", async (event, folderPath) => {
  return readFolderRecursive(folderPath);
});

// 새로 추가: 파일 목록을 기반으로 컴포넌트 트리 파싱 IPC
ipcMain.handle("parse:project", async (event, filePaths) => {
  return parseProject(filePaths);
});

app.on("window-all-closed", () => {
  // macOS 제외한 다른 OS에서는 모든 창이 닫히면 앱 종료
  if (process.platform !== "darwin") app.quit();
});
