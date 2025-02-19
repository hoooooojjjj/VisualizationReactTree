export {};

declare global {
  interface Window {
    electronAPI: {
      openFolder: () => Promise<string | null>;
      readFolder: (folderPath: string) => Promise<string[]>;
      parseProject: (
        filePaths: string[]
      ) => Promise<import("./utils/parseProject").ParsedComponent[]>;
    };
  }
}
