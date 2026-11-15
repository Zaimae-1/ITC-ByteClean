"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthState = { error: string; success: string };

export async function authenticate(_: AuthState, data: FormData): Promise<AuthState> {
  const client = await createSupabaseServerClient();
  if (!client) return { error: "Akun belum tersedia karena koneksi Supabase belum dikonfigurasi.", success: "" };
  const mode = data.get("mode");
  const email = String(data.get("email") ?? "").trim();
  const password = String(data.get("password") ?? "");
  if (!email.includes("@") || password.length < 8) return { error: "Isi email valid dan kata sandi minimal 8 karakter.", success: "" };
  if (mode === "signup") {
    const { error } = await client.auth.signUp({ email, password, options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    } });
    return error ? { error: error.message, success: "" } : { error: "", success: "Periksa email untuk mengonfirmasi akun, lalu masuk." };
  }
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message, success: "" };
  redirect("/account");
}

export async function signOut() {
  const client = await createSupabaseServerClient();
  await client?.auth.signOut();
  redirect("/");
}
