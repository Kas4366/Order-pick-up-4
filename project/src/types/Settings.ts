export interface Settings {
  folderPath: string;
  availableFiles: string[];
}

export interface FileWithImages {
  name: string;
  path: string;
  imagesFolderPath: string;
  fileHandle?: File;
  directoryHandle?: FileSystemDirectoryHandle;
  imagesFolderHandle?: FileSystemDirectoryHandle;
}