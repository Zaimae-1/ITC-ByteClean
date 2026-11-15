import {
  CATEGORIES,
  type Category,
  type ScanFile,
  type ScanSettings,
  type ScanSummary,
} from "./types";

type FileMetadata = Pick<ScanFile, "name" | "size" | "lastModified">;

export function classifyFile(
  file: FileMetadata,
  settings: ScanSettings,
  now = Date.now(),
): Category[] {
  const categories: Category[] = [];
  const ageDays = (now - file.lastModified) / 86_400_000;
  const hasValidDate = file.lastModified > 0 && file.lastModified <= now;

  if (hasValidDate && file.size >= settings.largeFileBytes && ageDays >= settings.oldFileDays) {
    categories.push("largeOld");
  }
  if (/\.(tmp|temp|part|crdownload)$/i.test(file.name) || /^~\$/.test(file.name)) {
    categories.push("temporary");
  }
  if (
    hasValidDate &&
    ageDays >= settings.oldInstallerDays &&
    (/\.(msi|dmg|pkg|deb|rpm|apk)$/i.test(file.name) ||
      /(?:setup|installer?|install)[\w .-]*\.exe$/i.test(file.name))
  ) {
    categories.push("oldInstaller");
  }
  if (file.size === 0) categories.push("empty");
  if (/(?:^|[\s._(-])(?:copy|salinan)(?:[\s._)-]|$)/i.test(file.name)) {
    categories.push("namedCopy");
  }
  return categories;
}

export function potentialFileIds(
  files: ScanFile[],
  ignoredIds: ReadonlySet<string> = new Set(),
): Set<string> {
  const ids = new Set<string>();
  const groups = new Map<string, ScanFile[]>();

  for (const file of files) {
    if (!ignoredIds.has(file.id) && file.categories.some((category) => category !== "duplicate")) {
      ids.add(file.id);
    }
    if (file.duplicateGroup) {
      const group = groups.get(file.duplicateGroup) ?? [];
      group.push(file);
      groups.set(file.duplicateGroup, group);
    }
  }

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const ordered = [...group].sort((a, b) => a.path.localeCompare(b.path));
    const keeper = ordered.find((file) => ignoredIds.has(file.id)) ?? ordered[0];
    for (const file of ordered) {
      if (file.id !== keeper.id && !ignoredIds.has(file.id)) ids.add(file.id);
    }
    // A duplicate can also belong to another category. Keep one copy regardless.
    ids.delete(keeper.id);
  }
  return ids;
}

export function calculateSummary(
  files: ScanFile[],
  ignoredIds: ReadonlySet<string> = new Set(),
): ScanSummary {
  const candidates = potentialFileIds(files, ignoredIds);
  const categories = Object.fromEntries(
    CATEGORIES.map((category) => [category, { count: 0, bytes: 0 }]),
  ) as Record<Category, { count: number; bytes: number }>;
  let totalBytes = 0;
  let potentialBytes = 0;

  for (const file of files) {
    totalBytes += file.size;
    if (!candidates.has(file.id)) continue;
    potentialBytes += file.size;
    for (const category of file.categories) {
      categories[category].count += 1;
      categories[category].bytes += file.size;
    }
  }

  return {
    totalFiles: files.length,
    totalBytes,
    potentialFiles: candidates.size,
    potentialBytes,
    score: totalBytes === 0 ? null : Math.round(100 * (1 - potentialBytes / totalBytes)),
    categories,
  };
}

export function validateDeletionSelection(
  files: ScanFile[],
  selectedIds: ReadonlySet<string>,
): string | null {
  const byId = new Map(files.map((file) => [file.id, file]));
  for (const id of selectedIds) {
    if (!byId.has(id)) return "Pilihan berisi file yang tidak ada pada hasil pindai.";
  }

  const groups = new Map<string, ScanFile[]>();
  for (const file of files) {
    if (!file.duplicateGroup) continue;
    const group = groups.get(file.duplicateGroup) ?? [];
    group.push(file);
    groups.set(file.duplicateGroup, group);
  }
  for (const group of groups.values()) {
    if (group.length > 1 && group.every((file) => selectedIds.has(file.id))) {
      return "Minimal satu salinan harus dipertahankan pada setiap grup duplikat.";
    }
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length);
  return `${(bytes / 1024 ** exponent).toLocaleString("id-ID", { maximumFractionDigits: 1 })} ${units[exponent - 1]}`;
}
