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

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: "#2563eb",
        color: "white",
        padding: "0.75rem 1.5rem",
        borderRadius: "0.375rem",
        border: "none",
        fontSize: "1rem",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        boxShadow: "0 2px 4px rgba(37, 99, 235, 0.1)",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: "0.5rem" }}
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
      폴더 선택
    </button>
  );
};

export default FolderSelector;
