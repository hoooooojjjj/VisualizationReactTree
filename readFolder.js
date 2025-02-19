const fs = require("fs");
const path = require("path");

const readFolderRecursive = (folderPath) => {
  let results = [];
  try {
    const entries = fs.readdirSync(folderPath);
    for (const entry of entries) {
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

module.exports = { readFolderRecursive };
