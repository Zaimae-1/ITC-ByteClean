import type { ScanFile } from "./types";
import { fullHash } from "./hash";

type WritableDirectory = FileSystemDirectoryHandle & {
  requestPermission(options: { mode: "readwrite" }): Promise<PermissionState>;
};

async function matchesScan(file: ScanFile): Promise<File | null> {
  if (!file.parentDirectory) return null;
  const current = await file.parentDirectory.getFileHandle(file.name);
  const metadata = await current.getFile();
  if (metadata.size !== file.size || metadata.lastModified !== file.lastModified) return null;
  if (file.duplicateGroup && `${metadata.size}:${await fullHash(metadata)}` !== file.duplicateGroup) return null;
  return metadata;
}

export async function deleteSelectedFiles(
  root: FileSystemDirectoryHandle,
  selectedFiles: ScanFile[],
  scannedFiles: ScanFile[] = selectedFiles,
) {
  const permission = await (root as WritableDirectory).requestPermission({ mode: "readwrite" });
  if (permission !== "granted") throw new Error("Izin tulis tidak diberikan. Tidak ada file yang dihapus.");
  const deleted = new Set<string>();
  const failures: string[] = [];
  const selectedIds = new Set(selectedFiles.map((file) => file.id));
  const verifiedGroups = new Map<string, boolean>();
  let bytes = 0;
  for (const file of selectedFiles) {
    try {
      if (!file.parentDirectory) throw new Error("Handle folder tidak tersedia");
      if (file.duplicateGroup) {
        let hasKeeper = verifiedGroups.get(file.duplicateGroup);
        if (hasKeeper === undefined) {
          hasKeeper = false;
          const otherCopies = scannedFiles.filter((other) =>
            other.duplicateGroup === file.duplicateGroup && !selectedIds.has(other.id),
          );
          for (const other of otherCopies) {
            try {
              if (await matchesScan(other)) { hasKeeper = true; break; }
            } catch { /* Try another unselected copy. */ }
          }
          verifiedGroups.set(file.duplicateGroup, hasKeeper);
        }
        if (!hasKeeper) throw new Error("Tidak ada salinan yang terverifikasi");
      }
      if (!await matchesScan(file)) throw new Error("File berubah sejak pemindaian");
      await file.parentDirectory.removeEntry(file.name);
      deleted.add(file.id);
      bytes += file.size;
    } catch {
      failures.push(file.path);
    }
  }
  return { deleted, failures, bytes };
}
