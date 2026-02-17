import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with service role key (full storage access)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get the public URL for a file stored in Supabase Storage
 */
export function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
