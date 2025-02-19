import fs from "fs";
import path from "path";

export const readFolderRecursive = (folderPath: string): string[] => {
  let results: string[] = [];

  // 현재 폴더가 node_modules 또는 dist면 바로 리턴
  const segments = folderPath.split(path.sep);
  if (segments.includes("node_modules") || segments.includes("dist")) {
    return results;
  }

  try {
    const entries = fs.readdirSync(folderPath);
    for (const entry of entries) {
      // 폴더명이 node_modules 또는 dist이면 스킵
      if (entry === "node_modules" || entry === "dist") continue;

      const fullPath = path.join(folderPath, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        results = results.concat(readFolderRecursive(fullPath));
      } else {
        results.push(fullPath);
      }
    }
  } catch (error) {
    console.error("폴더 읽기 실패:", error);
  }
  return results;
};
