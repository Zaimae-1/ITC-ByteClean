import { redirect } from "next/navigation";
import { AuthForm } from "./auth-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const instant = false;

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const client = await createSupabaseServerClient();
  if (client && (await client.auth.getUser()).data.user) redirect("/account");
  const { error } = await searchParams;
  return <main className="mx-auto max-w-lg px-5 py-14"><p className="text-sm font-semibold text-[#285e53]">Akun ByteClean</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Masuk atau daftar</h1><p className="mt-3 text-slate-600">Akun diperlukan untuk organisasi dan ringkasan lintas perangkat. Pemindaian lokal tetap bisa digunakan tanpa akun.</p>{error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">Konfirmasi email gagal atau tautan sudah kedaluwarsa. Coba masuk atau daftar kembali.</p>}<AuthForm /></main>;
}
