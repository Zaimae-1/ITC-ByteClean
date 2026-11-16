import type { ScanFile } from "./types";

export type Zone = "green" | "yellow" | "red";

export const ZONE_LABELS: Record<Zone, string> = {
  green: "Bisa dibersihkan",
  yellow: "Periksa dulu",
  red: "Dilindungi",
};

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export function zoneForFile(file: ScanFile, candidates: ReadonlySet<string>, scannedAt: number): Zone {
  if (!candidates.has(file.id)) return "red";
  if (file.duplicateGroup && file.categories.includes("duplicate")) return "green";
  if (file.categories.includes("temporary") && file.lastModified > 0 && scannedAt - file.lastModified >= THIRTY_DAYS) return "green";
  return "yellow";
}

export function groupByZone(files: ScanFile[], candidates: ReadonlySet<string>, scannedAt: number) {
  const groups: Record<Zone, ScanFile[]> = { green: [], yellow: [], red: [] };
  for (const file of files) groups[zoneForFile(file, candidates, scannedAt)].push(file);
  return groups;
}
