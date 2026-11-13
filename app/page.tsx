import { LocalNotes } from "./local-notes";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16 sm:py-24">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">ITC ByteClean</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Project starter</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Next.js, Tailwind CSS, dan Dexie.js siap dipakai. Coba simpan catatan di bawah untuk memastikan database lokal berjalan.
        </p>
      </div>
      <LocalNotes />
    </main>
  );
}
