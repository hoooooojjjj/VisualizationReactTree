import React from "react";

interface FolderSelectorProps {
  onFolderSelected: (folderPath: string) => void;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  onFolderSelected,
}) => {
  const handleClick = async () => {
    const folderPath = await window.electronAPI.openFolder();
    if (folderPath) {
      onFolderSelected(folderPath);
    }
  };

  return <button onClick={handleClick}>폴더 선택</button>;
};

export default FolderSelector;
