import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export async function SiteHeader() {
  const client = await createSupabaseServerClient();
  const user = client ? (await client.auth.getUser()).data.user : null;
  return (
    <header className="border-b border-slate-200 bg-white/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950">
          <span className="flex size-8 items-center justify-center rounded-xl bg-teal-600 text-sm text-white">B</span>
          ByteClean
        </Link>
        <nav aria-label="Navigasi utama" className="flex w-full items-center justify-between gap-3 text-sm font-medium sm:w-auto sm:justify-start sm:gap-6">
          <Link href="/scan" className="text-slate-600 hover:text-teal-700">Pindai</Link>
          <Link href="/history" className="text-slate-600 hover:text-teal-700">Riwayat</Link>
          <Link href="/score" className="hidden text-slate-600 hover:text-teal-700 sm:inline">Tentang skor</Link>
          {user ? <><Link href="/account" className="rounded-lg border border-slate-300 px-3 py-2 text-slate-800 hover:border-teal-600">Organisasi</Link><form action={signOut}><button className="text-slate-600 hover:text-teal-700">Keluar</button></form></> : <Link href="/auth" className="rounded-lg border border-slate-300 px-3 py-2 text-slate-800 hover:border-teal-600">Masuk</Link>}
        </nav>
      </div>
    </header>
  );
}
