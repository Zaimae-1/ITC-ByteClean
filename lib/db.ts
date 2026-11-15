import Dexie, { type EntityTable } from "dexie";
import type { ScanSettings, ScanSummary } from "./scanner/types";

export interface ScanRecord {
  id?: number;
  createdAt: number;
  clientId: string;
  summary: ScanSummary;
  settings: ScanSettings;
  deletedBytes: number;
  deletedFiles: number;
  remoteId?: string;
}

export const db = new Dexie("byteclean") as Dexie & {
  scans: EntityTable<ScanRecord, "id">;
};

// Version 1 contained only the scaffold's sample notes.
db.version(1).stores({ notes: "++id, createdAt" });
db.version(2).stores({
  notes: null,
  scans: "++id, createdAt, &clientId, remoteId",
});
