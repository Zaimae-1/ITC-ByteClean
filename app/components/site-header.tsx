import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export async function SiteHeader() {
  const client = await createSupabaseServerClient();
  const user = client ? (await client.auth.getUser()).data.user : null;
  return (
    <header className="border-b border-[#dce7e1] bg-[#f8faf8]/95">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href="/" className="flex min-h-11 items-center gap-2 text-lg font-bold tracking-tight text-[#243331]">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#2e7066] text-base text-white">B</span>
          ByteClean
        </Link>
        <nav aria-label="Navigasi utama" className="flex w-full items-center justify-between gap-2 text-sm font-semibold sm:w-auto sm:justify-start sm:gap-3">
          <Link href="/scan" className="inline-flex min-h-11 items-center rounded-lg px-2 text-[#425b55] hover:bg-[#eaf1ec] hover:text-[#24594f]">Pindai</Link>
          <Link href="/history" className="inline-flex min-h-11 items-center rounded-lg px-2 text-[#425b55] hover:bg-[#eaf1ec] hover:text-[#24594f]">Riwayat</Link>
          <Link href="/score" className="hidden min-h-11 items-center rounded-lg px-2 text-[#425b55] hover:bg-[#eaf1ec] hover:text-[#24594f] sm:inline-flex">Tentang skor</Link>
          {user ? <><Link href="/account" className="inline-flex min-h-11 items-center rounded-lg border border-[#cbd9d0] px-3 text-[#314b43] hover:bg-[#eaf1ec]">Organisasi</Link><form action={signOut}><button className="px-2 text-[#425b55] hover:text-[#24594f]">Keluar</button></form></> : <Link href="/auth" className="inline-flex min-h-11 items-center rounded-lg border border-[#cbd9d0] px-3 text-[#314b43] hover:bg-[#eaf1ec]">Masuk</Link>}
        </nav>
      </div>
    </header>
  );
}
