import type { ScanFile, ScanSettings } from "./types";

export type ScanSource =
  | { kind: "directory"; handle: FileSystemDirectoryHandle }
  | { kind: "files"; entries: { file: File; path: string }[] };

export interface ScanRequest {
  type: "start";
  source: ScanSource;
  settings: ScanSettings;
}

export type ScanResponse =
  | { type: "progress"; phase: "collecting"; scannedFiles: number; skippedFiles: number }
  | { type: "progress"; phase: "hashing"; scannedFiles: number; processedBytes: number; totalBytes: number }
  | { type: "complete"; files: ScanFile[]; skippedFiles: number }
  | { type: "error"; message: string; limitExceeded?: boolean };
