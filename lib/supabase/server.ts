import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { hasSupabaseConfig, supabaseConfig } from "./config";

export async function createSupabaseServerClient() {
  if (!hasSupabaseConfig()) return null;
  const { url, key } = supabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; proxy.ts refreshes the session.
        }
      },
    },
  });
}
