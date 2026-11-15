"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Invite = { id: string; expires_at: string; max_uses: number; uses: number; revoked_at: string | null; created_at: string };

export function AdminControls({ initialInvites, settings }: {
  initialInvites: Invite[];
  settings: { large_file_bytes: number; old_file_days: number; old_installer_days: number };
}) {
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshInvites() {
    const { data, error: failure } = await createSupabaseBrowserClient().rpc("list_invites");
    if (failure) setError(failure.message);
    else setInvites((data ?? []) as Invite[]);
  }

  async function createInvite(data: FormData) {
    setBusy(true); setError(""); setCode("");
    const { data: newCode, error: failure } = await createSupabaseBrowserClient().rpc("create_invite", {
      p_max_uses: Number(data.get("maxUses")), p_valid_days: Number(data.get("validDays")),
    });
    if (failure) setError(failure.message);
    else { setCode(String(newCode)); await refreshInvites(); }
    setBusy(false);
  }

  async function revokeInvite(id: string) {
    setBusy(true); setError("");
    const { error: failure } = await createSupabaseBrowserClient().rpc("revoke_invite", { p_id: id });
    if (failure) setError(failure.message);
    else await refreshInvites();
    setBusy(false);
  }

  async function saveSettings(data: FormData) {
    setBusy(true); setError(""); setNotice("");
    const { error: failure } = await createSupabaseBrowserClient().rpc("update_organization_settings", {
      p_large_file_bytes: Math.round(Number(data.get("largeMb")) * 1024 * 1024),
      p_old_file_days: Number(data.get("oldDays")),
      p_old_installer_days: Number(data.get("installerDays")),
    });
    if (failure) setError(failure.message);
    else { setNotice("Pengaturan tersimpan untuk pemindaian berikutnya."); router.refresh(); }
    setBusy(false);
  }

  return <div className="mt-10 grid gap-6 lg:grid-cols-2">
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold">Kode undangan</h2>
      <p className="mt-2 text-sm text-slate-600">Bagikan kode hanya kepada anggota organisasi. Kode baru terlihat sekali di sini.</p>
      <form action={createInvite} className="mt-5 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">Maks. pemakaian<input name="maxUses" type="number" min="1" max="1000" defaultValue="10" className="w-36 rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm">Berlaku (hari)<input name="validDays" type="number" min="1" max="30" defaultValue="7" className="w-36 rounded-lg border border-slate-300 px-3 py-2" /></label>
        <button disabled={busy} className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Buat kode</button>
      </form>
      {code && <div className="mt-4 rounded-lg bg-teal-50 p-4"><p className="text-sm text-teal-900">Salin kode ini sekarang:</p><p className="mt-1 break-all font-mono text-lg font-bold text-teal-950">{code}</p></div>}
      <div className="mt-5 space-y-2">
        {invites.length === 0 && <p className="text-sm text-slate-500">Belum ada undangan.</p>}
        {invites.map((invite) => <div key={invite.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"><span>{invite.uses}/{invite.max_uses} dipakai · {invite.revoked_at ? "Dicabut" : new Date(invite.expires_at) < new Date() ? "Kedaluwarsa" : `sampai ${new Date(invite.expires_at).toLocaleDateString("id-ID")}`}</span>{!invite.revoked_at && <button type="button" disabled={busy} onClick={() => revokeInvite(invite.id)} className="font-semibold text-red-700 disabled:opacity-50">Cabut</button>}</div>)}
      </div>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold">Ambang pemindaian</h2>
      <p className="mt-2 text-sm text-slate-600">Berlaku saat anggota memulai pindai berikutnya.</p>
      <form action={saveSettings} className="mt-5 grid gap-4">
        <label className="grid gap-1 text-sm">Ukuran file besar (MB)<input name="largeMb" type="number" min="1" max="102400" defaultValue={settings.large_file_bytes / 1024 / 1024} className="rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm">Usia file lama (hari)<input name="oldDays" type="number" min="1" max="3650" defaultValue={settings.old_file_days} className="rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm">Usia installer lama (hari)<input name="installerDays" type="number" min="1" max="3650" defaultValue={settings.old_installer_days} className="rounded-lg border border-slate-300 px-3 py-2" /></label>
        <button disabled={busy} className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Simpan pengaturan</button>
      </form>
    </section>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 lg:col-span-2">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-teal-50 p-4 text-sm text-teal-800 lg:col-span-2">{notice}</p>}
  </div>;
}
