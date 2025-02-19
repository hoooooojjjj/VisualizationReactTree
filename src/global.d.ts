export {};

declare global {
  interface Window {
    electronAPI: {
      openFolder: () => Promise<string | null>;
      readFolder: (folderPath: string) => Promise<string[]>;
    };
  }
}
