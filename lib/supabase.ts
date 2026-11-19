
import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!raw) {
    throw new Error("Brakuje NEXT_PUBLIC_SUPABASE_URL.");
  }

  return raw
    .trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/+$/, "");
}

export function supabaseAdmin() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) throw new Error("Brakuje SUPABASE_SERVICE_ROLE_KEY.");

  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

export function supabasePublic() {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) throw new Error("Brakuje NEXT_PUBLIC_SUPABASE_ANON_KEY.");

  return createClient(url, key, {
    auth: { persistSession: false }
  });
}
