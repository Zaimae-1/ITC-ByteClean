"use client";

import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function LocalNotes() {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const notes = useLiveQuery(() => db.notes.orderBy("createdAt").reverse().toArray(), []);

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;

    try {
      await db.notes.add({ text: value, createdAt: Date.now() });
      setText("");
      setError("");
    } catch {
      setError("Catatan tidak dapat disimpan. Pastikan browser mengizinkan IndexedDB.");
    }
  }

  async function deleteNote(id: number) {
    try {
      await db.notes.delete(id);
      setError("");
    } catch {
      setError("Catatan tidak dapat dihapus.");
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800">
      <h2 className="text-xl font-semibold">Catatan lokal</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Tersimpan di browser ini melalui IndexedDB.</p>
      <form onSubmit={addNote} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="note">Catatan baru</label>
        <input
          id="note"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Tulis catatan..."
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-600 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Simpan
        </button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <ul className="mt-5 space-y-2">
        {notes?.map((note) => (
          <li key={note.id} className="flex items-center justify-between gap-4 rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-900">
            <span className="break-words">{note.text}</span>
            <button type="button" onClick={() => deleteNote(note.id!)} className="shrink-0 text-sm text-red-600 hover:underline">
              Hapus
            </button>
          </li>
        ))}
      </ul>
      {notes?.length === 0 && <p className="mt-5 text-sm text-zinc-500">Belum ada catatan.</p>}
    </section>
  );
}
