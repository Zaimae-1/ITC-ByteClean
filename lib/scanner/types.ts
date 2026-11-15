export const CATEGORIES = [
  "duplicate",
  "largeOld",
  "temporary",
  "oldInstaller",
  "empty",
  "namedCopy",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  duplicate: "Duplikat",
  largeOld: "Besar dan lama",
  temporary: "File sementara",
  oldInstaller: "Installer lama",
  empty: "File kosong",
  namedCopy: "Bernama salinan",
};

export interface ScanSettings {
  largeFileBytes: number;
  oldFileDays: number;
  oldInstallerDays: number;
  maxFiles: number;
}

export const DEFAULT_SETTINGS: ScanSettings = {
  largeFileBytes: 100 * 1024 * 1024,
  oldFileDays: 180,
  oldInstallerDays: 90,
  maxFiles: 10_000,
};

export interface ScanFile {
  id: string;
  name: string;
  path: string;
  size: number;
  lastModified: number;
  categories: Category[];
  duplicateGroup?: string;
  parentDirectory?: FileSystemDirectoryHandle;
}

export interface CategoryTotal {
  count: number;
  bytes: number;
}

export interface ScanSummary {
  totalFiles: number;
  totalBytes: number;
  potentialFiles: number;
  potentialBytes: number;
  score: number | null;
  categories: Record<Category, CategoryTotal>;
}
