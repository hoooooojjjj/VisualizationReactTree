const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openFolder: () => ipcRenderer.invoke("dialog:openFolder"),
  readFolder: (folderPath) => ipcRenderer.invoke("fs:readFolder", folderPath),
});
