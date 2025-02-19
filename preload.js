const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openFolder: () => ipcRenderer.invoke("dialog:openFolder"),
  readFolder: (folderPath) => ipcRenderer.invoke("fs:readFolder", folderPath),
  parseProject: (filePaths) => ipcRenderer.invoke("parse:project", filePaths),
});
