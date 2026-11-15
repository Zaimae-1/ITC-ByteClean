import { redirect } from "next/navigation";
import { AuthForm } from "./auth-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AuthPage() {
  const client = await createSupabaseServerClient();
  if (client && (await client.auth.getUser()).data.user) redirect("/account");
  return <main className="mx-auto max-w-lg px-5 py-14"><p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Akun ByteClean</p><h1 className="mt-2 text-4xl font-bold">Masuk atau daftar</h1><p className="mt-3 text-slate-600">Akun diperlukan untuk organisasi dan ringkasan lintas perangkat. Pemindaian lokal tetap bisa digunakan tanpa akun.</p><AuthForm /></main>;
}
