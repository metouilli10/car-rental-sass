import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Lazily-initialized Supabase admin client. Only created when first used,
 * so the app builds even when NEXT_PUBLIC_SUPABASE_URL is not set.
 */
function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env"
      );
    }
    _client = createClient(url, key);
  }
  return _client;
}

/** @deprecated Use getSupabaseAdmin() - kept for compatibility with existing routes */
export const supabaseAdmin = {
  get storage() {
    return getSupabaseAdmin().storage;
  },
};

/**
 * Get the public URL for a file stored in Supabase Storage
 */
export function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = getSupabaseAdmin().storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
