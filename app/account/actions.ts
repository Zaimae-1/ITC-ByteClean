"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function accountError(message: string): never {
  redirect(`/account?error=${encodeURIComponent(message)}`);
}

export async function createOrganization(data: FormData) {
  const client = await createSupabaseServerClient();
  if (!client) accountError("Supabase belum dikonfigurasi.");
  const name = String(data.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 100) accountError("Nama organisasi harus 2–100 karakter.");
  const { error } = await client.rpc("create_organization", { p_name: name });
  if (error) accountError("Organisasi belum bisa dibuat. Coba nama lain atau muat ulang halaman.");
  redirect("/account");
}

export async function joinOrganization(data: FormData) {
  const client = await createSupabaseServerClient();
  if (!client) accountError("Supabase belum dikonfigurasi.");
  const code = String(data.get("code") ?? "").trim();
  const unit = String(data.get("unit") ?? "").trim();
  if (!code || unit.length > 80) accountError("Isi kode undangan dan unit yang valid.");
  const { error } = await client.rpc("join_organization", { p_code: code, p_unit: unit });
  if (error) accountError("Kode tidak tersedia atau sudah kedaluwarsa. Minta kode baru kepada admin.");
  redirect("/account");
}
