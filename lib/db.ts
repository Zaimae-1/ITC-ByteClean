import Dexie, { type EntityTable } from "dexie";

export interface Note {
  id?: number;
  text: string;
  createdAt: number;
}

export const db = new Dexie("byteclean") as Dexie & {
  notes: EntityTable<Note, "id">;
};

db.version(1).stores({ notes: "++id, createdAt" });
