import type { ScanFile } from "./types";

type WritableDirectory = FileSystemDirectoryHandle & {
  requestPermission(options: { mode: "readwrite" }): Promise<PermissionState>;
};

export async function deleteSelectedFiles(root: FileSystemDirectoryHandle, selectedFiles: ScanFile[]) {
  const permission = await (root as WritableDirectory).requestPermission({ mode: "readwrite" });
  if (permission !== "granted") throw new Error("Izin tulis tidak diberikan. Tidak ada file yang dihapus.");
  const deleted = new Set<string>();
  const failures: string[] = [];
  let bytes = 0;
  for (const file of selectedFiles) {
    try {
      if (!file.parentDirectory) throw new Error("Handle folder tidak tersedia");
      const current = await file.parentDirectory.getFileHandle(file.name);
      const metadata = await current.getFile();
      if (metadata.size !== file.size || metadata.lastModified !== file.lastModified) {
        throw new Error("File berubah sejak pemindaian");
      }
      await file.parentDirectory.removeEntry(file.name);
      deleted.add(file.id);
      bytes += file.size;
    } catch {
      failures.push(file.path);
    }
  }
  return { deleted, failures, bytes };
}
